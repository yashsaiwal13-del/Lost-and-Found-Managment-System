'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import WelcomeHeader from '@/components/dashboard/WelcomeHeader';
import StatsCards from '@/components/dashboard/StatsCards';
import PossibleMatchesBanner from '@/components/dashboard/PossibleMatchesBanner';
import StudentVerificationsBanner from '@/components/dashboard/StudentVerificationsBanner';
import RecentReports from '@/components/dashboard/RecentReports';
import ReportModal from '@/components/dashboard/ReportModal';
import { AlertCircle, X } from 'lucide-react';

interface StudentDashboardClientProps {
  user: {
    id?: string | null;
    name?: string | null;
    email?: string | null;
    role?: string;
    studentId?: string | null;
  };
  denied?: boolean;
  deniedMessage?: string;
}

export default function StudentDashboardClient({
  user,
  denied,
  deniedMessage,
}: StudentDashboardClientProps) {
  const [currentTab, setCurrentTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportModalType, setReportModalType] = useState<'lost' | 'found'>('lost');
  const [showDeniedBanner, setShowDeniedBanner] = useState(denied);

  const handleOpenReport = (type: 'lost' | 'found') => {
    setReportModalType(type);
    setReportModalOpen(true);
  };

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
        userRole="STUDENT"
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        
        {/* Access Denied Toast/Banner if redirected from unauthorized route */}
        {showDeniedBanner && (
          <div className="bg-rose-600 text-white px-4 py-3 sm:px-6 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{deniedMessage || 'Access denied. You do not have permission to view that page.'}</span>
            </div>
            <button
              onClick={() => setShowDeniedBanner(false)}
              className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-rose-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* 2. Welcome Message & Action Buttons Header */}
        <WelcomeHeader 
          userName={user?.name}
          studentId={user?.studentId}
          onOpenSidebar={() => setSidebarOpen(true)}
          onOpenReportModal={handleOpenReport}
        />

        {/* Dashboard Body */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl w-full mx-auto">
          
          {/* 3. Metric Cards */}
          <StatsCards 
            onSelectTab={(tab) => setCurrentTab(tab)}
          />

          {/* Pending Verification Inquiries */}
          <StudentVerificationsBanner />

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
