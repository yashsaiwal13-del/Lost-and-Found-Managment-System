'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import WelcomeHeader from '@/components/dashboard/WelcomeHeader';
import StatsCards from '@/components/dashboard/StatsCards';
import PossibleMatchesBanner from '@/components/dashboard/PossibleMatchesBanner';
import RecentReports from '@/components/dashboard/RecentReports';
import ReportModal from '@/components/dashboard/ReportModal';

export default function StudentDashboard() {
  const [currentTab, setCurrentTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportModalType, setReportModalType] = useState<'lost' | 'found'>('lost');

  const handleOpenReport = (type: 'lost' | 'found') => {
    setReportModalType(type);
    setReportModalOpen(true);
  };

  // Convert selected tab into filter for RecentReports
  const getFilterForTab = () => {
    if (currentTab === 'lost') return 'lost';
    if (currentTab === 'found') return 'found';
    if (currentTab === 'matches') return 'matches';
    if (currentTab === 'claims') return 'claims';
    return 'all';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      
      {/* 1. Sidebar */}
      <Sidebar 
        currentTab={currentTab} 
        onTabChange={(tab) => setCurrentTab(tab)} 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        
        {/* 2. Welcome Message & Action Buttons Header */}
        <WelcomeHeader 
          onOpenSidebar={() => setSidebarOpen(true)}
          onOpenReportModal={handleOpenReport}
        />

        {/* Dashboard Body */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl w-full mx-auto">
          
          {/* 3. The 4 Requested Metric Cards */}
          <StatsCards 
            onSelectTab={(tab) => setCurrentTab(tab)}
          />

          {/* Possible Matches Spotlight Banner */}
          <PossibleMatchesBanner />

          {/* 4. Recent Reports Section */}
          <RecentReports 
            key={currentTab}
            filterType={getFilterForTab() as any}
          />

        </main>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        type={reportModalType}
        onClose={() => setReportModalOpen(false)}
      />

    </div>
  );
}
