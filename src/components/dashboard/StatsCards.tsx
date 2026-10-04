'use client';

import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  ArrowUpRight 
} from 'lucide-react';
import { StudentStats } from '@/types';
import { getStudentReports } from '@/app/actions/getStudentReports';

interface StatsCardsProps {
  onSelectTab?: (tab: string) => void;
  stats?: StudentStats;
}

export default function StatsCards({ onSelectTab, stats: initialStats }: StatsCardsProps) {
  const [stats, setStats] = useState<StudentStats>(initialStats || {
    totalReports: 0,
    lostCount: 0,
    foundCount: 0,
    possibleMatches: 0,
    pendingClaims: 0,
    resolvedItems: 0,
  });

  useEffect(() => {
    if (initialStats) return;
    getStudentReports()
      .then((reports) => {
        if (reports) {
          const lostCount = reports.filter((r) => r.type === 'lost').length;
          const foundCount = reports.filter((r) => r.type === 'found').length;
          const possibleMatches = reports.filter((r) => r.matchesCount > 0 || r.connectedMatch != null).length;
          const pendingClaims = reports.filter((r) => r.status === 'pending_verification' || r.hasPendingVerification).length;
          const resolvedItems = reports.filter((r) => r.status === 'resolved').length;
          setStats({
            totalReports: reports.length,
            lostCount,
            foundCount,
            possibleMatches,
            pendingClaims,
            resolvedItems,
          });
        }
      })
      .catch((err) => console.warn('Could not load student stats:', err));
  }, [initialStats]);

  const cards = [
    {
      id: 'reports',
      title: 'Total Reports',
      value: stats.totalReports,
      subtitle: `${stats.lostCount} Lost • ${stats.foundCount} Found`,
      icon: FileText,
      iconBg: 'bg-indigo-50 text-indigo-600',
      borderAccent: 'border-slate-200/80 hover:border-indigo-300',
      targetTab: 'lost',
    },
    {
      id: 'matches',
      title: 'Possible Matches',
      value: stats.possibleMatches,
      subtitle: 'Items matching your reports',
      icon: Sparkles,
      iconBg: 'bg-amber-50 text-amber-600',
      borderAccent: 'border-amber-200/90 bg-amber-50/20 hover:border-amber-300',
      targetTab: 'matches',
      badge: stats.possibleMatches > 0 ? 'Action Needed' : undefined,
    },
    {
      id: 'claims',
      title: 'Pending Claims',
      value: stats.pendingClaims,
      subtitle: 'Awaiting security review',
      icon: Clock,
      iconBg: 'bg-purple-50 text-purple-600',
      borderAccent: 'border-slate-200/80 hover:border-purple-300',
      targetTab: 'claims',
    },
    {
      id: 'resolved',
      title: 'Resolved Items',
      value: stats.resolvedItems,
      subtitle: 'Reunited & closed',
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 text-emerald-600',
      borderAccent: 'border-slate-200/80 hover:border-emerald-300',
      targetTab: 'overview',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.id}
            onClick={() => onSelectTab && onSelectTab(card.targetTab)}
            className={`bg-white rounded-2xl p-5 border shadow-xs transition-all duration-200 cursor-pointer hover:shadow-md ${card.borderAccent} group relative flex flex-col justify-between`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${card.iconBg} group-hover:scale-105 transition-transform`}>
                  <Icon className="h-5 w-5" />
                </div>

                {card.badge ? (
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-200">
                    {card.badge}
                  </span>
                ) : (
                  <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
                )}
              </div>

              <span className="text-xs font-semibold text-slate-500 block">
                {card.title}
              </span>
              
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                {card.value}
              </div>
            </div>

            <p className="text-[11px] text-slate-500 mt-4 pt-3 border-t border-slate-100 font-medium">
              {card.subtitle}
            </p>
          </div>
        );
      })}
    </div>
  );
}
