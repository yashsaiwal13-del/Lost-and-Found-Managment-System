'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { 
  Shield, 
  Search, 
  Filter, 
  RefreshCw, 
  ArrowLeft, 
  Clock, 
  User, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Archive, 
  RotateCcw, 
  HelpCircle,
  Eye,
  Settings
} from 'lucide-react';
import { getAdminAuditLogs, AdminAuditLogEntry } from '@/app/actions/auditLogs';

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<AdminAuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<AdminAuditLogEntry | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchLogs = () => {
    setLoading(true);
    setError(null);
    startTransition(async () => {
      try {
        const res = await getAdminAuditLogs({ limit: 100 });
        if (res && res.logs) {
          setLogs(res.logs);
        } else {
          setError('Failed to load audit logs.');
        }
      } catch (err: any) {
        setError(err?.message || 'Network error loading audit logs.');
      } finally {
        setLoading(false);
      }
    });
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'REPORT_ARCHIVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Archive className="w-3 h-3" /> ARCHIVED
          </span>
        );
      case 'REPORT_RESTORED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <RotateCcw className="w-3 h-3" /> RESTORED
          </span>
        );
      case 'CLAIM_APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <CheckCircle2 className="w-3 h-3" /> CLAIM APPROVED
          </span>
        );
      case 'CLAIM_REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3 h-3" /> CLAIM REJECTED
          </span>
        );
      case 'VERIFICATION_REQUESTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <HelpCircle className="w-3 h-3" /> VERIFICATION SENT
          </span>
        );
      case 'VERIFICATION_REVIEWED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <CheckCircle2 className="w-3 h-3" /> VERIF REVIEWED
          </span>
        );
      case 'HANDOVER_CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> HANDOVER COMPLETED
          </span>
        );
      case 'ADMIN_SETTINGS_CHANGED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Settings className="w-3 h-3" /> SETTINGS CHANGED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            {action}
          </span>
        );
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      !query ||
      log.action.toLowerCase().includes(query) ||
      log.actorName.toLowerCase().includes(query) ||
      log.actorEmail.toLowerCase().includes(query) ||
      log.targetType.toLowerCase().includes(query) ||
      (log.targetId && log.targetId.toLowerCase().includes(query)) ||
      (log.metadata && JSON.stringify(log.metadata).toLowerCase().includes(query));

    return matchesAction && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Link
                href="/admin"
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition"
                title="Back to Admin Console"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">System Security & Audit Trail</h1>
                <p className="text-sm text-slate-400">
                  Immutable record of moderation, claim adjudications, verification decisions, and administrative actions.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchLogs}
              disabled={loading || isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition text-sm font-medium disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <Link
              href="/admin"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition shadow-lg shadow-indigo-600/20"
            >
              Admin Dashboard
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by actor name, email, target ID, or action metadata..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition appearance-none cursor-pointer"
            >
              <option value="ALL">All Event Types</option>
              <option value="REPORT_ARCHIVED">Report Archived</option>
              <option value="REPORT_RESTORED">Report Restored</option>
              <option value="CLAIM_APPROVED">Claim Approved</option>
              <option value="CLAIM_REJECTED">Claim Rejected</option>
              <option value="VERIFICATION_REQUESTED">Verification Sent</option>
              <option value="VERIFICATION_REVIEWED">Verification Reviewed</option>
              <option value="HANDOVER_CONFIRMED">Handover Completed</option>
              <option value="ADMIN_SETTINGS_CHANGED">Admin Settings Changed</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-medium">Timestamp</th>
                  <th className="py-3.5 px-4 font-medium">Action</th>
                  <th className="py-3.5 px-4 font-medium">Actor</th>
                  <th className="py-3.5 px-4 font-medium">Target</th>
                  <th className="py-3.5 px-4 font-medium">Context / Metadata</th>
                  <th className="py-3.5 px-4 font-medium text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      <div className="inline-flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                        Loading secure audit trail records...
                      </div>
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No audit events match your search or filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{new Date(log.createdAt).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getActionBadge(log.action)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                            {log.actorName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-white">{log.actorName}</div>
                            <div className="text-[11px] text-slate-400">{log.actorRole}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs">
                        <span className="font-mono text-slate-300 bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/50">
                          {log.targetType}:{log.targetId?.slice(0, 8) || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs max-w-xs truncate text-slate-400">
                        {log.metadata ? (
                          <span className="font-mono text-[11px] text-slate-300">
                            {JSON.stringify(log.metadata)}
                          </span>
                        ) : (
                          <span className="text-slate-600 italic">No extra metadata</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 hover:text-white transition"
                        >
                          <Eye className="w-3 h-3" /> Inspect
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selectedLog && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-semibold text-white text-base">Audit Log Event Details</h3>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-slate-400 hover:text-white text-sm font-semibold p-1"
                >
                  X
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Event ID</span>
                    <span className="font-mono text-slate-300">{selectedLog.id}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Timestamp</span>
                    <span>{new Date(selectedLog.createdAt).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Actor</span>
                    <span>{selectedLog.actorName} ({selectedLog.actorRole})</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Target</span>
                    <span className="font-mono">{selectedLog.targetType}: {selectedLog.targetId}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 font-medium block mb-1">Sanitized Event Metadata:</span>
                  <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-60">
                    {JSON.stringify(selectedLog.metadata || {}, null, 2)}
                  </pre>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Note: Passwords, tokens, and raw question answers are strictly excluded from audit records.
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
