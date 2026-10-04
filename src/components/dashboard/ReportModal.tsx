'use client';

import React, { useState } from 'react';
import { 
  X, 
  AlertCircle, 
  PlusCircle, 
  CheckCircle2, 
  UploadCloud, 
  MapPin, 
  Tag, 
  Info 
} from 'lucide-react';
import { CATEGORIES, STUDENT_PROFILE } from '@/lib/constants';
import { CAMPUS_LOCATIONS } from '@/lib/campusLocations';
import { submitLostItemReport } from '@/app/actions/reportLost';
import { submitFoundItemReport } from '@/app/actions/reportFound';

interface ReportModalProps {
  isOpen: boolean;
  type: 'lost' | 'found';
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ReportModal({ isOpen, type, onClose, onSuccess }: ReportModalProps) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    category: CATEGORIES[0],
    location: CAMPUS_LOCATIONS[1],
    date: 'Today, Just now',
    description: '',
  });

  if (!isOpen) return null;

  const isLost = type === 'lost';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let result;
      if (isLost) {
        result = await submitLostItemReport({
          itemName: formData.title,
          category: formData.category,
          location: formData.location,
          dateLost: new Date().toISOString(),
          description: formData.description,
        });
      } else {
        result = await submitFoundItemReport({
          itemName: formData.title,
          category: formData.category,
          location: formData.location,
          dateFound: new Date().toISOString(),
          description: formData.description,
          storageLocation: 'Campus Safety Central Desk',
        });
      }

      if (!result.success) {
        setError(result.error || 'Could not save report.');
        setLoading(false);
        return;
      }

      setSubmitted(true);
      setLoading(false);

      setTimeout(() => {
        setSubmitted(false);
        onClose();
        if (onSuccess) onSuccess();
      }, 1800);
    } catch (err: any) {
      setError(err?.message || 'Network error saving report.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {submitted ? (
          <div className="text-center py-8">
            <div className={`h-14 w-14 rounded-full flex items-center justify-center mx-auto mb-3 ${
              isLost ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
            }`}>
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              {isLost ? 'Lost Item Report Created!' : 'Found Item Registered!'}
            </h3>
            <p className="text-xs text-slate-600 mt-2 max-w-sm mx-auto">
              {isLost
                ? 'Your report has been logged under your student ID STU-2024-8891. CampusFind is scanning for matching items.'
                : 'Thank you! Please bring the item to the Campus Safety Desk (Building 4) when convenient.'}
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                isLost ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                {isLost ? <AlertCircle className="h-3.5 w-3.5" /> : <PlusCircle className="h-3.5 w-3.5" />}
                {isLost ? 'File Lost Report' : 'Log Found Item'}
              </span>
            </div>

            <h3 className="text-lg font-bold text-slate-900">
              {isLost ? 'Report a Lost Belonging' : 'Register an Item You Found'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Logged to student profile: <span className="font-semibold text-slate-700">{STUDENT_PROFILE.name} ({STUDENT_PROFILE.studentId})</span>
            </p>

            {error && (
              <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Item Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder={isLost ? "e.g., Space Gray MacBook Air, Blue Hydro Flask..." : "e.g., Set of keys, Black Dell Laptop..."}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:bg-white"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Location {isLost ? 'Lost' : 'Found'} *
                  </label>
                  <select
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:bg-white"
                  >
                    {CAMPUS_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Detailed Description *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe color, serial number, stickers, marks, or distinguishing traits..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-5 py-2 text-xs font-semibold text-white rounded-lg shadow-xs transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                    isLost ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {loading ? 'Saving report...' : isLost ? 'Submit Lost Report' : 'Register Found Item'}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
