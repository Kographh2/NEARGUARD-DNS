export type EventTier = "free" | "registered";

export interface DnsEvent {
  tier: EventTier;
  userId?: string;
  deviceId?: string;
  domain?: string;
  qtype?: number;
  category?: number;
  blocked: boolean;
  rateLimited: boolean;
  country?: string;
  at: number;
}

export type EventSink = (events: readonly DnsEvent[]) => Promise<void> | void;

const MAX_BUFFER = 500;

const buffer: DnsEvent[] = [];
let sink: EventSink | undefined;

export function setEventSink(nextSink: EventSink | undefined): void {
  sink = nextSink;
}

export function recordEvent(event: DnsEvent): void {
  if (buffer.length >= MAX_BUFFER) {
    buffer.shift();
  }
  buffer.push(event);
}

export async function flushEvents(): Promise<void> {
  if (buffer.length === 0) {
    return;
  }
  const batch = buffer.splice(0, buffer.length);
  if (!sink) {
    return;
  }
  try {
    await sink(batch);
  } catch {
    return;
  }
}

export function getBufferedEventCount(): number {
  return buffer.length;
}

export function resetEventsForTests(): void {
  buffer.length = 0;
  sink = undefined;
}
