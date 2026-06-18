import { Bot, Gamepad2, Tv, Monitor, Gift, Gem, Swords, UserCircle2, LayoutGrid } from 'lucide-react';

// Maps category id -> lucide icon (icons/colors otherwise come from the backend categories API)
export const CATEGORY_ICONS = {
  'ai-tools': Bot,
  games: Gamepad2,
  subscriptions: Tv,
  software: Monitor,
  'gift-cards': Gift,
  'top-up': Gem,
  'game-items': Swords,
  accounts: UserCircle2,
};

export function getCategoryIcon(id) {
  return CATEGORY_ICONS[id] || LayoutGrid;
}

export const BADGE_LABELS = {
  bestseller: { label: 'Bestseller', tone: 'amber' },
  new: { label: 'New', tone: 'teal' },
  hot: { label: 'Hot', tone: 'coral' },
  sale: { label: 'Sale', tone: 'cyan' },
  limited: { label: 'Limited', tone: 'violet' },
};
