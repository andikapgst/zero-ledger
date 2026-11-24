// src/components/transaction/CategoryIcon.jsx
// Helper component to render dynamic icons for categories based on Lucide React

import {
  Utensils,
  ShoppingBag,
  Fuel,
  Wrench,
  Wifi,
  PawPrint,
  HeartHandshake,
  HandHeart,
  Sparkles,
  Heart,
  Users,
  ShieldCheck,
  TrendingUp,
  Briefcase,
  CircleDollarSign,
  ArrowDownUp,
  ArrowUpRight,
  ArrowDownLeft,
  HandCoins,
  BadgePercent,
  Target,
  Circle,
} from 'lucide-react';
import { CATEGORY_INFO_MAP } from '../../lib/utils';

const ICON_COMPONENTS = {
  Utensils,
  ShoppingBag,
  Fuel,
  Wrench,
  Wifi,
  PawPrint,
  HeartHandshake,
  HandHeart,
  Sparkles,
  Heart,
  Users,
  ShieldCheck,
  TrendingUp,
  Briefcase,
  CircleDollarSign,
  ArrowDownUp,
  ArrowUpRight,
  ArrowDownLeft,
  HandCoins,
  BadgePercent,
  Target,
};

export default function CategoryIcon({ category, size = 18, className = '' }) {
  const info = CATEGORY_INFO_MAP[category] || {};
  const IconComp = ICON_COMPONENTS[info.icon] || Circle;

  return (
    <IconComp
      size={size}
      className={className}
      style={info.color ? { color: info.color } : undefined}
    />
  );
}
