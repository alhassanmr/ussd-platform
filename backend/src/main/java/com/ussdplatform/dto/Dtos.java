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
public class RegisterRequest {
    @NotBlank @Email public String email;
    @NotBlank @Size(min = 6) public String password;
    @NotBlank public String fullName;
    @NotBlank public String companyName;
    public String phone;
}

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class LoginRequest {
    @NotBlank @Email public String email;
    @NotBlank public String password;
}

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class AuthResponse {
    public String token;
    public UserDto user;
    public String error;
}

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class UserDto {
    public UUID id;
    public String email;
    public String fullName;
    public String role;
    public UUID tenantId;
    public String tenantName;
    public String tenantSlug;
    public String plan;
}

// ===== Apps =====

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class CreateAppRequest {
    @NotBlank public String name;
    public String description;
    public String shortCode;
    @NotBlank public String gatewayType;
    public Map<String, String> gatewayConfig;
}

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class UpdateAppRequest {
    public String name;
    public String description;
    public String shortCode;
    public String status;
    public Map<String, String> gatewayConfig;
}

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class AppDto {
    public UUID id;
    public String name;
    public String description;
    public String shortCode;
    public String gatewayType;
    public String status;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;
}

// ===== Menus =====

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class CreateMenuRequest {
    @NotBlank public String name;
    public boolean root;
}

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class UpdateMenuRequest {
    public String name;
    public boolean root;
}

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class MenuDto {
    public UUID id;
    public String name;
    public boolean root;
    public List<MenuItemDto> items;
    public LocalDateTime createdAt;
}

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class CreateMenuItemRequest {
    @NotBlank public String itemType;
    @NotBlank public String label;
    public String inputPrompt;
    public String variableName;
    public UUID nextMenuId;
    public String webhookUrl;
    public String webhookMethod;
    public String endMessage;
    public int displayOrder;
}

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class UpdateMenuItemRequest {
    public String label;
    public String inputPrompt;
    public String variableName;
    public UUID nextMenuId;
    public String webhookUrl;
    public String endMessage;
    public Integer displayOrder;
}

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class MenuItemDto {
    public UUID id;
    public String itemType;
    public String label;
    public String inputPrompt;
    public String variableName;
    public UUID nextMenuId;
    public String webhookUrl;
    public String endMessage;
    public int displayOrder;
}
