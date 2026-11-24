// src/components/layout/BottomNav.jsx
// Mobile bottom navigation bar with rotating FAB (+) button and vertical action sheet trigger

import { NavLink } from 'react-router-dom';
import {
  Home,
  ArrowLeftRight,
  PieChart,
  HandCoins,
  Plus,
} from 'lucide-react';
import { useTransactionModal } from '../../contexts/TransactionModalContext';

const NAV_ITEMS = [
  { to: '/',           label: 'Home',         icon: Home },
  { to: '/transaksi',  label: 'Transactions', icon: ArrowLeftRight },
  null, // placeholder for the rotating FAB button
  { to: '/budget',     label: 'Budget',       icon: PieChart },
  { to: '/hutang',     label: 'Debts',        icon: HandCoins },
];

export default function BottomNav() {
  const { toggleQuickMenu, isQuickMenuOpen } = useTransactionModal();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 safe-bottom">
      <div className="bg-surface/95 border-t border-bline backdrop-blur-md transition-colors">
        <div className="flex items-end justify-around px-1 pt-2 pb-1 max-w-lg mx-auto relative">
          {NAV_ITEMS.map((item, idx) => {
            if (!item) {
              // Centre Rotating FAB Button
              return (
                <div key="fab" className="flex flex-col items-center -mt-5 pb-1">
                  <button
                    onClick={toggleQuickMenu}
                    aria-label="Add Transaction"
                    className={`
                      w-14 h-14 rounded-full
                      bg-teal shadow-lg shadow-teal/50
                      flex items-center justify-center
                      active:scale-95 hover:bg-teal/90
                      border-4 border-bg cursor-pointer
                      transition-transform duration-300 ease-out
                      ${isQuickMenuOpen ? 'rotate-45 bg-teal/90 scale-105' : 'rotate-0'}
                    `}
                  >
                    <Plus className="w-7 h-7 text-[#0B1215] stroke-[2.5]" />
                  </button>
                  <span className="text-[10px] text-muted mt-1 leading-none font-medium">Add</span>
                </div>
              );
            }

            const { to, label, icon: Icon } = item;
            return (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-colors duration-150
                  ${isActive ? 'text-teal' : 'text-muted hover:text-main'}`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={21}
                      className={isActive ? 'text-teal' : 'text-muted'}
                      strokeWidth={isActive ? 2.2 : 1.8}
                    />
                    <span className={`text-[10px] font-medium leading-none ${isActive ? 'text-teal' : 'text-muted'}`}>
                      {label}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
