type AttemptBucket = { count: number; resetAt: number };

export class LoginThrottle {
  private readonly attempts = new Map<string, AttemptBucket>();
  private readonly limit: number;
  private readonly windowMs: number;
  private readonly maxEntries: number;

  constructor(
    limit = 10,
    windowMs = 15 * 60 * 1000,
    maxEntries = 5000,
  ) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.maxEntries = maxEntries;
  }

  isLimited(ip: string, email: string, now = Date.now()): boolean {
    return [this.ipKey(ip), this.accountKey(ip, email)].some((key) => {
      const bucket = this.attempts.get(key);
      return Boolean(bucket && bucket.resetAt > now && bucket.count >= this.limit);
    });
  }

  recordFailure(ip: string, email: string, now = Date.now()): void {
    this.increment(this.ipKey(ip), now);
    this.increment(this.accountKey(ip, email), now);
  }

  clearAccount(ip: string, email: string): void {
    this.attempts.delete(this.accountKey(ip, email));
  }

  private increment(key: string, now: number): void {
    const previous = this.attempts.get(key);
    if (!previous && this.attempts.size >= this.maxEntries) {
      for (const [entryKey, entry] of this.attempts) {
        if (entry.resetAt <= now) this.attempts.delete(entryKey);
      }
      if (this.attempts.size >= this.maxEntries) {
        const oldestKey = this.attempts.keys().next().value;
        if (oldestKey) this.attempts.delete(oldestKey);
      }
    }
    this.attempts.set(key, {
      count: previous && previous.resetAt > now ? previous.count + 1 : 1,
      resetAt: previous && previous.resetAt > now ? previous.resetAt : now + this.windowMs,
    });
  }

  private ipKey(ip: string): string {
    return `ip:${ip}`;
  }

  private accountKey(ip: string, email: string): string {
    return `account:${ip}:${email}`;
  }
}