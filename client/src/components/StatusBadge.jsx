import Badge from './ui/Badge';

const TONES = {
  pending_payment: 'amber',
  processing: 'cyan',
  fulfilling: 'violet',
  delivered: 'teal',
  cancelled: 'coral',
  refunded: 'coral',
  pending: 'amber',
  paid: 'teal',
  failed: 'coral',
  partial_refund: 'amber',
  expired: 'coral',
};

const LABELS = {
  pending_payment: 'Pending payment',
  processing: 'Processing',
  fulfilling: 'Fulfilling',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
  pending: 'Pending',
  paid: 'Paid',
  failed: 'Failed',
  partial_refund: 'Partial refund',
  expired: 'Expired',
};

export default function StatusBadge({ status }) {
  return <Badge tone={TONES[status] || 'neutral'}>{LABELS[status] || status}</Badge>;
}
