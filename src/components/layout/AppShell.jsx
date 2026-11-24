// src/components/layout/AppShell.jsx
// Main authenticated app layout: outlet + vertical menu + full modal + bottom nav

import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import VerticalQuickMenu from '../transaction/VerticalQuickMenu';
import CatatTransaksiModal from '../transaction/CatatTransaksiModal';

export default function AppShell() {
  return (
    <div className="min-h-screen bg-bg text-main transition-colors duration-200">
      {/* Page content */}
      <main className="pb-24 min-h-screen">
        <Outlet />
      </main>

      {/* Vertical Quick Action Menu (Appears right above FAB when + is clicked) */}
      <VerticalQuickMenu />

      {/* Specific Full Transaction Modal */}
      <CatatTransaksiModal />

      {/* Bottom Navigation with Rotating FAB */}
      <BottomNav />
    </div>
  );
}
