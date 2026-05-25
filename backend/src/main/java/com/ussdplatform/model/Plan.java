package com.ussdplatform.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "plans")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Plan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String name; // FREE, BASIC, PRO, ENTERPRISE

    @Column(name = "display_name", nullable = false)
    private String displayName;

    @Column(name = "price_ghs", nullable = false)
    private BigDecimal priceGhs = BigDecimal.ZERO;

    @Column(name = "max_apps", nullable = false)
    private int maxApps = 1;

    @Column(name = "max_sessions", nullable = false)
    private int maxSessions = 500; // -1 = unlimited

    @Column(name = "extra_session_fee")
    private BigDecimal extraSessionFee = BigDecimal.ZERO;

    @Column(name = "is_active")
    private boolean isActive = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
