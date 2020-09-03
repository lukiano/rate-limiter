/**
 * Rate limiter base class.
 */
export abstract class RateLimiter {

  /**
   * @param user event identifier.
   * @param weight number between 0 and 100 representing the toll on the system of this event.
   * @returns {Promise<boolean>} true if the system is overloaded and should start rejecting events.
   */
  async shouldReject(user: string, weight: number): Promise<boolean> {
    if (!user) {
      throw new Error('Invalid user');
    }
    if (!Number.isInteger(weight) || weight <= 0 || weight > 100) {
      throw new Error('Invalid weight');
    }
    await this.addEvent(user, weight);
    return this.thresholdPassed();
  }

  /**
   * Signals that a new event happened.
   * @param user event identifier.
   * @param weight number between 0 and 100 representing the toll on the system of this event.
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async addEvent(user: string, weight: number): Promise<void> {
    throw new TypeError('#addEvent Not implemented');
  }

  /**
   * System overload check.
   * @returns {Promise<boolean>} true if the system is overloaded and should start rejecting events.
   */
  protected async thresholdPassed(): Promise<boolean> {
    throw new TypeError('#thresholdPassed Not implemented');
  }
}

