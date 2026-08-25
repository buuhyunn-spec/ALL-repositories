import { CalendlyPayload, CalendlyScheduledEvent } from "../types";

// ─────────────────────────────────────────────
// Extract Google Meet URL from Calendly payload
// ─────────────────────────────────────────────

export function extractMeetUrl(
  scheduledEvent: CalendlyScheduledEvent
): string {
  const location = scheduledEvent.location;

  if (location?.type === "google_meet" && location.join_url) {
    return location.join_url;
  }

  if (location?.data?.url) {
    return location.data.url;
  }

  console.error("[calendly] Could not extract Meet URL:", JSON.stringify(location));
  throw new Error("Missing Google Meet URL in Calendly payload");
}

// ─────────────────────────────────────────────
// Parse invitee URI to extract ID
// e.g. https://api.calendly.com/scheduled_events/UUID/invitees/UUID
// ─────────────────────────────────────────────

export function parseInviteeId(uri: string): string {
  const parts = uri.split("/");
  return parts[parts.length - 1];
}
