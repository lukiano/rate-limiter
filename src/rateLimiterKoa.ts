import * as Koa from 'koa';

import { LocalRateLimiter } from './localRateLimiter';
import { RateLimiter } from './rateLimiter';

export type RateLimiterContext = Koa.ParameterizedContext<Koa.DefaultState, Koa.DefaultContext & {
  rateLimiter: RateLimiter;
}>;

export type RateLimiterKoa = Koa<Koa.DefaultState, RateLimiterContext>;

/**
 * add Rate Limiter implementation to Koa
 * @param koa the Koa Application
 */
export function injectRateLimiter(koa: RateLimiterKoa): void {
  if (!koa.context.rateLimiter) {
    // eslint-disable-next-line no-param-reassign
    koa.context.rateLimiter = new LocalRateLimiter(100, 60 * 60 * 24);
  }
}

/**
 * Calculates the weight of the request.
 * This implementation assumes that
 * READ requests have a weight of 1 and UPDATE requests a weight of 3.
 * @param ctx Koa Context
 * @returns {number} to be used as argument of RateLimiter#shouldReject
 */
export function weightOf(ctx: Koa.Context): number {
  const method = ctx.request.method.toUpperCase();
  return method === 'GET' || method === 'HEAD' ? 1 : 3;
}


/**
 * Retrieves the user identifier for a request.
 * Currently mapped to the IP address of the request.
 * @param ctx Koa Context
 */
export function user(ctx: Koa.Context): string {
  return ctx.request.ip;
}

/**
 * Rate Limiter middleware. Assumes that a RateLimiter has been added to Koa.
 * @param ctx Koa Context
 * @param next function to continue the chain.
 * @returns {Promise<void>}
 */
export async function rateLimiterMiddleware(
  ctx: RateLimiterContext,
  next: () => Promise<void>,
): Promise<void> {
  if (await ctx.rateLimiter.shouldReject(user(ctx), weightOf(ctx))) {
    ctx.throw(429);
  }
  await next();
}
