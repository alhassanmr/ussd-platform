package com.ussdplatform.repository;

import com.ussdplatform.model.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TenantRepository extends JpaRepository<Tenant, UUID> {
    boolean existsBySlug(String slug);
    Optional<Tenant> findBySlug(String slug);
    Optional<Tenant> findByEmail(String email);
    long countByStatus(Tenant.TenantStatus status);
}

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByTenantId(UUID tenantId);
}

public interface UssdAppRepository extends JpaRepository<UssdApp, UUID> {
    List<UssdApp> findByTenantId(UUID tenantId);
    Optional<UssdApp> findByIdAndTenantId(UUID id, UUID tenantId);
    boolean existsByIdAndTenantId(UUID id, UUID tenantId);
    long countByStatus(UssdApp.AppStatus status);
    long countByTenantId(UUID tenantId);
}

public interface MenuRepository extends JpaRepository<Menu, UUID> {
    List<Menu> findByAppId(UUID appId);

    @Query("SELECT m FROM Menu m WHERE m.app.id = :appId AND m.isRoot = true")
    Optional<Menu> findRootMenuByAppId(UUID appId);

    @Modifying
    @Transactional
    @Query("UPDATE Menu m SET m.isRoot = false WHERE m.app.id = :appId")
    void clearRootForApp(UUID appId);
}

public interface MenuItemRepository extends JpaRepository<MenuItem, UUID> {
    List<MenuItem> findByMenuIdOrderByDisplayOrderAsc(UUID menuId);
}

public interface UssdSessionRepository extends JpaRepository<UssdSession, UUID> {
    Optional<UssdSession> findBySessionId(String sessionId);
    List<UssdSession> findByAppIdOrderByStartedAtDesc(UUID appId);

    @Query("SELECT COUNT(s) FROM UssdSession s WHERE s.app.id = :appId AND s.status = 'ACTIVE'")
    long countActiveSessions(UUID appId);
}
