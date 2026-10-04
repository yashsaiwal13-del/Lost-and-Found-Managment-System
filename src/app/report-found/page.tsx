'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { 
  PlusCircle, 
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
  Building2,
  Sparkles,
  Search,
  LayoutDashboard,
  Lock
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CATEGORIES } from '@/lib/constants';
import { CAMPUS_LOCATIONS } from '@/lib/campusLocations';
import { submitFoundItemReport } from '@/app/actions/reportFound';

interface FormState {
  itemName: string;
  category: string;
  description: string;
  location: string;
  specificLocation: string;
  dateFound: string;
  timeFound: string;
  storageLocation: string;
  customStorage: string;
}

interface FormErrors {
  itemName?: string;
  category?: string;
  description?: string;
  location?: string;
  dateFound?: string;
  timeFound?: string;
  storageLocation?: string;
}

const STORAGE_OPTIONS = [
  'Turned in to Main Campus Security Desk',
  'Turned in to 6th Building Security / Reception Desk',
  'Turned in to PCP Department Office',
  'Turned in to SBPIM(MBA) Office',
  'Turned in to Architecture Building (5th Floor) Desk',
  'Turned in to Hostel Security Office',
  'With Finder (Holding temporarily until verified owner claims)',
  'Other Campus Location (Specify Below)',
];

export default function ReportFoundPage() {
  const [formData, setFormData] = useState<FormState>({
    itemName: '',
    category: '',
    description: '',
    location: '',
    specificLocation: '',
    dateFound: '',
    timeFound: '',
    storageLocation: '',
    customStorage: '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [referenceId, setReferenceId] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Image Selection & Preview with strict file type and size validation
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        alert('Invalid file format. Only JPG, PNG, WebP, and GIF images are permitted.');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('Image file size exceeds 5MB limit. Please upload a smaller file.');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
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
      newErrors.description = 'Please describe the found item.';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description should be at least 10 characters.';
    }
    if (!formData.location) {
      newErrors.location = 'Please select the campus building or area where it was found.';
    }
    if (!formData.dateFound) {
      newErrors.dateFound = 'Date found is required.';
    }
    if (!formData.timeFound) {
      newErrors.timeFound = 'Approximate time found is required.';
    }
    if (!formData.storageLocation) {
      newErrors.storageLocation = 'Please select where the item is currently held.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      const firstError = document.querySelector('[data-has-error="true"]');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitFoundItemReport({
        itemName: formData.itemName,
        category: formData.category,
        description: formData.description,
        location: formData.location,
        specificLocation: formData.specificLocation,
        dateFound: formData.dateFound,
        timeFound: formData.timeFound,
        storageLocation: formData.storageLocation,
        customStorage: formData.customStorage,
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
      dateFound: '',
      timeFound: '',
      storageLocation: '',
      customStorage: '',
    });
    handleRemoveImage();
    setErrors({});
    setIsSubmitted(false);
    setReferenceId('');
  };

  const effectiveStorage = formData.storageLocation === 'Other Campus Location (Specify Below)' 
    ? (formData.customStorage || 'Specified by finder') 
    : formData.storageLocation;

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
          <span className="text-slate-900 font-semibold">Report Found Item</span>
        </nav>

        {isSubmitted ? (
          /* SUCCESS SCREEN */
          <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-12 shadow-xl shadow-slate-200/50 text-center animate-in zoom-in-95 duration-200 max-w-2xl mx-auto">
            <div className="h-20 w-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-inner">
              <CheckCircle2 className="h-11 w-11" />
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-3">
              <ShieldCheck className="h-3.5 w-3.5" />
              Found Item Registered in Public Registry
            </span>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Thank You for Your Honesty! 🎉
            </h1>

            <p className="text-slate-600 text-sm mt-3 leading-relaxed max-w-lg mx-auto">
              Your turn-in report for <span className="font-semibold text-slate-800">{formData.itemName}</span> has been logged. Students searching for matching lost items can now discover and submit ownership claims.
            </p>

            {/* Reference Card */}
            <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-200 max-w-md mx-auto text-left">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="text-xs text-slate-500 font-medium">Tracking Reference Number</span>
                <span className="text-sm font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
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
                  <span className="text-slate-500">Found At:</span>
                  <span className="font-medium text-slate-700">{formData.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Storage:</span>
                  <span className="font-medium text-emerald-700 text-right max-w-[200px] truncate">
                    {effectiveStorage}
                  </span>
                </div>
                {imagePreview && (
                  <div className="pt-2 flex items-center gap-3">
                    <span className="text-slate-500">Attached Photo:</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={imagePreview} 
                      alt="Uploaded found item" 
                      className="h-10 w-10 object-cover rounded-lg border border-slate-200" 
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Drop-off Guidance */}
            <div className="mt-6 p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900 max-w-md mx-auto text-left flex items-start gap-2.5">
              <Building2 className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
              <span>
                If you still have the item in your possession, please deposit it at the <strong>Main Campus Security Desk (Building 4, Room 102)</strong> or the nearest building receptionist.
              </span>
            </div>

            {/* Navigation Actions */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
              >
                <LayoutDashboard className="h-4 w-4" />
                View in Student Dashboard
              </Link>
              <Link
                href="/#browse"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition-all"
              >
                <Search className="h-4 w-4 text-indigo-500" />
                Browse Registry
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
                  <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                    <PlusCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                      Register a Found Item
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Log details of an unattended item you discovered on campus so the owner can be identified.
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
                      placeholder="e.g. Texas Instruments Calculator, Hydro Flask, Set of Keys"
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
                        <Info className="h-3 w-3" />
                        {errors.itemName}
                      </p>
                    )}
                  </div>

                  {/* 2. Category */}
                  <div data-has-error={!!errors.category}>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Category <span className="text-rose-500">*</span>
                    </label>
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
                    {errors.category && (
                      <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                        <Info className="h-3 w-3" />
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
                      placeholder="Describe color, brand, condition, visible case, or general appearance..."
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
                        <Info className="h-3 w-3" />
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
                      <div className="relative border border-emerald-200 bg-emerald-50/30 rounded-2xl p-4 flex items-center gap-4">
                        <div className="relative h-20 w-20 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-white">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imagePreview}
                            alt="Found item preview"
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
                            <CheckCircle2 className="h-3 w-3" /> Attached to found registry
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
                        className="border-2 border-dashed border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/20 rounded-2xl p-6 text-center transition-colors cursor-pointer group"
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageChange}
                          accept="image/png, image/jpeg, image/webp"
                          className="hidden"
                        />
                        <div className="h-10 w-10 rounded-xl bg-slate-100 group-hover:bg-emerald-100 text-slate-500 group-hover:text-emerald-600 flex items-center justify-center mx-auto mb-2 transition-colors">
                          <UploadCloud className="h-5 w-5" />
                        </div>
                        <p className="text-xs font-semibold text-slate-800 group-hover:text-emerald-600 transition-colors">
                          Click or drag image to upload
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          PNG, JPG, or WEBP up to 5MB
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 5. Location Found */}
                  <div data-has-error={!!errors.location}>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Campus Location Found <span className="text-rose-500">*</span>
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
                        <Info className="h-3 w-3" />
                        {errors.location}
                      </p>
                    )}

                    <input
                      type="text"
                      placeholder="Specific room, floor, or spot (e.g. Room 204, 6th Building)"
                      value={formData.specificLocation}
                      onChange={(e) => setFormData({ ...formData, specificLocation: e.target.value })}
                      className="mt-2 w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/30 focus:bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* 6. Date Found & 7. Time Found */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div data-has-error={!!errors.dateFound}>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Date Found <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        max={new Date().toISOString().split('T')[0]}
                        value={formData.dateFound}
                        onChange={(e) => {
                          setFormData({ ...formData, dateFound: e.target.value });
                          if (errors.dateFound) setErrors({ ...errors, dateFound: undefined });
                        }}
                        className={`w-full text-xs px-3.5 py-2.5 rounded-xl border bg-slate-50/50 transition-colors focus:bg-white focus:outline-none ${
                          errors.dateFound
                            ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 text-rose-900'
                            : 'border-slate-200 focus:border-indigo-500'
                        }`}
                      />
                      {errors.dateFound && (
                        <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          {errors.dateFound}
                        </p>
                      )}
                    </div>

                    <div data-has-error={!!errors.timeFound}>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Approximate Time Found <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 11:15 AM or around lunch time"
                        value={formData.timeFound}
                        onChange={(e) => {
                          setFormData({ ...formData, timeFound: e.target.value });
                          if (errors.timeFound) setErrors({ ...errors, timeFound: undefined });
                        }}
                        className={`w-full text-xs px-3.5 py-2.5 rounded-xl border bg-slate-50/50 transition-colors focus:bg-white focus:outline-none ${
                          errors.timeFound
                            ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 text-rose-900'
                            : 'border-slate-200 focus:border-indigo-500'
                        }`}
                      />
                      {errors.timeFound && (
                        <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          {errors.timeFound}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 8. Current Storage Location (Requested) */}
                  <div data-has-error={!!errors.storageLocation}>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Current Custody / Storage Location <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.storageLocation}
                      onChange={(e) => {
                        setFormData({ ...formData, storageLocation: e.target.value });
                        if (errors.storageLocation) setErrors({ ...errors, storageLocation: undefined });
                      }}
                      className={`w-full text-xs px-3.5 py-2.5 rounded-xl border bg-slate-50/50 transition-colors focus:bg-white focus:outline-none cursor-pointer ${
                        errors.storageLocation
                          ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500'
                          : 'border-slate-200 focus:border-indigo-500'
                      }`}
                    >
                      <option value="">-- Where is the item currently stored? --</option>
                      {STORAGE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    {errors.storageLocation && (
                      <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        {errors.storageLocation}
                      </p>
                    )}

                    {formData.storageLocation === 'Other Campus Location (Specify Below)' && (
                      <input
                        type="text"
                        required
                        placeholder="Please specify current holding place or department office..."
                        value={formData.customStorage}
                        onChange={(e) => setFormData({ ...formData, customStorage: e.target.value })}
                        className="mt-2 w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/30 focus:bg-white focus:outline-none focus:border-indigo-500"
                      />
                    )}

                    <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                      <Lock className="h-3 w-3 text-slate-400 shrink-0" />
                      For items held with finders, Campus Security will verify the claimant before connecting parties.
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
                      className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/25 active:scale-95 disabled:opacity-70 transition-all cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          <span>Registering Item...</span>
                        </>
                      ) : (
                        <>
                          <PlusCircle className="h-4 w-4" />
                          <span>Register Found Item</span>
                        </>
                      )}
                    </button>
                  </div>

                </form>

              </div>
            </div>

            {/* Sidebar Finder Guidance (1 col) */}
            <div className="space-y-6">
              
              {/* Card 1: Safe Custody Notice */}
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-5 text-emerald-950">
                <div className="flex items-center gap-2 font-bold text-xs mb-2 text-emerald-800">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Campus Finder Protocol
                </div>
                <p className="text-xs leading-relaxed text-emerald-900/90">
                  You are performing a great service to your campus community. Whenever possible, hand high-value electronics, wallets, or keys directly to Security staff or building receptionists.
                </p>
              </div>

              {/* Card 2: Campus Safety Drop Desks */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
                <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs mb-3">
                  <Building2 className="h-4 w-4" />
                  Authorized Turn-In Desks
                </div>
                <ul className="space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span><strong>Campus Safety Desk:</strong> Main Security Office (24/7)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span><strong>6th Building Desk:</strong> Ground Floor Reception (8 AM – 6 PM)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span><strong>PCP / SBPIM Office:</strong> Department Office (9 AM – 5 PM)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span><strong>Hostel Office:</strong> Girls & Boys Hostel Security Desks</span>
                  </li>
                </ul>
              </div>

              {/* Card 3: Privacy Assurance */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs mb-3">
                  <Lock className="h-4 w-4" />
                  Finder Privacy Protected
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Your personal phone number and private student contact information are never shared with claimants without your explicit consent.
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
