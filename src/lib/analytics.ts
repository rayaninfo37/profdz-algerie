/**
 * Server-side analytics event logger for KRYTY.
 * Writes events to the existing AuditLog table.
 * Designed to be non-blocking: failures are silently caught so they
 * never interrupt the primary request flow.
 */
import { prisma } from '@/lib/db';

interface AnalyticsEvent {
  type: string;       // e.g. LOGIN | REGISTER | COMMENT_POST | REVIEW_POST | FOLLOW | PRODUCT_VIEW
  userId?: string;    // actor user id (if authenticated)
  metadata?: Record<string, unknown>;
}

export async function logAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: event.userId || 'anonymous',
        action: event.type,
        target: event.type,
        details: event.metadata ? JSON.stringify(event.metadata) : null,
      },
    });
  } catch (err) {
    // Analytics must never crash the primary request
    console.error('[ANALYTICS] Failed to log event:', event.type, err);
  }
}
