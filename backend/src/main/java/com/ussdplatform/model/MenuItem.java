package com.ussdplatform.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "menu_items")
@Getter
@Setter
@NoArgsConstructor
@Builder
public class MenuItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "menu_id", nullable = false)
    private Menu menu;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private MenuItem parent;

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL)
    @OrderBy("displayOrder ASC")
    @Builder.Default
    private List<MenuItem> children = new ArrayList<>();

    @Column(name = "display_order")
    @Builder.Default
    private int displayOrder = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "item_type", nullable = false)
    private ItemType itemType;

    @Column(nullable = false)
    private String label;

    @Column(name = "input_prompt")
    private String inputPrompt;

    @Column(name = "variable_name")
    private String variableName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "next_menu_id")
    private Menu nextMenu;

    @Column(name = "webhook_url")
    private String webhookUrl;

    @Column(name = "webhook_method")
    @Builder.Default
    private String webhookMethod = "POST";

    @Column(name = "end_message")
    private String endMessage;

    @Column(name = "created_at", updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    void onUpdate() { this.updatedAt = LocalDateTime.now(); }

    public enum ItemType {
        DISPLAY,
        INPUT,
        ROUTER,
        WEBHOOK,
        END
    }
}
