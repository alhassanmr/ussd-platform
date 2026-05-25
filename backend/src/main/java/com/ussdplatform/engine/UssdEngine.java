package com.ussdplatform.engine;

import com.ussdplatform.gateway.UssdRequest;
import com.ussdplatform.gateway.UssdResponse;
import com.ussdplatform.model.*;
import com.ussdplatform.repository.MenuRepository;
import com.ussdplatform.repository.UssdSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * The core USSD processing engine.
 *
 * Flow:
 *  1. Receive normalized UssdRequest
 *  2. Load or create session
 *  3. Determine current menu position
 *  4. Process user input
 *  5. Navigate to next menu item
 *  6. Build and return UssdResponse
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UssdEngine {

    private final UssdSessionRepository sessionRepository;
    private final MenuRepository menuRepository;
    private final SessionCache sessionCache;
    private final WebClient.Builder webClientBuilder;

    @Transactional
    public UssdResponse process(UssdApp app, UssdRequest request) {
        log.debug("Processing USSD [{}] session={} input='{}'",
                app.getName(), request.getSessionId(), request.getInput());

        // Load or create session
        UssdSession session = loadOrCreateSession(app, request);

        // Handle first dial — show root menu
        if (request.isNew() || session.getCurrentMenu() == null) {
            Menu rootMenu = menuRepository.findRootMenuByAppId(app.getId())
                    .orElseThrow(() -> new RuntimeException("No root menu configured for app: " + app.getId()));
            session.setCurrentMenu(rootMenu);
            session.setCurrentItem(null);
            sessionRepository.save(session);
            return buildMenuResponse(rootMenu, session);
        }

        // Process user input against current menu
        return handleInput(session, request.getInput());
    }

    private UssdResponse handleInput(UssdSession session, String input) {
        Menu currentMenu = session.getCurrentMenu();
        List<MenuItem> items = currentMenu.getItems();

        // Find which item to process based on input
        if (input == null || input.isBlank()) {
            return buildMenuResponse(currentMenu, session);
        }

        // Try to match input as a numbered selection
        try {
            int choice = Integer.parseInt(input.trim());
            if (choice >= 1 && choice <= items.size()) {
                MenuItem selected = items.get(choice - 1);
                return processItem(selected, session, input);
            } else {
                return UssdResponse.builder()
                        .message("Invalid option. Please try again.\n\n" + buildMenuText(currentMenu, session))
                        .shouldContinue(true)
                        .build();
            }
        } catch (NumberFormatException e) {
            // Input is free text — find the current INPUT item waiting for it
            MenuItem currentItem = session.getCurrentItem();
            if (currentItem != null && currentItem.getItemType() == MenuItem.ItemType.INPUT) {
                return processInputItem(currentItem, session, input);
            }
            return UssdResponse.builder()
                    .message("Invalid input. Please try again.\n\n" + buildMenuText(currentMenu, session))
                    .shouldContinue(true)
                    .build();
        }
    }

    private UssdResponse processItem(MenuItem item, UssdSession session, String input) {
        return switch (item.getItemType()) {
            case DISPLAY -> {
                session.setCurrentItem(item);
                sessionRepository.save(session);
                // Navigate to linked menu or show sub-items
                if (item.getNextMenu() != null) {
                    session.setCurrentMenu(item.getNextMenu());
                    sessionRepository.save(session);
                    yield buildMenuResponse(item.getNextMenu(), session);
                }
                yield buildMenuResponse(session.getCurrentMenu(), session);
            }
            case INPUT -> {
                session.setCurrentItem(item);
                sessionRepository.save(session);
                yield UssdResponse.builder()
                        .message(item.getInputPrompt() != null ? item.getInputPrompt() : item.getLabel())
                        .shouldContinue(true)
                        .build();
            }
            case WEBHOOK -> processWebhook(item, session);
            case END -> {
                endSession(session);
                yield UssdResponse.builder()
                        .message(item.getEndMessage() != null ? item.getEndMessage() : "Thank you. Goodbye!")
                        .shouldContinue(false)
                        .build();
            }
            case ROUTER -> {
                if (item.getNextMenu() != null) {
                    session.setCurrentMenu(item.getNextMenu());
                    session.setCurrentItem(null);
                    sessionRepository.save(session);
                    yield buildMenuResponse(item.getNextMenu(), session);
                }
                yield buildMenuResponse(session.getCurrentMenu(), session);
            }
        };
    }

    private UssdResponse processInputItem(MenuItem item, UssdSession session, String input) {
        // Store the input into session data
        if (item.getVariableName() != null) {
            session.getSessionData().put(item.getVariableName(), input);
        }

        // Move to next menu if configured
        if (item.getNextMenu() != null) {
            session.setCurrentMenu(item.getNextMenu());
            session.setCurrentItem(null);
            sessionRepository.save(session);
            return buildMenuResponse(item.getNextMenu(), session);
        }

        sessionRepository.save(session);
        return buildMenuResponse(session.getCurrentMenu(), session);
    }

    private UssdResponse processWebhook(MenuItem item, UssdSession session) {
        try {
            WebClient client = webClientBuilder.build();
            String responseBody = client.method(
                            item.getWebhookMethod().equalsIgnoreCase("GET")
                                    ? org.springframework.http.HttpMethod.GET
                                    : org.springframework.http.HttpMethod.POST)
                    .uri(item.getWebhookUrl())
                    .bodyValue(session.getSessionData())
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            // Navigate to next menu after webhook
            if (item.getNextMenu() != null) {
                session.setCurrentMenu(item.getNextMenu());
                session.setCurrentItem(null);
                sessionRepository.save(session);
                return buildMenuResponse(item.getNextMenu(), session);
            }

            return UssdResponse.builder()
                    .message(responseBody != null ? responseBody : "Done.")
                    .shouldContinue(item.getNextMenu() != null)
                    .build();
        } catch (Exception e) {
            log.error("Webhook call failed for item {}", item.getId(), e);
            return UssdResponse.builder()
                    .message("Service temporarily unavailable. Please try again.")
                    .shouldContinue(false)
                    .build();
        }
    }

    private UssdResponse buildMenuResponse(Menu menu, UssdSession session) {
        return UssdResponse.builder()
                .message(buildMenuText(menu, session))
                .shouldContinue(true)
                .build();
    }

    private String buildMenuText(Menu menu, UssdSession session) {
        StringBuilder sb = new StringBuilder();
        List<MenuItem> items = menu.getItems();

        for (int i = 0; i < items.size(); i++) {
            MenuItem item = items.get(i);
            if (item.getItemType() == MenuItem.ItemType.END ||
                item.getItemType() == MenuItem.ItemType.DISPLAY ||
                item.getItemType() == MenuItem.ItemType.ROUTER ||
                item.getItemType() == MenuItem.ItemType.WEBHOOK ||
                item.getItemType() == MenuItem.ItemType.INPUT) {
                sb.append(i + 1).append(". ").append(
                        interpolateVariables(item.getLabel(), session.getSessionData()));
                if (i < items.size() - 1) sb.append("\n");
            }
        }
        return sb.toString().trim();
    }

    /**
     * Replace {{variableName}} placeholders in text with session data values.
     */
    private String interpolateVariables(String text, java.util.Map<String, String> data) {
        if (text == null || data == null) return text;
        for (Map.Entry<String, String> entry : data.entrySet()) {
            text = text.replace("{{" + entry.getKey() + "}}", entry.getValue());
        }
        return text;
    }

    private UssdSession loadOrCreateSession(UssdApp app, UssdRequest request) {
        return sessionRepository.findBySessionId(request.getSessionId())
                .orElseGet(() -> {
                    UssdSession s = UssdSession.builder()
                            .sessionId(request.getSessionId())
                            .app(app)
                            .msisdn(request.getMsisdn())
                            .status(UssdSession.SessionStatus.ACTIVE)
                            .build();
                    return sessionRepository.save(s);
                });
    }

    private void endSession(UssdSession session) {
        session.setStatus(UssdSession.SessionStatus.COMPLETED);
        session.setEndedAt(LocalDateTime.now());
        sessionRepository.save(session);
    }
}
