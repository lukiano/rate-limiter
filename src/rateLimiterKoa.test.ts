import * as Koa from 'koa';

import { RateLimiter } from './rateLimiter';
import { LocalRateLimiter } from './localRateLimiter';
import {
  injectRateLimiter,
  RateLimiterContext,
  RateLimiterKoa,
  rateLimiterMiddleware,
  user,
  weightOf
} from './rateLimiterKoa';

describe('injectRateLimiter', () => {

  it('adds a LocalRateLimiter to a Koa context', () => {
    const koa: RateLimiterKoa = new Koa();
    injectRateLimiter(koa);
    expect(koa.context.rateLimiter).toBeInstanceOf(LocalRateLimiter);
  });

  it('is idempotent', () => {
    const koa: RateLimiterKoa = new Koa();
    injectRateLimiter(koa);
    const { rateLimiter } = koa.context;
    injectRateLimiter(koa);
    expect(koa.context.rateLimiter).toBe(rateLimiter);
  });

});

describe('weightOf', () => {

  it('returns 1 for GET methods', () => {
    expect(weightOf({ request: { method: 'GET' } } as RateLimiterContext)).toEqual(1);
  });

  it('returns 1 for HEAD methods', () => {
    expect(weightOf({ request: { method: 'HEAD' } } as RateLimiterContext)).toEqual(1);
  });

  it('returns 3 for other methods', () => {
    expect(weightOf({ request: { method: 'PUT' } } as RateLimiterContext)).toEqual(3);
  });

});

describe('user', () => {

  it('returns the IP address', () => {
    const ip = '127.0.0.1';
    expect(user({ request: { ip } } as RateLimiterContext)).toEqual(ip);
  });

});

class MockRateLimiter extends RateLimiter {
  addEvent = jest.fn();
  thresholdPassed = jest.fn();
}

describe('rateLimiterMiddleware', () => {
  it('fails when a Rate Limiter is not provided', async () => {
    const ctx = {} as RateLimiterContext;
    const next = jest.fn();
    await expect(rateLimiterMiddleware(ctx, next)).rejects.toThrow();
  });
  it('calls Rate Limiter and next function if request is allowed', async () => {
    const rateLimiter = new MockRateLimiter();
    const ip = 'ip-address';
    const method = 'GET';
    rateLimiter.thresholdPassed.mockResolvedValue(false);
    const request = {
      method,
      ip
    }
    const ctx = {
      rateLimiter,
      request
    } as any as RateLimiterContext;
    const next = jest.fn();
    await rateLimiterMiddleware(ctx, next);
    expect(rateLimiter.addEvent).toBeCalledWith(ip, 1);
    expect(rateLimiter.thresholdPassed).toBeCalled();
    expect(next).toBeCalled();
  });
  it('calls Rate Limiter and throws if request is rejected', async () => {
    const rateLimiter = new MockRateLimiter();
    const ip = 'ip-address';
    const method = 'POST';
    rateLimiter.thresholdPassed.mockResolvedValue(true);
    const request = {
      method,
      ip
    }
    const ctx = {
      rateLimiter,
      request
    } as any as RateLimiterContext;
    const next = jest.fn();
    await expect(rateLimiterMiddleware(ctx, next)).rejects.toThrow();
    expect(rateLimiter.addEvent).toBeCalledWith(ip, 3);
    expect(rateLimiter.thresholdPassed).toBeCalled();
    expect(next).not.toBeCalled();
  });
});
