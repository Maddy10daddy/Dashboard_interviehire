'use client';

import { AppProvider, useAppContext } from '@/context/AppContext';
import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/DashboardHeader';
import { DrawerBackdrop, CreateJobDrawer, InviteMemberDrawer, CandidateReportDrawer } from '@/components/drawers/Drawers';
import SpotlightModal from '@/components/SpotlightModal';

function NotificationToaster() {
  const { wsNotification } = useAppContext();

  if (!wsNotification) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 9999,
      background: 'rgba(23, 23, 23, 0.75)',
      backdropFilter: 'blur(12px)',
      border: '1px solid var(--color-border)',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.57)',
      borderRadius: '8px',
      padding: '16px',
      maxWidth: '320px',
      color: 'var(--color-text-normal)',
      fontFamily: 'var(--font-sans)',
      fontSize: '0.85rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontWeight: 600, color: 'var(--color-gold)' }}>
        <span className="pulse-dot orange" style={{ margin: 0, width: '8px', height: '8px' }} />
        <span>Real-time Candidate Update</span>
      </div>
      <div>{wsNotification}</div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppProvider>
      {/* Background grid elements */}
      <div className="bg-grid" />
      <div className="bg-radial" />

      {/* Dashboard App Grid */}
      <div className="dashboard-app">
        <Sidebar />

        <main className="main-content">
          <DashboardHeader />
          <div className="dashboard-view-body">
            {children}
          </div>
        </main>

        {/* Drawers */}
        <DrawerBackdrop />
        <CreateJobDrawer />
        <InviteMemberDrawer />
        <CandidateReportDrawer />
        
        {/* Spotlight Command Bar */}
        <SpotlightModal />

        {/* Real-time WS Toaster */}
        <NotificationToaster />
      </div>
    </AppProvider>
  );
}

