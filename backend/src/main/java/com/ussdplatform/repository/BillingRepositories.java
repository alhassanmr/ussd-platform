package com.ussdplatform.repository;

import com.ussdplatform.model.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PlanRepository extends JpaRepository<Plan, UUID> {
    Optional<Plan> findByName(String name);
    List<Plan> findByIsActiveTrue();
}

public interface SubscriptionRepository extends JpaRepository<Subscription, UUID> {
    Optional<Subscription> findByTenantId(UUID tenantId);
    List<Subscription> findByStatus(Subscription.SubscriptionStatus status);
    Optional<Subscription> findByPaystackSubCode(String subCode);
}

public interface UsageRecordRepository extends JpaRepository<UsageRecord, UUID> {
    Optional<UsageRecord> findByTenantIdAndAppIdAndPeriodYearAndPeriodMonth(
            UUID tenantId, UUID appId, int year, int month);

    List<UsageRecord> findByTenantIdAndPeriodYearAndPeriodMonth(
            UUID tenantId, int year, int month);

    @Query("SELECT SUM(u.sessionCount) FROM UsageRecord u WHERE u.tenant.id = :tenantId AND u.periodYear = :year AND u.periodMonth = :month")
    Optional<Long> sumSessionsByTenantAndPeriod(UUID tenantId, int year, int month);
}

public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {
    List<Invoice> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);
    Optional<Invoice> findByPaystackRef(String ref);
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);
    List<Invoice> findByStatus(Invoice.InvoiceStatus status);
    List<Invoice> findByStatusAndCreatedAtAfter(Invoice.InvoiceStatus status, LocalDateTime after);
}

public interface AdminUserRepository extends JpaRepository<AdminUser, UUID> {
    Optional<AdminUser> findByEmail(String email);
    boolean existsByEmail(String email);
}
