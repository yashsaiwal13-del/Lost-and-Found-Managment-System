'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { Icon, type IconName } from '@/components/ui/Icon';
import { CAMPUS_LOCATIONS } from '@/lib/campusLocations';
import { submitLostItemReport } from '@/app/actions/reportLost';

interface FormData {
  type: string;
  customItem: string;
  itemName: string;
  category: string;
  description: string;
  location: string;
  specificPlace: string;
  dateLost: string;
  timeLost: string;
  additionalDetails: string;
}

const itemTypes: { name: string; icon: IconName }[] = [
  { name: 'Headphones', icon: 'headphones' },
  { name: 'Wallet', icon: 'wallet' },
  { name: 'Bottle', icon: 'bottle' },
  { name: 'Phone', icon: 'phone' },
  { name: 'Bag', icon: 'bag' },
  { name: 'Keys', icon: 'key' },
];

const quickLocations = [
  { name: 'PCP', detail: 'Central academic block' },
  { name: '6th Building', detail: 'Lecture halls & labs' },
  { name: 'Hostels', detail: 'Student residences' },
  { name: 'Architecture', detail: 'Studios & workshops' },
];

const CATEGORIES = [
  'Electronics',
  'IDs & Cards',
  'Books & Notes',
  'Keys & Access',
  'Clothing & Accessories',
  'Bags & Wallets',
  'Bottles & Containers',
  'Other',
];

export default function ReportLostPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({
    type: 'Headphones',
    customItem: '',
    itemName: '',
    category: 'Electronics',
    description: '',
    location: '6th Building',
    specificPlace: '',
    dateLost: new Date().toISOString().split('T')[0],
    timeLost: '',
    additionalDetails: '',
  });

  const [confirmed, setConfirmed] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [referenceId, setReferenceId] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const steps = ['Item', 'Details', 'Location', 'Review'];

  const update = (key: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSelectType = (typeName: string) => {
    update('type', typeName);
    if (typeName !== 'Something else') {
      if (!form.itemName || itemTypes.some((t) => form.itemName.toLowerCase().includes(t.name.toLowerCase()))) {
        update('itemName', typeName);
      }
      if (typeName === 'Headphones' || typeName === 'Phone') {
        update('category', 'Electronics');
      } else if (typeName === 'Wallet' || typeName === 'Bag') {
        update('category', 'Bags & Wallets');
      } else if (typeName === 'Keys') {
        update('category', 'Keys & Access');
      } else if (typeName === 'Bottle') {
        update('category', 'Bottles & Containers');
      }
    }
  };

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
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const selectedName = form.type === 'Something else' ? (form.customItem || 'Item') : form.type;

  const nextDisabled =
    (step === 1 &&
      (!form.type || (form.type === 'Something else' && !form.customItem.trim()))) ||
    (step === 2 &&
      (!form.itemName.trim() ||
        form.itemName.trim().length < 2 ||
        !form.description.trim() ||
        form.description.trim().length < 10)) ||
    (step === 3 && (!form.location || !form.dateLost)) ||
    (step === 4 && (!confirmed || isSubmitting));

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const finalName = form.itemName.trim() || (form.type === 'Something else' ? form.customItem.trim() : form.type);
      const result = await submitLostItemReport({
        itemName: finalName,
        category: form.category,
        description: form.description.trim(),
        location: form.location,
        specificLocation: form.specificPlace.trim(),
        dateLost: form.dateLost,
        timeLost: form.timeLost.trim(),
        additionalDetails: form.additionalDetails.trim(),
        image: imagePreview,
      });

      if (result.success && result.item) {
        setReferenceId(result.item.id);
        setSubmitted(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setSubmitError(result.error || 'Failed to submit report. Please check your fields and sign in.');
      }
    } catch (err: any) {
      console.error(err);
      setSubmitError(err?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm({
      type: 'Headphones',
      customItem: '',
      itemName: '',
      category: 'Electronics',
      description: '',
      location: '6th Building',
      specificPlace: '',
      dateLost: new Date().toISOString().split('T')[0],
      timeLost: '',
      additionalDetails: '',
    });
    handleRemoveImage();
    setStep(1);
    setSubmitted(false);
    setReferenceId('');
    setSubmitError(null);
  };

  const activeIcon = itemTypes.find((item) => item.name === form.type)?.icon || 'sparkle';

  const formattedRef = referenceId
    ? (referenceId.startsWith('CF-') ? referenceId : `CF-L-${referenceId.slice(-4).toUpperCase()}`)
    : 'CF-L-2048';

  return (
    <div className="app">
      <Header />

      {submitted ? (
        <main className="report-layout lost">
          <section className="success-state">
            <div className="success-art">
              <span className="success-ring ring-one" />
              <span className="success-ring ring-two" />
              <div className="success-icon">
                <Icon name="check" size={42} />
              </div>
              <div className="success-card mini-a">
                <Icon name="sparkle" size={17} /> Report verified
              </div>
              <div className="success-card mini-b">
                <Icon name="shield" size={17} /> Campus Safety
              </div>
            </div>
            <span className="section-kicker">Report received</span>
            <h1>Lost report submitted</h1>
            <p>
              We’ll notify you as soon as a potential match is found by campus security or fellow students.
            </p>
            <div className="success-reference">
              Tracking Reference <strong>{formattedRef}</strong>
            </div>
            <div className="success-actions">
              <Link href="/dashboard" className="button button-lost">
                View My Reports <Icon name="arrow" size={17} />
              </Link>
              <button className="button button-quiet" onClick={handleReset}>
                Report another item
              </button>
              <Link href="/" className="button button-quiet">
                Back to home
              </Link>
            </div>
          </section>
        </main>
      ) : (
        <main className="report-layout lost">
          <aside className="report-aside">
            <Link href="/" className="back-link">
              <Icon name="arrow" size={18} /> Back to home
            </Link>
            <span className="report-tag">Lost item report</span>
            <h1>Help us find your item.</h1>
            <p>
              The more detail you share, the stronger your potential matches will be across the campus safety registry.
            </p>
            <div className="aside-illustration">
              <div className="aside-building">
                <Icon name="building" size={56} />
              </div>
              <span className="path-dot p1" />
              <span className="path-dot p2" />
              <span className="path-dot p3" />
              <div className="aside-item">
                <Icon name="headphones" size={36} />
              </div>
            </div>
            <div className="privacy-note">
              <Icon name="shield" size={18} />
              <span>
                <strong>Your report is protected</strong>
                <small>Only verified staff and security can view private details.</small>
              </span>
            </div>
          </aside>

          <section className="report-main">
            <div className="progress-wrap">
              <div className="progress-label">
                <span>Report progress</span>
                <strong>{step} of 4</strong>
              </div>
              <div className="progress-steps">
                {steps.map((label, index) => (
                  <button
                    key={label}
                    type="button"
                    className={`${step === index + 1 ? 'active' : ''} ${
                      step > index + 1 ? 'complete' : ''
                    }`}
                    onClick={() => index + 1 < step && setStep(index + 1)}
                  >
                    <i>
                      {step > index + 1 ? (
                        <Icon name="check" size={14} />
                      ) : (
                        `0${index + 1}`
                      )}
                    </i>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-panel">
              {submitError && (
                <div
                  style={{
                    padding: '14px 18px',
                    marginBottom: '24px',
                    borderRadius: '12px',
                    background: '#fbeae8',
                    border: '1px solid #f2b8b5',
                    color: '#9c2f2f',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <Icon name="sparkle" size={18} />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Step 1: Item Type */}
              {step === 1 && (
                <div className="form-step">
                  <span className="form-kicker">Step 01</span>
                  <h2>What did you lose?</h2>
                  <p>Choose the closest item type. You can add specific model and color details next.</p>
                  <div className="item-grid">
                    {itemTypes.map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        className={
                          form.type === item.name
                            ? 'item-option selected'
                            : 'item-option'
                        }
                        onClick={() => handleSelectType(item.name)}
                      >
                        <span>
                          <Icon name={item.icon} size={29} />
                        </span>
                        <strong>{item.name}</strong>
                        {form.type === item.name && (
                          <i>
                            <Icon name="check" size={13} />
                          </i>
                        )}
                      </button>
                    ))}
                    <button
                      type="button"
                      className={
                        form.type === 'Something else'
                          ? 'item-option custom selected'
                          : 'item-option custom'
                      }
                      onClick={() => handleSelectType('Something else')}
                    >
                      <span className="ellipsis">•••</span>
                      <strong>Something else</strong>
                      {form.type === 'Something else' && (
                        <i>
                          <Icon name="check" size={13} />
                        </i>
                      )}
                    </button>
                  </div>
                  {form.type === 'Something else' && (
                    <div className="custom-reveal">
                      <label htmlFor="custom-item">What did you lose?</label>
                      <div className="input-wrap">
                        <Icon name="sparkle" size={18} />
                        <input
                          id="custom-item"
                          autoFocus
                          value={form.customItem}
                          onChange={(e) => {
                            update('customItem', e.target.value);
                            update('itemName', e.target.value);
                          }}
                          placeholder="e.g. Scientific calculator, Umbrella, Jacket..."
                        />
                      </div>
                      <small>
                        Anything is welcome — unusual items are often the easiest to match!
                      </small>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Details */}
              {step === 2 && (
                <div className="form-step">
                  <span className="form-kicker">Step 02</span>
                  <h2>Tell us the useful details.</h2>
                  <p>
                    Distinctive information helps us separate your item from similar reports.
                  </p>
                  <div className="field">
                    <label htmlFor="item-name">
                      Item name <b>Required</b>
                    </label>
                    <input
                      id="item-name"
                      value={form.itemName}
                      onChange={(e) => update('itemName', e.target.value)}
                      placeholder={
                        form.type === 'Headphones'
                          ? 'e.g. Black Sony WH-1000XM5 headphones'
                          : `Describe the ${selectedName.toLowerCase()}`
                      }
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="category">Category <b>Required</b></label>
                    <div className="select-wrap">
                      <select
                        id="category"
                        value={form.category}
                        onChange={(e) => update('category', e.target.value)}
                      >
                        {CATEGORIES.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                      <Icon name="chevron" size={17} />
                    </div>
                  </div>

                  <div className="field">
                    <label htmlFor="description">
                      Description <b>Required (min 10 characters)</b>
                    </label>
                    <textarea
                      id="description"
                      value={form.description}
                      onChange={(e) => update('description', e.target.value)}
                      placeholder="Color, brand, scratches, stickers, contents, case color, or any distinctive marks…"
                      rows={4}
                    />
                    <small>
                      Do not include private lock screen passwords or PINs.
                    </small>
                  </div>

                  <div className="field">
                    <label htmlFor="photo">
                      Photo Upload <span>Optional</span>
                    </label>
                    {imagePreview ? (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          padding: '12px',
                          borderRadius: '12px',
                          border: '1px solid var(--line)',
                          background: 'var(--paper)',
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imagePreview}
                          alt="Uploaded lost item"
                          style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '10px',
                            objectFit: 'cover',
                            border: '1px solid var(--line)',
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong style={{ fontSize: '12px', color: 'var(--navy)', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {imageFile?.name || 'Item photo attached'}
                          </strong>
                          <small style={{ color: 'var(--muted)', fontSize: '10px' }}>
                            {imageFile ? `${(imageFile.size / 1024).toFixed(1)} KB` : 'Ready for matching'}
                          </small>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="button button-quiet"
                          style={{ minHeight: '36px', padding: '0 12px', fontSize: '11px' }}
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          border: '2px dashed var(--line)',
                          borderRadius: '12px',
                          padding: '24px 16px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          background: 'rgba(246, 237, 223, 0.4)',
                        }}
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageChange}
                          accept="image/png, image/jpeg, image/webp"
                          style={{ display: 'none' }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                          <Icon name="sparkle" size={24} />
                          <strong style={{ fontSize: '12px', color: 'var(--navy)' }}>
                            Click to attach a photo
                          </strong>
                          <small style={{ fontSize: '10px', color: 'var(--muted)' }}>
                            PNG, JPG, or WEBP up to 5MB
                          </small>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Location */}
              {step === 3 && (
                <div className="form-step">
                  <span className="form-kicker">Step 03</span>
                  <h2>Where and when did you last have it?</h2>
                  <p>Choose a campus zone first, then add a room or nearby landmark.</p>
                  
                  <fieldset className="location-options">
                    <legend>
                      Quick Campus Locations <b>Select One</b>
                    </legend>
                    {quickLocations.map((location) => (
                      <button
                        key={location.name}
                        type="button"
                        className={form.location === location.name ? 'selected' : ''}
                        onClick={() => update('location', location.name)}
                      >
                        <span>
                          <Icon name="building" size={22} />
                        </span>
                        <div>
                          <strong>{location.name}</strong>
                          <small>{location.detail}</small>
                        </div>
                        {form.location === location.name && (
                          <i>
                            <Icon name="check" size={13} />
                          </i>
                        )}
                      </button>
                    ))}
                  </fieldset>

                  <div className="field">
                    <label htmlFor="all-locations">
                      Full Campus Building / Area <b>Required</b>
                    </label>
                    <div className="select-wrap">
                      <select
                        id="all-locations"
                        value={form.location}
                        onChange={(e) => update('location', e.target.value)}
                      >
                        <option value="">-- Select Campus Building / Zone --</option>
                        {CAMPUS_LOCATIONS.filter((l) => l !== 'All Locations').map((loc) => (
                          <option key={loc} value={loc}>
                            {loc}
                          </option>
                        ))}
                      </select>
                      <Icon name="chevron" size={17} />
                    </div>
                  </div>

                  <div className="form-two-col">
                    <div className="field">
                      <label htmlFor="specific">
                        Specific place <span>Optional</span>
                      </label>
                      <input
                        id="specific"
                        value={form.specificPlace}
                        onChange={(e) => update('specificPlace', e.target.value)}
                        placeholder="e.g. Room 204, 2nd Floor bench"
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="date">
                        Date Lost <b>Required</b>
                      </label>
                      <input
                        id="date"
                        type="date"
                        max={new Date().toISOString().split('T')[0]}
                        value={form.dateLost}
                        onChange={(e) => update('dateLost', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label htmlFor="time">
                      Approximate Time <span>Optional</span>
                    </label>
                    <input
                      id="time"
                      value={form.timeLost}
                      onChange={(e) => update('timeLost', e.target.value)}
                      placeholder="e.g. 10:30 AM or between 2:00 - 3:30 PM"
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="confidential-details">
                      Confidential Identification Markings <span>Security Only</span>
                    </label>
                    <input
                      id="confidential-details"
                      value={form.additionalDetails}
                      onChange={(e) => update('additionalDetails', e.target.value)}
                      placeholder="e.g. Lock screen wallpaper, custom initials engraved, serial number..."
                    />
                    <small>
                      This info is hidden from the public registry and only verified by Security during claims.
                    </small>
                  </div>
                </div>
              )}

              {/* Step 4: Review */}
              {step === 4 && (
                <div className="form-step">
                  <span className="form-kicker">Step 04</span>
                  <h2>Review your report.</h2>
                  <p>
                    Make sure everything looks right. You can go back to update any section.
                  </p>
                  <div className="review-card">
                    <div className="review-head">
                      <span>
                        <Icon name={activeIcon} size={28} />
                      </span>
                      <div>
                        <small>Lost item</small>
                        <h3>{form.itemName || selectedName}</h3>
                      </div>
                      <button type="button" onClick={() => setStep(2)}>
                        Edit
                      </button>
                    </div>
                    <dl>
                      <div>
                        <dt>Category</dt>
                        <dd>{form.category}</dd>
                      </div>
                      <div>
                        <dt>Location</dt>
                        <dd>
                          {form.location}
                          {form.specificPlace ? ` · ${form.specificPlace}` : ''}
                        </dd>
                      </div>
                      <div>
                        <dt>Date &amp; Time</dt>
                        <dd>
                          {form.dateLost}
                          {form.timeLost ? ` at ${form.timeLost}` : ''}
                        </dd>
                      </div>
                      <div className="full">
                        <dt>Description</dt>
                        <dd>{form.description}</dd>
                      </div>
                      {imagePreview && (
                        <div className="full">
                          <dt>Attached Photo</dt>
                          <dd style={{ marginTop: '6px' }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={imagePreview}
                              alt="Attached item preview"
                              style={{ width: '70px', height: '70px', borderRadius: '10px', objectFit: 'cover' }}
                            />
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  <label className="confirm-check" onClick={() => setConfirmed(!confirmed)}>
                    <input
                      type="checkbox"
                      checked={confirmed}
                      onChange={(e) => setConfirmed(e.target.checked)}
                    />
                    <span>
                      {confirmed && <Icon name="check" size={13} />}
                    </span>
                    <p>
                      I confirm this information is accurate to the best of my knowledge.
                    </p>
                  </label>

                  <div className="submit-note">
                    <Icon name="bell" size={18} />
                    <span>
                      We’ll notify you when a matching found report appears.
                    </span>
                  </div>
                </div>
              )}

              {/* Form Navigation Actions */}
              <div className="form-actions">
                {step > 1 ? (
                  <button
                    type="button"
                    className="button button-quiet"
                    onClick={() => setStep(step - 1)}
                    disabled={isSubmitting}
                  >
                    Back
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  className="button button-lost"
                  disabled={nextDisabled}
                  onClick={() => (step < 4 ? setStep(step + 1) : handleSubmit())}
                >
                  {isSubmitting ? (
                    <>
                      <span>Submitting Report...</span>
                    </>
                  ) : step < 4 ? (
                    <>
                      <span>Continue</span>
                      <Icon name="arrow" size={18} />
                    </>
                  ) : (
                    <>
                      <span>Submit Lost Report</span>
                      <Icon name="arrow" size={18} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>
        </main>
      )}

      <Footer />
    </div>
  );
}
