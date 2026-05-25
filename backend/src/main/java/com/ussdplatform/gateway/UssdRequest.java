package com.ussdplatform.gateway;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UssdRequest {
    private String sessionId;
    private String msisdn;       // caller phone number
    private String shortCode;    // USSD short code dialled
    private String input;        // user's text input (empty on first dial)
    private boolean isNew;       // true if this is the first request in the session
}
