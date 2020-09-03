import { LocalRateLimiter } from './localRateLimiter';
import { RateLimiter } from './rateLimiter';
import { promisify } from 'util';

const delay = promisify(setTimeout);

describe('LocalRateLimiter', () => {

  it('fails to build if window size is too large', async () => {
    const maxWeight = 10;
    const windowSize = LocalRateLimiter.MAX_WINDOW_SIZE + 1;
    expect(() => new LocalRateLimiter(maxWeight, windowSize)).toThrowError('Window size too large');
  });

  it('fails to build if desired allowed weight is too much', async () => {
    const maxWeight = LocalRateLimiter.MAX_ALLOWED_WEIGHT + 1;
    const windowSize = 1000;
    expect(() => new LocalRateLimiter(maxWeight, windowSize)).toThrowError('Allowed weight too much');
  });

  it('limits according to parameters', async () => {
    jest.setTimeout(10000); // Jest's fake timers don't work on process.hrtime
    const rateLimiter: RateLimiter = new LocalRateLimiter(10, 5);
    await delay(2000); // wait some time before starting test
    const user = 'user';
    const weight = 2;

    await expect(rateLimiter.shouldReject(user, weight)).resolves.toEqual(false); // 2 load on the system
    // next event is immediate on purpose
    await expect(rateLimiter.shouldReject(user, weight)).resolves.toEqual(false); // 4 load on the system
    await delay(1000);
    await expect(rateLimiter.shouldReject(user, weight)).resolves.toEqual(false); // 4 load on the system
    // next event is immediate on purpose
    await expect(rateLimiter.shouldReject(user, weight)).resolves.toEqual(false); // 6 load on the system
    await delay(2000);
    await expect(rateLimiter.shouldReject(user, weight)).resolves.toEqual(false); // 10 load on the system
    await delay(1000);
    await expect(rateLimiter.shouldReject(user, weight)).resolves.toEqual(true); // 12 load on the system
    // next event is immediate on purpose
    await expect(rateLimiter.shouldReject(user, weight)).resolves.toEqual(true); // 14 load on the system
    await delay(3000);
    await expect(rateLimiter.shouldReject(user, weight)).resolves.toEqual(false); // reduced load on the system
  });

  it('rejects empty users', async () => {
    const rateLimiter: RateLimiter = new LocalRateLimiter(10, 1);
    const user = '';
    const weight = 2;
    await expect(rateLimiter.shouldReject(user, weight)).rejects.toThrowError('Invalid user');
  });

  it('rejects negative weights', async () => {
    const rateLimiter: RateLimiter = new LocalRateLimiter(10, 1);
    const user = 'user';
    const weight = -2;
    await expect(rateLimiter.shouldReject(user, weight)).rejects.toThrowError('Invalid weight');
  });

  it('rejects 0 weights', async () => {
    const rateLimiter: RateLimiter = new LocalRateLimiter(10, 1);
    const user = 'user';
    const weight = 0;
    await expect(rateLimiter.shouldReject(user, weight)).rejects.toThrowError('Invalid weight');
  });

  it('rejects invalid weights', async () => {
    const rateLimiter: RateLimiter = new LocalRateLimiter(10, 1);
    const user = 'user';
    const weight = 102;
    await expect(rateLimiter.shouldReject(user, weight)).rejects.toThrowError('Invalid weight');
  });

});
