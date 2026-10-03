import React, { useState, useEffect } from 'react';
import { EditLogItem } from '../types/index.js';
import { api } from '../utils/api.js';
import { History, Shield, Clock } from 'lucide-react';

interface EditLogViewProps {
  onClose: () => void;
}

export const EditLogView: React.FC<EditLogViewProps> = ({ onClose }) => {
  const [logs, setLogs] = useState<EditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getEditLogs().then(res => {
      setLogs(res.logs);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white">Activity & Edit Log</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <p className="text-xs text-slate-400">
          Tamper-evident audit trail of your study sessions, goals, subjects and group interactions.
        </p>

        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {loading ? (
            <div className="text-center py-8 text-xs text-slate-500">Loading audit history...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">No modifications logged yet.</div>
          ) : (
            logs.map(log => (
              <div
                key={log.id}
                className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-semibold text-white">{log.action}</div>
                  <div className="text-slate-400">{log.details}</div>
                </div>

                <div className="text-[10px] text-slate-500 font-mono shrink-0">
                  {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  {' '}
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-2 border-t border-white/5">
          <button
            onClick={onClose}
            className="w-full min-h-[44px] rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold transition-colors"
          >
            Close Log
          </button>
        </div>
      </div>
    </div>
  );
};
