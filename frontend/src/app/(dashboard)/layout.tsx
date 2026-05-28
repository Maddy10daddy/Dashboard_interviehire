'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AppProvider } from '@/context/AppContext';
import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/DashboardHeader';
import { DrawerBackdrop, CreateJobDrawer, InviteMemberDrawer, CandidateReportDrawer } from '@/components/drawers/Drawers';
import SpotlightModal from '@/components/SpotlightModal';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  useEffect(() => {
    // Function to calculate and position a single sliding-pill in a track container
    const updateSlidingPill = (container: HTMLElement) => {
      if (!container) return;
      
      const containerStyle = window.getComputedStyle(container);
      if (containerStyle.position === 'static') {
        container.style.position = 'relative';
      }
      
      let pill = container.querySelector('.sliding-pill') as HTMLElement | null;
      if (!pill) {
        pill = document.createElement('span');
        pill.className = 'sliding-pill';
        container.insertBefore(pill, container.firstChild);
      }
      
      // Delay slightly to let React complete mounting/rendering the active tab element
      setTimeout(() => {
        const activeTab = container.querySelector('.active') || 
                          container.querySelector('.active-sub') ||
                          container.querySelector('.nav-item.active') || 
                          container.querySelector('.filter-tab.active') || 
                          container.querySelector('.table-tab-btn.active') || 
                          container.querySelector('.report-tab-btn.active') || 
                          container.querySelector('.jd-tab.active') ||
                          container.querySelector('.mode-toggle-btn.active') ||
                          container.querySelector('.active-tab');
                          
        if (!activeTab) {
          pill.style.opacity = '0';
          return;
        }
        
        const rect = activeTab.getBoundingClientRect();
        const parentRect = container.getBoundingClientRect();
        
        const top = rect.top - parentRect.top;
        const left = rect.left - parentRect.left;
        const width = rect.width;
        const height = rect.height;
        
        if (width === 0 || height === 0) {
          pill.style.opacity = '0';
          return;
        }
        
        pill.style.opacity = '1';
        pill.style.width = `${width}px`;
        pill.style.height = `${height}px`;
        pill.style.transform = `translate3d(${left}px, ${top}px, 0)`;
        
        const activeStyle = window.getComputedStyle(activeTab);
        pill.style.borderRadius = activeStyle.borderRadius || '8px';
      }, 50);
    };

    const updateAllSlidingPills = () => {
      const tracks = document.querySelectorAll(
        '.sidebar-nav ul, .filter-options, .table-tabs, #team-status-tabs, .report-tabs, .jd-tabs, .sub-nav, .sourcing-mode-toggle'
      );
      tracks.forEach(track => updateSlidingPill(track as HTMLElement));
    };

    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isTab = target.closest('.nav-item, .filter-tab, .table-tab-btn, .report-tab-btn, .jd-tab, .sub-nav li, .mode-toggle-btn');
      if (isTab) {
        const track = target.closest('.sidebar-nav ul, .filter-options, .table-tabs, #team-status-tabs, .report-tabs, .jd-tabs, .sub-nav, .sourcing-mode-toggle') as HTMLElement;
        if (track) {
          updateSlidingPill(track);
        }
      }
    };

    // Initial update
    updateAllSlidingPills();
    
    // Listeners
    window.addEventListener('resize', updateAllSlidingPills);
    document.addEventListener('click', handleDocumentClick);
    
    // Observe DOM mutations to auto-update when classes change (e.g. tabs activate)
    const observer = new MutationObserver((mutations) => {
      let shouldUpdate = false;
      for (const mutation of mutations) {
        if (
          (mutation.type === 'attributes' && mutation.attributeName === 'class') ||
          mutation.type === 'childList'
        ) {
          shouldUpdate = true;
          break;
        }
      }
      if (shouldUpdate) {
        updateAllSlidingPills();
      }
    });
    
    observer.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['class']
    });
    
    // Multi-stage timeout fallbacks for loading transitions
    const timer1 = setTimeout(updateAllSlidingPills, 100);
    const timer2 = setTimeout(updateAllSlidingPills, 400);
    const timer3 = setTimeout(updateAllSlidingPills, 1000);
    
    return () => {
      window.removeEventListener('resize', updateAllSlidingPills);
      document.removeEventListener('click', handleDocumentClick);
      observer.disconnect();
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [pathname]);

  return (
    <AppProvider>
      {/* Premium Glassmorphic Background Scene */}
      <div className="scene">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="orb orb-4" />
      </div>
      <div className="noise" />
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

