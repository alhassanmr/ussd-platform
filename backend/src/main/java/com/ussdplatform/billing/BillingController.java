package com.ussdplatform.billing;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ussdplatform.model.*;
import com.ussdplatform.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/billing")
@RequiredArgsConstructor
@Slf4j
public class BillingController {

    private final PlanRepository planRepo;
    private final SubscriptionRepository subscriptionRepo;
    private final InvoiceRepository invoiceRepo;
    private final UsageRecordRepository usageRepo;
    private final PaystackBillingService paystackService;
    private final ObjectMapper objectMapper;

    @Value("${paystack.secret-key:sk_test_placeholder}")
    private String paystackSecretKey;

    @Value("${app.base-url:http://localhost:3000}")
    private String appBaseUrl;

    // ─── Plans ────────────────────────────────────────────────────────────────

    @GetMapping("/plans")
    public List<Map<String, Object>> listPlans() {
        return planRepo.findByIsActiveTrue().stream()
                .map(p -> Map.of(
                        "id", p.getId(),
                        "name", p.getName(),
                        "displayName", p.getDisplayName(),
                        "priceGhs", p.getPriceGhs(),
                        "maxApps", p.getMaxApps(),
                        "maxSessions", p.getMaxSessions(),
                        "extraSessionFee", p.getExtraSessionFee()
                ))
                .collect(Collectors.toList());
    }

    // ─── Current Subscription ─────────────────────────────────────────────────

    @GetMapping("/subscription")
    public ResponseEntity<Map<String, Object>> getSubscription(@AuthenticationPrincipal User user) {
        return subscriptionRepo.findByTenantId(user.getTenant().getId())
                .map(sub -> ResponseEntity.ok(Map.of(
                        "id", sub.getId(),
                        "planName", sub.getPlan().getName(),
                        "planDisplayName", sub.getPlan().getDisplayName(),
                        "status", sub.getStatus().name(),
                        "currentPeriodStart", sub.getCurrentPeriodStart(),
                        "currentPeriodEnd", sub.getCurrentPeriodEnd(),
                        "maxSessions", sub.getPlan().getMaxSessions(),
                        "priceGhs", sub.getPlan().getPriceGhs()
                )))
                .orElse(ResponseEntity.ok(Map.of("planName", "FREE", "status", "TRIAL")));
    }

    // ─── Usage ────────────────────────────────────────────────────────────────

    @GetMapping("/usage")
    public Map<String, Object> getUsage(@AuthenticationPrincipal User user) {
        int year = java.time.LocalDateTime.now().getYear();
        int month = java.time.LocalDateTime.now().getMonthValue();
        long total = usageRepo.sumSessionsByTenantAndPeriod(
                user.getTenant().getId(), year, month).orElse(0L);

        int limit = subscriptionRepo.findByTenantId(user.getTenant().getId())
                .map(s -> s.getPlan().getMaxSessions()).orElse(500);

        return Map.of(
                "sessionsUsed", total,
                "sessionsLimit", limit,
                "percentageUsed", limit > 0 ? (int)((total * 100) / limit) : 0,
                "periodYear", year,
                "periodMonth", month
        );
    }

    // ─── Initiate Payment ─────────────────────────────────────────────────────

    @PostMapping("/subscribe/{planName}")
    public ResponseEntity<Map<String, String>> subscribe(
            @AuthenticationPrincipal User user,
            @PathVariable String planName) {

        Plan plan = planRepo.findByName(planName.toUpperCase()).orElse(null);
        if (plan == null) return ResponseEntity.badRequest().body(Map.of("error", "Plan not found"));

        if (plan.getPriceGhs().compareTo(java.math.BigDecimal.ZERO) == 0) {
            // Free plan — activate directly
            return ResponseEntity.ok(Map.of("message", "Switched to free plan"));
        }

        String authUrl = paystackService.initiatePayment(
                user.getTenant(), plan,
                appBaseUrl + "/billing/verify"
        );

        return ResponseEntity.ok(Map.of("authorizationUrl", authUrl));
    }

    // ─── Verify Payment ───────────────────────────────────────────────────────

    @GetMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyPayment(@RequestParam String reference) {
        boolean success = paystackService.verifyAndActivate(reference);
        return ResponseEntity.ok(Map.of("success", success));
    }

    // ─── Invoices ─────────────────────────────────────────────────────────────

    @GetMapping("/invoices")
    public List<Map<String, Object>> getInvoices(@AuthenticationPrincipal User user) {
        return invoiceRepo.findByTenantIdOrderByCreatedAtDesc(user.getTenant().getId())
                .stream()
                .map(inv -> Map.of(
                        "id", inv.getId(),
                        "invoiceNumber", inv.getInvoiceNumber(),
                        "amountGhs", inv.getAmountGhs(),
                        "status", inv.getStatus().name(),
                        "createdAt", inv.getCreatedAt(),
                        "paidAt", inv.getPaidAt() != null ? inv.getPaidAt() : "N/A"
                ))
                .collect(Collectors.toList());
    }

    // ─── Paystack Webhook ─────────────────────────────────────────────────────

    @PostMapping("/paystack/webhook")
    public ResponseEntity<String> paystackWebhook(
            @RequestHeader("x-paystack-signature") String signature,
            @RequestBody String payload) {

        // Verify webhook signature
        if (!verifyPaystackSignature(payload, signature)) {
            log.warn("Invalid Paystack webhook signature");
            return ResponseEntity.status(401).body("Invalid signature");
        }

        try {
            JsonNode node = objectMapper.readTree(payload);
            String event = node.path("event").asText();
            JsonNode data = node.path("data");
            paystackService.handleWebhook(event, data);
        } catch (Exception e) {
            log.error("Error processing Paystack webhook", e);
        }

        return ResponseEntity.ok("OK");
    }

    private boolean verifyPaystackSignature(String payload, String signature) {
        try {
            Mac sha512 = Mac.getInstance("HmacSHA512");
            sha512.init(new SecretKeySpec(paystackSecretKey.getBytes(), "HmacSHA512"));
            byte[] hash = sha512.doFinal(payload.getBytes());
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) hex.append(String.format("%02x", b));
            return hex.toString().equals(signature);
        } catch (Exception e) {
            return false;
        }
    }
}
