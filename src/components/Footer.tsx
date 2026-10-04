import React from 'react';
import { Compass, Phone, Mail, MapPin, Shield, Clock, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Col 1: Brand & Overview */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md">
                <Compass className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Campus<span className="text-indigo-400">Find</span>
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              The official centralized Lost &amp; Found Management Platform designed to streamline recovery, claim verification, and custody for college communities.
            </p>
            <div className="flex items-center gap-2 text-emerald-400 font-medium">
              <Shield className="h-3.5 w-3.5" />
              <span>Campus Safety Department Verified</span>
            </div>
          </div>

          {/* Col 2: Quick Navigation */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Quick Portals
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a href="/report-lost" className="hover:text-indigo-400 transition-colors">
                  Report a Lost Item
                </a>
              </li>
              <li>
                <a href="/report-found" className="hover:text-indigo-400 transition-colors">
                  Register a Found Item
                </a>
              </li>
              <li>
                <a href="/dashboard" className="hover:text-indigo-400 transition-colors">
                  Student Dashboard
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-indigo-400 transition-colors">
                  How Claim Verification Works
                </a>
              </li>
              <li>
                <a href="#security" className="hover:text-indigo-400 transition-colors">
                  Security Staff Login
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Campus Safety Desk */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Campus Security Headquarters
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>Administration Complex, Building 4, Ground Floor Room 102</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-400 shrink-0" />
                <span>Mon – Fri: 7:00 AM – 9:00 PM</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-400 shrink-0" />
                <span>Sat – Sun: 9:00 AM – 5:00 PM</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Emergency Contacts & Support */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Helpline &amp; Inquiries
            </h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="text-slate-300 font-semibold">(555) 019-2834</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-rose-400 shrink-0" />
                <span className="text-slate-300">24/7 Security Hotline: Ext. #911</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-indigo-400 shrink-0" />
                <a href="mailto:lostfound@college.edu" className="hover:text-white transition-colors">
                  lostfound@college.edu
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <p>© {new Date().getFullYear()} CampusFind. All rights reserved. Designed for College Campus Communities.</p>
          <div className="flex items-center gap-6">
            <span className="text-slate-500">Privacy Policy</span>
            <span className="text-slate-500">Terms of Campus Safety</span>
            <span className="text-slate-500">Student Conduct Guidelines</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
