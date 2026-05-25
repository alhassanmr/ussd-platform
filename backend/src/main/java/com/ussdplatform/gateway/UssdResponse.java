package com.ussdplatform.gateway;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UssdResponse {
    private String message;
    private boolean shouldContinue; // true = CON (continue), false = END
}
