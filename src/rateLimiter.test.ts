import { RateLimiter } from './rateLimiter';


class NoAddEventRateLimiter extends RateLimiter {}

class NoThresholdPassedRateLimiter extends RateLimiter {
  protected async addEvent(): Promise<void> {
    // empty block
  }
}

describe('RateLimiter', () => {

  it('does not implement #addEvent', async () => {
    const rateLimiter = new NoAddEventRateLimiter();
    await expect(rateLimiter.shouldReject('user', 100)).rejects.toThrowError('#addEvent Not implemented');
  });

  it('does not implement #thresholdPassed', async () => {
    const rateLimiter = new NoThresholdPassedRateLimiter();
    await expect(rateLimiter.shouldReject('user', 100)).rejects.toThrowError('#thresholdPassed Not implemented');
  });

});
