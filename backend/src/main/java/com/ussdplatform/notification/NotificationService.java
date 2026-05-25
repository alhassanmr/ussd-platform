package com.ussdplatform.notification;

import com.ussdplatform.model.Invoice;
import com.ussdplatform.model.Tenant;
import com.ussdplatform.model.NotificationLog;
import com.ussdplatform.repository.NotificationLogRepository;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final JavaMailSender mailSender;
    private final NotificationLogRepository notificationLogRepo;

    @Value("${spring.mail.from:noreply@ussdplatform.com}")
    private String fromEmail;

    @Value("${app.name:USSD Platform}")
    private String appName;

    @Async
    public void sendWelcome(Tenant tenant, String ownerName) {
        String subject = "Welcome to " + appName + " 🎉";
        String body = welcomeTemplate(ownerName, tenant.getName());
        send(tenant, tenant.getEmail(), subject, body, "WELCOME");
    }

    @Async
    public void sendUsageWarning(Tenant tenant, int used, int limit, int percentage) {
        String subject = "[" + appName + "] You've used " + percentage + "% of your monthly sessions";
        String body = usageWarningTemplate(tenant.getName(), used, limit, percentage);
        send(tenant, tenant.getEmail(), subject, body, "USAGE_WARNING");
    }

    @Async
    public void sendInvoice(Tenant tenant, Invoice invoice) {
        String subject = "[" + appName + "] Invoice " + invoice.getInvoiceNumber() + " — GHS " + invoice.getAmountGhs();
        String body = invoiceTemplate(tenant.getName(), invoice);
        send(tenant, tenant.getEmail(), subject, body, "INVOICE");
    }

    @Async
    public void sendPaymentFailed(Tenant tenant, String invoiceNumber) {
        String subject = "[Action Required] Payment failed — " + appName;
        String body = paymentFailedTemplate(tenant.getName(), invoiceNumber);
        send(tenant, tenant.getEmail(), subject, body, "PAYMENT_FAILED");
    }

    @Async
    public void sendSubscriptionCancelled(Tenant tenant) {
        String subject = "Your " + appName + " subscription has been cancelled";
        String body = cancellationTemplate(tenant.getName());
        send(tenant, tenant.getEmail(), subject, body, "SUSPENSION");
    }

    private void send(Tenant tenant, String to, String subject, String htmlBody, String type) {
        NotificationLog log = NotificationLog.builder()
                .tenant(tenant)
                .recipientEmail(to)
                .type(type)
                .subject(subject)
                .status("SENT")
                .build();
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
        } catch (Exception e) {
            log.setStatus("FAILED");
            log.setErrorMessage(e.getMessage());
            this.log.error("Failed to send {} email to {}", type, to, e);
        }
        notificationLogRepo.save(log);
    }

    // ─── Email Templates ──────────────────────────────────────────────────────

    private String welcomeTemplate(String name, String company) {
        return html("Welcome to USSD Platform!", """
            <h2>Welcome, %s! 👋</h2>
            <p>Your company <strong>%s</strong> is now set up on USSD Platform.</p>
            <p>Here's how to get started:</p>
            <ol>
              <li>Create your first USSD app from the dashboard</li>
              <li>Build your menu flow using the visual menu builder</li>
              <li>Copy your webhook URL and configure it in your gateway (Africa's Talking / Hubtel)</li>
              <li>Test by dialling your short code</li>
            </ol>
            <p>You're on the <strong>Free plan</strong> with 500 sessions/month. Upgrade anytime from your dashboard.</p>
            <a href="#" style="background:#1a1a1a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">Go to dashboard →</a>
            """.formatted(name, company));
    }

    private String usageWarningTemplate(String company, int used, int limit, int pct) {
        String color = pct >= 100 ? "#dc2626" : "#d97706";
        return html("Usage Warning", """
            <h2 style="color:%s">⚠️ You've used %d%% of your monthly sessions</h2>
            <p><strong>%s</strong> has used <strong>%s of %s sessions</strong> this month.</p>
            %s
            <a href="#" style="background:#1a1a1a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">Upgrade plan →</a>
            """.formatted(color, pct, company, used, limit,
                pct >= 100
                    ? "<p style='color:#dc2626'>You've reached your limit. Additional sessions will be charged at your plan's overage rate, or you can upgrade for a higher limit.</p>"
                    : "<p>Consider upgrading your plan to avoid interruptions.</p>"
            ));
    }

    private String invoiceTemplate(String company, Invoice invoice) {
        return html("Invoice " + invoice.getInvoiceNumber(), """
            <h2>Invoice %s</h2>
            <p>Hi <strong>%s</strong>, here is your invoice for USSD Platform.</p>
            <table style="width:100%%;border-collapse:collapse;margin:16px 0">
              <tr style="background:#f5f5f5"><th style="padding:10px;text-align:left">Description</th><th style="padding:10px;text-align:right">Amount</th></tr>
              <tr><td style="padding:10px;border-bottom:1px solid #eee">%s</td><td style="padding:10px;text-align:right;border-bottom:1px solid #eee">GHS %.2f</td></tr>
              <tr><td style="padding:10px;font-weight:bold">Total</td><td style="padding:10px;text-align:right;font-weight:bold">GHS %.2f</td></tr>
            </table>
            <p>Status: <strong>%s</strong></p>
            """.formatted(
                invoice.getInvoiceNumber(), company,
                invoice.getLineItems() != null && !invoice.getLineItems().isEmpty()
                    ? invoice.getLineItems().get(0).getDescription() : "Subscription",
                invoice.getAmountGhs(), invoice.getAmountGhs(),
                invoice.getStatus().name()
            ));
    }

    private String paymentFailedTemplate(String company, String invoiceNumber) {
        return html("Payment Failed", """
            <h2 style="color:#dc2626">⚠️ Payment Failed</h2>
            <p>Hi <strong>%s</strong>, we were unable to process payment for invoice <strong>%s</strong>.</p>
            <p>Please update your payment method to avoid service interruption.</p>
            <a href="#" style="background:#dc2626;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">Update payment →</a>
            """.formatted(company, invoiceNumber));
    }

    private String cancellationTemplate(String company) {
        return html("Subscription Cancelled", """
            <h2>Subscription Cancelled</h2>
            <p>Hi <strong>%s</strong>, your USSD Platform subscription has been cancelled.</p>
            <p>Your account has been downgraded to the Free plan (500 sessions/month).</p>
            <p>You can resubscribe at any time from your dashboard.</p>
            <a href="#" style="background:#1a1a1a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">Resubscribe →</a>
            """.formatted(company));
    }

    private String html(String title, String content) {
        return """
            <!DOCTYPE html>
            <html><head><meta charset="UTF-8"><title>%s</title></head>
            <body style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#1a1a1a">
              <div style="margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid #eee">
                <strong style="font-size:18px">📡 USSD Platform</strong>
              </div>
              %s
              <div style="margin-top:32px;padding-top:16px;border-top:1px solid #eee;font-size:12px;color:#888">
                © USSD Platform · You're receiving this because you have an account with us.
              </div>
            </body></html>
            """.formatted(title, content);
    }
}
