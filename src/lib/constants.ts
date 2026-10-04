import { 
  Category, 
  CampusFeature, 
  HowItWorksStep 
} from '@/types';

export const CATEGORIES: Category[] = [
  'Electronics',
  'IDs & Cards',
  'Books & Notes',
  'Keys & Access',
  'Clothing & Accessories',
  'Bags & Wallets',
  'Bottles & Containers',
  'Other',
];

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    step: '01',
    title: 'Report Your Item',
    description: 'Whether you lost an item or discovered an unattended one, log the details, photos, and campus location in 60 seconds.',
    badge: 'Quick & Simple',
  },
  {
    step: '02',
    title: 'Smart Indexing & Matching',
    description: 'CampusFind categorizes the item instantly. Students can browse the searchable live registry or get notified of matching items.',
    badge: 'Real-time Feed',
  },
  {
    step: '03',
    title: 'Verified Security Claim',
    description: 'Submit an ownership claim with identifying proof. Campus security verifies the details before handing over your belonging.',
    badge: 'Safe & Secure',
  },
];

export const CAMPUS_FEATURES: CampusFeature[] = [
  {
    title: 'Campus Security Custody',
    description: 'Found items are held securely in designated campus security lockers until verified owners claim them.',
    iconName: 'ShieldCheck',
    badge: 'Official Oversight',
  },
  {
    title: 'Precise Location Tagging',
    description: 'Pinpoint exact campus spots like PCP, 6th Building, Canteen, or specific classrooms.',
    iconName: 'MapPin',
    badge: 'Campus Mapped',
  },
  {
    title: 'Student ID & Privacy Protection',
    description: 'Personal contact details are guarded. Only official security officers inspect sensitive ownership verification.',
    iconName: 'Lock',
    badge: 'Privacy First',
  },
  {
    title: 'Live Claim Status Tracking',
    description: 'Track your report or claim from "Submitted" to "Under Review by Security" to "Ready for Pickup".',
    iconName: 'Clock',
    badge: 'Transparency',
  },
  {
    title: 'Smart Categorization',
    description: 'Quickly filter through electronics, student ID cards, notebooks, wallets, and keys with one click.',
    iconName: 'LayoutGrid',
    badge: 'Organized',
  },
  {
    title: 'Centralized Administrative Desk',
    description: 'Campus security staff have an easy interface to log items turned in at help desks and manage approvals.',
    iconName: 'FileCheck',
    badge: 'Staff Ready',
  },
];

export const STATS = [
  { label: 'Belongings Reunited', value: '1,240+' },
  { label: 'Campus Recovery Rate', value: '94%' },
  { label: 'Avg. Claim Review Time', value: '< 2 hrs' },
  { label: 'Designated Safe Pickup Desks', value: '5 Desks' },
];

export const STUDENT_PROFILE = {
  name: 'Maya Lin',
  studentId: 'STU-2024-8891',
  email: 'maya.lin@campus.edu',
  major: 'Computer Science',
  year: 'Sophomore',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
};

export const OFFICER_PROFILE = {
  name: 'Officer Vance',
  badgeNumber: 'SEC-402',
  department: 'Campus Safety & Dispatch Division',
  assignedStation: 'Administration Complex, Building 4 (Room 102)',
  shift: 'Day Shift (07:00 – 16:00)',
};
