'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { 
  AlertCircle, 
  ArrowLeft, 
  UploadCloud, 
  X, 
  CheckCircle2, 
  MapPin, 
  Calendar, 
  Clock, 
  Tag, 
  ShieldCheck, 
  Info, 
  Image as ImageIcon,
  Sparkles,
  Search,
  LayoutDashboard
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CATEGORIES, CAMPUS_LOCATIONS } from '@/data/mockData';
import { submitLostItemReport } from '@/app/actions/reportLost';

interface FormState {
  itemName: string;
  category: string;
  description: string;
  location: string;
  specificLocation: string;
  dateLost: string;
  timeLost: string;
  additionalDetails: string;
}

interface FormErrors {
  itemName?: string;
  category?: string;
  description?: string;
  location?: string;
  dateLost?: string;
  timeLost?: string;
}

export default function ReportLostPage() {
  const [formData, setFormData] = useState<FormState>({
    itemName: '',
    category: '',
    description: '',
    location: '',
    specificLocation: '',
    dateLost: '',
    timeLost: '',
    additionalDetails: '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [referenceId, setReferenceId] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Image Selection & Preview
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Basic size validation (< 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image file size must be less than 5MB.');
        return;
      }
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleRemoveImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Form Validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.itemName.trim()) {
      newErrors.itemName = 'Item name is required.';
    }
    if (!formData.category) {
      newErrors.category = 'Please select an item category.';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Please provide a clear description of the item.';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description should be at least 10 characters.';
    }
    if (!formData.location) {
      newErrors.location = 'Please select the campus building or area where it was lost.';
    }
    if (!formData.dateLost) {
      newErrors.dateLost = 'Date lost is required.';
    }
    if (!formData.timeLost) {
      newErrors.timeLost = 'Approximate time lost is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      // Scroll to the first error
      const firstError = document.querySelector('[data-has-error="true"]');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitLostItemReport({
        itemName: formData.itemName,
        category: formData.category,
        description: formData.description,
        location: formData.location,
        specificLocation: formData.specificLocation,
        dateLost: formData.dateLost,
        timeLost: formData.timeLost,
        additionalDetails: formData.additionalDetails,
        image: imagePreview,
      });

      if (result.success && result.item) {
        setReferenceId(result.item.id);
        setIsSubmitted(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        alert(result.error || 'Failed to submit report. Please check the fields.');
      }
    } catch (err) {
      console.error(err);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      itemName: '',
      category: '',
      description: '',
      location: '',
      specificLocation: '',
      dateLost: '',
      timeLost: '',
      additionalDetails: '',
    });
    handleRemoveImage();
    setErrors({});
    setIsSubmitted(false);
    setReferenceId('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6">
          <Link href="/" className="hover:text-indigo-600 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/dashboard" className="hover:text-indigo-600 transition-colors">
            Student Dashboard
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-semibold">Report Lost Item</span>
        </nav>

        {isSubmitted ? (
          /* SUCCESS SCREEN */
          <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-12 shadow-xl shadow-slate-200/50 text-center animate-in zoom-in-95 duration-200 max-w-2xl mx-auto">
            <div className="h-20 w-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-inner">
              <CheckCircle2 className="h-11 w-11" />
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-3">
              <ShieldCheck className="h-3.5 w-3.5" />
              Report Registered with Campus Security
            </span>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Lost Item Report Logged!
            </h1>

            <p className="text-slate-600 text-sm mt-3 leading-relaxed max-w-lg mx-auto">
              Your lost item report has been indexed into the college central safety registry. If a matching item is turned in to security, you will receive an instant notification.
            </p>

            {/* Reference Tracking Card */}
            <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-200 max-w-md mx-auto text-left">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="text-xs text-slate-500 font-medium">Tracking Reference Number</span>
                <span className="text-sm font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-200">
                  {referenceId}
                </span>
              </div>

              <div className="pt-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Item:</span>
                  <span className="font-semibold text-slate-800">{formData.itemName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Category:</span>
                  <span className="font-medium text-slate-700">{formData.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Campus Location:</span>
                  <span className="font-medium text-slate-700">{formData.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date &amp; Time:</span>
                  <span className="font-medium text-slate-700">{formData.dateLost} at {formData.timeLost}</span>
                </div>
                {imagePreview && (
                  <div className="pt-2 flex items-center gap-3">
                    <span className="text-slate-500">Photo Attached:</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={imagePreview} 
                      alt="Uploaded item" 
                      className="h-10 w-10 object-cover rounded-lg border border-slate-200" 
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Actions */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
              >
                <LayoutDashboard className="h-4 w-4" />
                View in Student Dashboard
              </Link>
              <Link
                href="/#browse"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition-all"
              >
                <Search className="h-4 w-4 text-indigo-500" />
                Browse Found Registry
              </Link>
              <button
                type="button"
                onClick={handleReset}
                className="w-full sm:w-auto px-4 py-3 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
              >
                Report Another Item
              </button>
            </div>
          </div>
        ) : (
          /* REPORT FORM */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Main Form (2 cols) */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
                
                {/* Header */}
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
                  <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                      Report a Lost Belonging
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Submit precise details to help campus security and fellow students identify your item.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} noValidate className="space-y-6">
                  
                  {/* 1. Item Name */}
                  <div data-has-error={!!errors.itemName}>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Item Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Apple AirPods Pro 2nd Gen, MacBook Pro, Student ID Card"
                      value={formData.itemName}
                      onChange={(e) => {
                        setFormData({ ...formData, itemName: e.target.value });
                        if (errors.itemName) setErrors({ ...errors, itemName: undefined });
                      }}
                      className={`w-full text-xs px-3.5 py-2.5 rounded-xl border bg-slate-50/50 transition-colors focus:bg-white focus:outline-none ${
                        errors.itemName
                          ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 text-rose-900'
                          : 'border-slate-200 focus:border-indigo-500'
                      }`}
                    />
                    {errors.itemName && (
                      <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.itemName}
                      </p>
                    )}
                  </div>

                  {/* 2. Category */}
                  <div data-has-error={!!errors.category}>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Category <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={formData.category}
                        onChange={(e) => {
                          setFormData({ ...formData, category: e.target.value });
                          if (errors.category) setErrors({ ...errors, category: undefined });
                        }}
                        className={`w-full text-xs px-3.5 py-2.5 rounded-xl border bg-slate-50/50 transition-colors focus:bg-white focus:outline-none cursor-pointer ${
                          errors.category
                            ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500'
                            : 'border-slate-200 focus:border-indigo-500'
                        }`}
                      >
                        <option value="">-- Select Item Category --</option>
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.category && (
                      <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.category}
                      </p>
                    )}
                  </div>

                  {/* 3. Description */}
                  <div data-has-error={!!errors.description}>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Description <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Describe color, brand, model, case, visible wear, contents, or distinguishing features..."
                      value={formData.description}
                      onChange={(e) => {
                        setFormData({ ...formData, description: e.target.value });
                        if (errors.description) setErrors({ ...errors, description: undefined });
                      }}
                      className={`w-full text-xs px-3.5 py-2.5 rounded-xl border bg-slate-50/50 transition-colors focus:bg-white focus:outline-none ${
                        errors.description
                          ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 text-rose-900'
                          : 'border-slate-200 focus:border-indigo-500'
                      }`}
                    />
                    {errors.description && (
                      <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.description}
                      </p>
                    )}
                  </div>

                  {/* 4. Photo Upload with Live Preview */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Photo Upload (Optional but Recommended)
                    </label>

                    {imagePreview ? (
                      /* Image Preview Box */
                      <div className="relative border border-indigo-200 bg-indigo-50/30 rounded-2xl p-4 flex items-center gap-4">
                        <div className="relative h-20 w-20 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-white">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imagePreview}
                            alt="Uploaded item preview"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0 text-xs">
                          <p className="font-semibold text-slate-800 truncate">
                            {imageFile?.name}
                          </p>
                          <p className="text-slate-500 text-[11px] mt-0.5">
                            {imageFile ? (imageFile.size / 1024).toFixed(1) + ' KB' : ''} • Image loaded
                          </p>
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-md mt-1">
                            <CheckCircle2 className="h-3 w-3" /> Ready for matching
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                          title="Remove image"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    ) : (
                      /* Upload Dropzone */
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20 rounded-2xl p-6 text-center transition-colors cursor-pointer group"
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageChange}
                          accept="image/png, image/jpeg, image/webp"
                          className="hidden"
                        />
                        <div className="h-10 w-10 rounded-xl bg-slate-100 group-hover:bg-indigo-100 text-slate-500 group-hover:text-indigo-600 flex items-center justify-center mx-auto mb-2 transition-colors">
                          <UploadCloud className="h-5 w-5" />
                        </div>
                        <p className="text-xs font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                          Click or drag image to upload
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          PNG, JPG, or WEBP up to 5MB
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 5. Location Lost */}
                  <div data-has-error={!!errors.location}>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Campus Location Lost <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.location}
                      onChange={(e) => {
                        setFormData({ ...formData, location: e.target.value });
                        if (errors.location) setErrors({ ...errors, location: undefined });
                      }}
                      className={`w-full text-xs px-3.5 py-2.5 rounded-xl border bg-slate-50/50 transition-colors focus:bg-white focus:outline-none cursor-pointer ${
                        errors.location
                          ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500'
                          : 'border-slate-200 focus:border-indigo-500'
                      }`}
                    >
                      <option value="">-- Select Campus Building / Area --</option>
                      {CAMPUS_LOCATIONS.filter((l) => l !== 'All Locations').map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                    {errors.location && (
                      <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.location}
                      </p>
                    )}

                    {/* Specific room or area within building */}
                    <input
                      type="text"
                      placeholder="Specific room, floor, or desk (e.g. 3rd Floor quiet cubicle #14)"
                      value={formData.specificLocation}
                      onChange={(e) => setFormData({ ...formData, specificLocation: e.target.value })}
                      className="mt-2 w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/30 focus:bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* 6. Date Lost & 7. Time Lost */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div data-has-error={!!errors.dateLost}>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Date Lost <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          max={new Date().toISOString().split('T')[0]}
                          value={formData.dateLost}
                          onChange={(e) => {
                            setFormData({ ...formData, dateLost: e.target.value });
                            if (errors.dateLost) setErrors({ ...errors, dateLost: undefined });
                          }}
                          className={`w-full text-xs px-3.5 py-2.5 rounded-xl border bg-slate-50/50 transition-colors focus:bg-white focus:outline-none ${
                            errors.dateLost
                              ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 text-rose-900'
                              : 'border-slate-200 focus:border-indigo-500'
                          }`}
                        />
                      </div>
                      {errors.dateLost && (
                        <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.dateLost}
                        </p>
                      )}
                    </div>

                    <div data-has-error={!!errors.timeLost}>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Approximate Time Lost <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 10:30 AM or between 2:00-3:30 PM"
                        value={formData.timeLost}
                        onChange={(e) => {
                          setFormData({ ...formData, timeLost: e.target.value });
                          if (errors.timeLost) setErrors({ ...errors, timeLost: undefined });
                        }}
                        className={`w-full text-xs px-3.5 py-2.5 rounded-xl border bg-slate-50/50 transition-colors focus:bg-white focus:outline-none ${
                          errors.timeLost
                            ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 text-rose-900'
                            : 'border-slate-200 focus:border-indigo-500'
                        }`}
                      />
                      {errors.timeLost && (
                        <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.timeLost}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 8. Additional Identifying Details (Verification proof) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        Additional Identifying Details (Confidential)
                      </label>
                      <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-md">
                        Security Only
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      placeholder="Secret identifying marks kept confidential from public view (e.g. lock screen photo, serial number, internal stickers, personal engraved initials)..."
                      value={formData.additionalDetails}
                      onChange={(e) => setFormData({ ...formData, additionalDetails: e.target.value })}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-indigo-500"
                    />
                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                      <Info className="h-3 w-3 shrink-0" />
                      This information is hidden from the public and only seen by Security Officers during claim reviews.
                    </p>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                    <Link
                      href="/"
                      className="px-5 py-3 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      Cancel
                    </Link>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/25 active:scale-95 disabled:opacity-70 transition-all cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          <span>Submitting Report...</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4" />
                          <span>Submit Lost Report</span>
                        </>
                      )}
                    </button>
                  </div>

                </form>

              </div>
            </div>

            {/* Sidebar Safety Tips & Guidance (1 col) */}
            <div className="space-y-6">
              
              {/* Card 1: What happens next */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
                <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs mb-3">
                  <Sparkles className="h-4 w-4" />
                  What Happens Next?
                </div>
                <ul className="space-y-3 text-xs text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="h-5 w-5 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      1
                    </span>
                    <span>Your report is logged under campus tracking with an instant reference ID.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="h-5 w-5 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      2
                    </span>
                    <span>CampusFind automatically scans newly registered found items across campus.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="h-5 w-5 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      3
                    </span>
                    <span>If a match occurs, you&apos;ll be notified to claim it from the designated Campus Security Desk.</span>
                  </li>
                </ul>
              </div>

              {/* Card 2: Campus Security Office Info */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-3">
                  <ShieldCheck className="h-4 w-4" />
                  Campus Safety Headquarters
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  If you lost an item with high sensitivity (Passport, official IDs, keys with address tags), please visit security immediately.
                </p>
                <div className="text-xs space-y-1.5 text-slate-400 border-t border-slate-700/60 pt-3">
                  <p><span className="text-white font-medium">Location:</span> Admin Bldg 4, Room 102</p>
                  <p><span className="text-white font-medium">Desk Hours:</span> 7:00 AM – 9:00 PM</p>
                  <p><span className="text-white font-medium">Emergency Line:</span> (555) 019-2834</p>
                </div>
              </div>

              {/* Card 3: Tips for better recovery */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5 text-amber-900">
                <div className="flex items-center gap-2 font-bold text-xs mb-2 text-amber-800">
                  <Info className="h-4 w-4" />
                  Tips for Better Recovery
                </div>
                <p className="text-xs leading-relaxed text-amber-800/90">
                  Attaching photos and secret identifying details (like custom engravings or wallpaper) drastically speeds up security verification and prevents false claims.
                </p>
              </div>

            </div>

          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
