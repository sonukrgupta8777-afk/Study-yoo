import React, { useState, useEffect } from 'react';
import { Subject } from '../types/index.js';
import { Trash2, Archive, Check } from 'lucide-react';

interface SubjectModalProps {
  isOpen: boolean;
  subjectToEdit?: Subject | null;
  onClose: () => void;
  onSave: (data: { name: string; icon: string; color: string; id?: string }) => void;
  onDelete?: (id: string) => void;
}

const PRESET_ICONS = ['🦴', '🌱', '🧪', '🧮', '👩‍🎓', '📚', '🧬', '💻', '🎨', '📝', '⚡', '🧠', '🔬', '🏛️', '🌍', '📐'];
const PRESET_COLORS = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#14b8a6', // Teal
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#06b6d4', // Cyan
  '#84cc16', // Lime
];

export const SubjectModal: React.FC<SubjectModalProps> = ({
  isOpen,
  subjectToEdit,
  onClose,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📖');
  const [color, setColor] = useState('#6366f1');

  useEffect(() => {
    if (subjectToEdit) {
      setName(subjectToEdit.name);
      setIcon(subjectToEdit.icon);
      setColor(subjectToEdit.color);
    } else {
      setName('');
      setIcon('📖');
      setColor('#6366f1');
    }
  }, [subjectToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      icon,
      color,
      id: subjectToEdit?.id,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">
            {subjectToEdit ? 'Edit Subject' : 'Add New Subject'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Subject Preview Header */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner"
              style={{ backgroundColor: `${color}25`, color }}
            >
              {icon}
            </div>
            <div className="flex-1">
              <div className="text-xs text-slate-400">Preview</div>
              <div className="text-base font-bold text-white">
                {name || 'Subject Name'}
              </div>
            </div>
          </div>

          {/* Name Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Subject Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Zoology, Chemistry, Calculus..."
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Icon Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Choose Icon</label>
            <div className="grid grid-cols-8 gap-2 p-2 rounded-2xl bg-slate-950 border border-white/10 max-h-32 overflow-y-auto">
              {PRESET_ICONS.map(i => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setIcon(i)}
                  className={`h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                    icon === i
                      ? 'bg-indigo-600/30 border border-indigo-500 scale-110'
                      : 'hover:bg-white/5'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Accent Color</label>
            <div className="flex items-center gap-2 p-2 rounded-2xl bg-slate-950 border border-white/10 overflow-x-auto">
              {PRESET_COLORS.map(c => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center transition-transform hover:scale-110"
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            {subjectToEdit && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete ${subjectToEdit.name}? Study history will remain preserved.`)) {
                    onDelete(subjectToEdit.id);
                    onClose();
                  }
                }}
                className="min-h-[44px] px-3.5 rounded-xl text-rose-400 hover:bg-rose-500/10 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-[44px] px-5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all"
              >
                Save Subject
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
