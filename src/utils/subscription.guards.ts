import { SubscriptionStatus } from '../models/subscription.model';
import { AppError } from '../errors/app.error';

export class InvalidStateTransitionError extends AppError {
  constructor(from: SubscriptionStatus, to: SubscriptionStatus) {
    super(`Cannot transition from '${from}' to '${to}'`, 422);
  }
}

// Every entry [from, to] represents an allowed transition.
const VALID_TRANSITIONS: ReadonlyArray<readonly [SubscriptionStatus, SubscriptionStatus]> = [
  ['trialing', 'active'],
  ['active', 'past_due'],
  ['past_due', 'active'],
  ['active', 'cancelled'],
  ['past_due', 'cancelled'],
];

export function isValidTransition(from: SubscriptionStatus, to: SubscriptionStatus): boolean {
  return VALID_TRANSITIONS.some(([f, t]) => f === from && t === to);
}

export function assertValidTransition(from: SubscriptionStatus, to: SubscriptionStatus): void {
  if (!isValidTransition(from, to)) {
    throw new InvalidStateTransitionError(from, to);
  }
}
