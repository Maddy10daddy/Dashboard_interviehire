'use client';

import { AppProvider, useAppContext } from '@/context/AppContext';
import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/DashboardHeader';
import { DrawerBackdrop, CreateJobDrawer, InviteMemberDrawer, CandidateReportDrawer } from '@/components/drawers/Drawers';
import SpotlightModal from '@/components/SpotlightModal';

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


      </div>
    </AppProvider>
  );
}

