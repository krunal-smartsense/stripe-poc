// ---------------------------------------------------------------------------
// Discriminated union: every variant shares `type` as a literal string tag.
// TypeScript narrows the full shape inside each case arm — no optional fields,
// no runtime confusion about which fields are present.
// ---------------------------------------------------------------------------

export type PaymentSucceededEvent = {
  type: 'payment.succeeded';
  invoiceId: string;
  amount: number;
  currency: string;
  subscriptionId: string;
};

export type PaymentFailedEvent = {
  type: 'payment.failed';
  invoiceId: string;
  failureCode: string;
  failureMessage: string;
  subscriptionId: string;
};

export type PaymentRefundedEvent = {
  type: 'payment.refunded';
  invoiceId: string;
  refundId: string;
  amount: number;
  subscriptionId: string;
};

export type PaymentEvent = PaymentSucceededEvent | PaymentFailedEvent | PaymentRefundedEvent;

// ---------------------------------------------------------------------------
// Type guard — validates that an unknown value is a well-formed PaymentEvent.
// ---------------------------------------------------------------------------

const PAYMENT_EVENT_TYPES = new Set<string>([
  'payment.succeeded',
  'payment.failed',
  'payment.refunded',
]);

function hasStringField(obj: Record<string, unknown>, key: string): boolean {
  return typeof obj[key] === 'string';
}

export function isPaymentEvent(e: unknown): e is PaymentEvent {
  if (typeof e !== 'object' || e === null) return false;
  const obj = e as Record<string, unknown>;

  if (!hasStringField(obj, 'type') || !PAYMENT_EVENT_TYPES.has(obj.type as string)) return false;
  if (!hasStringField(obj, 'invoiceId')) return false;
  if (!hasStringField(obj, 'subscriptionId')) return false;

  const type = obj.type as PaymentEvent['type'];

  if (type === 'payment.succeeded') {
    return typeof obj.amount === 'number' && hasStringField(obj, 'currency');
  }
  if (type === 'payment.failed') {
    return hasStringField(obj, 'failureCode') && hasStringField(obj, 'failureMessage');
  }
  if (type === 'payment.refunded') {
    return hasStringField(obj, 'refundId') && typeof obj.amount === 'number';
  }

  // Unreachable: the Set check above guards all cases, but keeps the guard total.
  return false;
}

// ---------------------------------------------------------------------------
// Handler — the never check forces a compile error if a new union member is
// added without a corresponding case arm.
// ---------------------------------------------------------------------------

export function handlePaymentEvent(event: PaymentEvent): void {
  switch (event.type) {
    case 'payment.succeeded':
      // event is narrowed to PaymentSucceededEvent here
      console.log(`Payment succeeded: invoice=${event.invoiceId} amount=${event.amount} ${event.currency}`);
      break;

    case 'payment.failed':
      // event is narrowed to PaymentFailedEvent here
      console.log(`Payment failed: invoice=${event.invoiceId} code=${event.failureCode} — ${event.failureMessage}`);
      break;

    case 'payment.refunded':
      // event is narrowed to PaymentRefundedEvent here
      console.log(`Payment refunded: invoice=${event.invoiceId} refund=${event.refundId} amount=${event.amount}`);
      break;

    default: {
      // Exhaustive check: if TypeScript reaches here, `event` has type `never`.
      // Adding a fourth union member without handling it is a compile-time error.
      const _exhaustive: never = event;
      throw new Error(`Unhandled payment event type: ${JSON.stringify(_exhaustive)}`);
    }
  }
}
