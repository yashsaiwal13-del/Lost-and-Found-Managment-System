'use client';

import React, { useState } from 'react';
import { 
  AlertCircle, 
  PlusCircle, 
  UploadCloud, 
  MapPin, 
  Calendar, 
  Tag, 
  CheckCircle2,
  ShieldAlert,
  Info
} from 'lucide-react';
import { CATEGORIES, CAMPUS_LOCATIONS } from '@/data/mockData';

export default function ReportSection() {
  const [activeTab, setActiveTab] = useState<'lost' | 'found'>('lost');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingId, setTrackingId] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    category: CATEGORIES[0],
    location: CAMPUS_LOCATIONS[1],
    date: '',
    description: '',
    contactName: '',
    contactEmail: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = activeTab === 'lost' ? '/api/reports/lost' : '/api/reports/found';
      const payload = activeTab === 'lost' ? {
        itemName: formData.title,
        category: formData.category,
        location: formData.location,
        dateLost: formData.date || new Date().toISOString(),
        description: formData.description,
        contactName: formData.contactName,
        contactEmail: formData.contactEmail,
      } : {
        itemName: formData.title,
        category: formData.category,
        location: formData.location,
        dateFound: formData.date || new Date().toISOString(),
        description: formData.description,
        storageLocation: 'Campus Security Central Desk',
        contactName: formData.contactName,
        contactEmail: formData.contactEmail,
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to save report. Please verify input fields.');
        setLoading(false);
        return;
      }

      setTrackingId(data.item?.id || (activeTab === 'lost' ? 'LOST-8924' : 'FND-4310'));
      setSubmitted(true);
      setLoading(false);

      setTimeout(() => {
        setSubmitted(false);
        setFormData({
          title: '',
          category: CATEGORIES[0],
          location: CAMPUS_LOCATIONS[1],
          date: '',
          description: '',
          contactName: '',
          contactEmail: '',
        });
      }, 4000);
    } catch (err: any) {
      setError(err?.message || 'Network error submitting report.');
      setLoading(false);
    }
  };

  return (
    <section id="report-lost" className="py-20 bg-white">
      <div id="report-found" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            Quick Reporting Portal
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-3">
            Report an Item to Campus Safety
          </h2>
          <p className="text-slate-600 text-sm mt-2">
            Reports are immediately logged into the college centralized database and matched with incoming reports.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab('lost')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                activeTab === 'lost'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertCircle className="h-4 w-4" />
              I Lost Something
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('found')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                activeTab === 'found'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PlusCircle className="h-4 w-4" />
              I Found Something
            </button>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs relative">
          
          {submitted ? (
            <div className="text-center py-12 animate-in zoom-in-95 duration-200">
              <div className={`h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                activeTab === 'lost' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
              }`}>
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                {activeTab === 'lost' ? 'Lost Item Report Logged!' : 'Found Item Registered!'}
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm mt-2 max-w-md mx-auto">
                {activeTab === 'lost'
                  ? 'Your report has been broadcasted to the campus lost registry. If a match is turned in to security, we will alert your student email.'
                  : 'Thank you for your honesty! Please drop the item off at the nearest Campus Security Desk (Building 4, Ground Floor) to receive custody confirmation.'}
              </p>
              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-xs font-mono text-slate-700">
                Tracking Reference: #{trackingId || (activeTab === 'lost' ? 'LOST-8924' : 'FND-4310')}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Error Banner */}
              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              {/* Notice Banner */}
              <div className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs ${
                activeTab === 'lost'
                  ? 'bg-rose-50/70 border-rose-200/80 text-rose-900'
                  : 'bg-emerald-50/70 border-emerald-200/80 text-emerald-900'
              }`}>
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  {activeTab === 'lost'
                    ? 'Tip: Provide detailed descriptions (like scratches, custom cases, lock screen wallpaper) to help security confirm your claim quickly.'
                    : 'Found items can also be handed directly to building receptionists or library staff who have direct security access.'}
                </span>
              </div>

              {/* Grid 1: Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Item Name / Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={activeTab === 'lost' ? "e.g. Black Sony WH-1000XM4 Headphones" : "e.g. Silver Dell Laptop Charger"}
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 shadow-2xs"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Grid 2: Campus Location & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Campus Location {activeTab === 'lost' ? 'Lost At' : 'Found At'} *
                  </label>
                  <select
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 shadow-2xs"
                  >
                    {CAMPUS_LOCATIONS.filter((l) => l !== 'All Locations').map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Date & Approximate Time *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Today around 2:00 PM"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Detailed Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Detailed Description *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Color, brand, distinguishing marks, stickers, case design, or any identifying factors..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 shadow-2xs"
                />
              </div>

              {/* Mock Photo Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Item Photo (Optional)
                </label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-indigo-400 bg-white/70 transition-colors cursor-pointer">
                  <UploadCloud className="h-7 w-7 text-slate-400 mx-auto mb-1.5" />
                  <span className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
                    Upload image from device
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1">
                    PNG, JPG, or WEBP up to 5MB (Simulated upload)
                  </p>
                </div>
              </div>

              {/* Contact Info (for follow up) */}
              <div className="pt-2 border-t border-slate-200/80">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Your College Contact Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Priya Sharma"
                      value={formData.contactName}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      className="w-full text-xs px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Campus Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. p.sharma@college.edu"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      className="w-full text-xs px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200/80">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold text-white shadow-sm transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed ${
                    activeTab === 'lost'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {loading
                    ? 'Submitting to database...'
                    : activeTab === 'lost'
                    ? 'Submit Lost Item Report'
                    : 'Register Found Item'}
                </button>
              </div>

            </form>
          )}

        </div>

      </div>
    </section>
  );
}
