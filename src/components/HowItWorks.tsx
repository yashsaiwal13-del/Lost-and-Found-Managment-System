import React from 'react';
import { 
  FileText, 
  Search, 
  ShieldCheck, 
  ArrowRight, 
  Clock, 
  UserCheck, 
  Sparkles 
} from 'lucide-react';
import { HOW_IT_WORKS_STEPS } from '@/lib/constants';

export default function HowItWorks() {
  const stepIcons = [
    <FileText key="1" className="h-6 w-6 text-indigo-600" />,
    <Search key="2" className="h-6 w-6 text-blue-600" />,
    <ShieldCheck key="3" className="h-6 w-6 text-emerald-600" />,
  ];

  return (
    <section id="how-it-works" className="py-20 bg-slate-900 text-white relative overflow-hidden">
      
      {/* Subtle Glow Backdrop */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-indigo-500/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            Simple 3-Step Campus Protocol
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            How CampusFind Works
          </h2>
          <p className="mt-3 text-slate-400 text-sm sm:text-base leading-relaxed">
            Eliminating chaos and lost posters. Our verified pipeline connects finders, owners, and security officers with total accountability.
          </p>
        </div>

        {/* 3 Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {HOW_IT_WORKS_STEPS.map((item, idx) => (
            <div
              key={item.step}
              className="relative bg-slate-800/80 border border-slate-700/80 rounded-2xl p-7 flex flex-col justify-between hover:border-slate-600 hover:bg-slate-800 transition-all duration-200 group"
            >
              <div>
                {/* Step Top */}
                <div className="flex items-center justify-between mb-6">
                  <div className="h-12 w-12 rounded-xl bg-slate-700/60 border border-slate-600/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    {stepIcons[idx]}
                  </div>
                  <span className="text-3xl font-black font-mono text-slate-600 group-hover:text-indigo-400 transition-colors">
                    {item.step}
                  </span>
                </div>

                {/* Badge */}
                <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider block mb-2">
                  {item.badge}
                </span>

                {/* Title */}
                <h3 className="text-lg font-bold text-white mb-2.5">
                  {item.title}
                </h3>

                {/* Description */}
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Step Footer Cue */}
              <div className="mt-6 pt-4 border-t border-slate-700/50 flex items-center text-xs font-medium text-slate-400 group-hover:text-white transition-colors">
                <span>Phase {idx + 1}</span>
                <ArrowRight className="h-3.5 w-3.5 ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          ))}
        </div>

        {/* Dual Roles Breakdown (Students vs Security) */}
        <div className="mt-14 bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* For Students */}
            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-1">
                  For Students & Faculty
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  No need to walk across campus checking 10 different lost desks. Search online, claim your belongings, and schedule safe pickup at your convenience.
                </p>
              </div>
            </div>

            {/* For Campus Security & Staff */}
            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-1">
                  For Campus Security & Help Desks
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Log turn-ins, assign secure locker numbers, verify student ID cards against submitted proof, and maintain a 100% auditable chain of custody.
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
