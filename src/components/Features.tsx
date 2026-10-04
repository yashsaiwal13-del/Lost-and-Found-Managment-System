import React from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  MapPin, 
  Lock, 
  Clock, 
  LayoutGrid, 
  FileCheck,
  CheckCircle2
} from 'lucide-react';
import { CAMPUS_FEATURES } from '@/lib/constants';

export default function Features() {
  const getIcon = (name: string) => {
    switch (name) {
      case 'ShieldCheck':
        return <ShieldCheck className="h-6 w-6 text-indigo-600" />;
      case 'MapPin':
        return <MapPin className="h-6 w-6 text-blue-600" />;
      case 'Lock':
        return <Lock className="h-6 w-6 text-emerald-600" />;
      case 'Clock':
        return <Clock className="h-6 w-6 text-amber-600" />;
      case 'LayoutGrid':
        return <LayoutGrid className="h-6 w-6 text-purple-600" />;
      case 'FileCheck':
        return <FileCheck className="h-6 w-6 text-rose-600" />;
      default:
        return <ShieldCheck className="h-6 w-6 text-indigo-600" />;
    }
  };

  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            Engineered for Higher Education
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
            Built for Safe & Transparent Campus Operations
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
            Every feature is tailored to address the unique challenges of collegiate environments — from busy libraries and cafeterias to residential halls.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {CAMPUS_FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="bg-slate-50/60 border border-slate-200/80 rounded-2xl p-7 hover:bg-white hover:border-slate-300 hover:shadow-lg hover:shadow-slate-100 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="h-12 w-12 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center">
                    {getIcon(feature.iconName)}
                  </div>
                  {feature.badge && (
                    <span className="text-[11px] font-semibold text-slate-500 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full">
                      {feature.badge}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-2">
                  {feature.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center gap-1.5 text-xs font-semibold text-indigo-600">
                <CheckCircle2 className="h-4 w-4" />
                <span>Active Campus Feature</span>
              </div>
            </div>
          ))}
        </div>

        {/* Security Desk Spotlight Banner */}
        <div id="security" className="mt-16 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 rounded-2xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 mb-3">
                <ShieldCheck className="h-4 w-4" />
                Campus Safety & Security Office
              </div>
              <h3 className="text-2xl font-bold tracking-tight">
                Are you a campus security officer or administrator?
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed">
                Log into the upcoming security portal to process batch turn-ins, audit custody logs, review submitted student proof, and update claim statuses in real time.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
              <Link
                href="/admin"
                className="w-full sm:w-auto px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 text-center inline-flex items-center justify-center gap-2"
              >
                Access Security Dashboard
              </Link>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
