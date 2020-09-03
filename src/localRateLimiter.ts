import { RateLimiter } from './rateLimiter';

class Event {
  constructor(
    public readonly user: string,
    public readonly timestamp: number,
  ) {
  }
  static deserialize(serialized: string): Event {
    const [user, timestamp] = serialized.split(':');
    return new Event(user, parseInt(timestamp));
  }
  serialize(): string {
    return `${this.user}:${this.timestamp}`;
  }
}

/**
 * Local implementation of Rate Limiter.
 */
export class LocalRateLimiter extends RateLimiter {
  static MAX_WINDOW_SIZE = 60 * 60 * 24 // 1 day max

  static MAX_ALLOWED_WEIGHT = 1e7;

  private readonly start = process.hrtime();

  private readonly events = new Map<string, number>();

  constructor(
    private readonly maxWeightAllowedInWindow: number,
    private readonly windowSizeInSeconds: number,
  ) {
    super();
    if (windowSizeInSeconds > LocalRateLimiter.MAX_WINDOW_SIZE) {
      throw new Error('Window size too large');
    }
    if (maxWeightAllowedInWindow > LocalRateLimiter.MAX_ALLOWED_WEIGHT) {
      throw new Error('Allowed weight too much');
    }
  }

  /**
   * Current time in seconds
   * @returns {number}
   */
  now(): number {
    const [seconds] = process.hrtime(this.start);
    return seconds;
  }

  /**
   * Erase events that fell out of the window.
   */
  prune(): void {
    let beginOfWindow = this.now() - this.windowSizeInSeconds;
    if (beginOfWindow < 0) {
      beginOfWindow = 0;
    }
    for (const serializedEvent of this.events.keys()) {
      const event = Event.deserialize(serializedEvent);
      if (event.timestamp < beginOfWindow) {
        this.events.delete(serializedEvent);
      }
    }
  }

  protected async addEvent(user: string, weight: number): Promise<void> {
    if (await this.thresholdPassed()) {
      // No current need to add more events.
      return;
    }
    const event = new Event(user, this.now());
    const serializedEvent = event.serialize();
    const currentValueForEvent = this.events.get(serializedEvent);
    if (currentValueForEvent) {
      this.events.set(serializedEvent, currentValueForEvent + weight);
    } else {
      this.events.set(serializedEvent, weight);
    }
  }

  protected async thresholdPassed(): Promise<boolean> {
    this.prune();
    let totalWeight = 0;
    for (const weight of this.events.values()) {
      totalWeight += weight;
    }
    return totalWeight > this.maxWeightAllowedInWindow;
  }
}

module.exports = {
  LocalRateLimiter,
};
