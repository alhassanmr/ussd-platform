package com.ussdplatform.repository;

import com.ussdplatform.model.NotificationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface NotificationLogRepository extends JpaRepository<NotificationLog, UUID> {
    List<NotificationLog> findByTenantIdOrderBySentAtDesc(UUID tenantId);
}
