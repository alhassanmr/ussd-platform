package com.ussdplatform.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

// ===== Auth =====

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
class RegisterRequest {
    @NotBlank @Email String email;
    @NotBlank @Size(min = 6) String password;
    @NotBlank String fullName;
    @NotBlank String companyName;
    String phone;
}

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
class LoginRequest {
    @NotBlank @Email String email;
    @NotBlank String password;
}

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
class AuthResponse {
    String token;
    UserDto user;
    String error;
}

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
class UserDto {
    UUID id;
    String email;
    String fullName;
    String role;
    UUID tenantId;
    String tenantName;
    String tenantSlug;
    String plan;
}

// ===== Apps =====

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
class CreateAppRequest {
    @NotBlank String name;
    String description;
    String shortCode;
    @NotBlank String gatewayType;
    Map<String, String> gatewayConfig;
}

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
class UpdateAppRequest {
    String name;
    String description;
    String shortCode;
    String status;
    Map<String, String> gatewayConfig;
}

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
class AppDto {
    UUID id;
    String name;
    String description;
    String shortCode;
    String gatewayType;
    String status;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}

// ===== Menus =====

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
class CreateMenuRequest {
    @NotBlank String name;
    boolean root;
}

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
class UpdateMenuRequest {
    String name;
    boolean root;
}

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
class MenuDto {
    UUID id;
    String name;
    boolean root;
    List<MenuItemDto> items;
    LocalDateTime createdAt;
}

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
class CreateMenuItemRequest {
    @NotBlank String itemType;
    @NotBlank String label;
    String inputPrompt;
    String variableName;
    UUID nextMenuId;
    String webhookUrl;
    String webhookMethod;
    String endMessage;
    int displayOrder;
}

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
class UpdateMenuItemRequest {
    String label;
    String inputPrompt;
    String variableName;
    UUID nextMenuId;
    String webhookUrl;
    String endMessage;
    Integer displayOrder;
}

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
class MenuItemDto {
    UUID id;
    String itemType;
    String label;
    String inputPrompt;
    String variableName;
    UUID nextMenuId;
    String webhookUrl;
    String endMessage;
    int displayOrder;
}
