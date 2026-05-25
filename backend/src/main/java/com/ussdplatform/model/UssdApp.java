package com.ussdplatform.model;

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Type;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "ussd_apps")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UssdApp {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(name = "short_code")
    private String shortCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "gateway_type", nullable = false)
    private GatewayType gatewayType;

    @Column(name = "gateway_config", columnDefinition = "jsonb")
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    private Map<String, String> gatewayConfig;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AppStatus status = AppStatus.DRAFT;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    void onUpdate() { this.updatedAt = LocalDateTime.now(); }

    public enum GatewayType { AFRICASTALKING, HUBTEL, CUSTOM }
    public enum AppStatus { DRAFT, ACTIVE, PAUSED }
}
