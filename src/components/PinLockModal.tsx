import React, { useState } from 'react';
import { Lock, Unlock, ShieldAlert } from 'lucide-react';
import { api } from '../utils/api.js';

interface PinLockModalProps {
  mode: 'unlock' | 'set';
  onSuccess: () => void;
  onCancel?: () => void;
}

export const PinLockModal: React.FC<PinLockModalProps> = ({
  mode,
  onSuccess,
  onCancel,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleKeyPress = (digit: string) => {
    if (pin.length < 6) {
      const next = pin + digit;
      setPin(next);
      setError(null);
      if (next.length === 4) {
        verifyOrSet(next);
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError(null);
  };

  const verifyOrSet = async (code: string) => {
    if (mode === 'unlock') {
      try {
        const res = await api.verifyPin(code);
        if (res.valid) {
          onSuccess();
        } else {
          setError('Incorrect PIN. Try again.');
          setPin('');
        }
      } catch (err: any) {
        setError('Incorrect PIN. Try again.');
        setPin('');
      }
    } else {
      try {
        await api.setPin(code);
        onSuccess();
      } catch (err) {
        setError('Failed to configure PIN.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl">
      <div className="w-full max-w-xs text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto shadow-inner">
          {mode === 'unlock' ? <Lock className="w-8 h-8" /> : <Unlock className="w-8 h-8" />}
        </div>

        <div>
          <h2 className="text-xl font-bold text-white">
            {mode === 'unlock' ? 'App Locked' : 'Set Security PIN'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'unlock'
              ? 'Enter your 4-digit PIN to access ZenithStudy'
              : 'Choose a 4-digit PIN to lock your personal study data'}
          </p>
        </div>

        {/* PIN Dots */}
        <div className="flex items-center justify-center gap-4 py-2">
          {[0, 1, 2, 3].map(idx => (
            <div
              key={idx}
              className={`w-3.5 h-3.5 rounded-full border transition-all ${
                pin.length > idx
                  ? 'bg-indigo-400 border-indigo-400 scale-125'
                  : 'bg-white/5 border-white/20'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="text-xs text-rose-400 font-medium animate-shake">
            {error}
          </div>
        )}

        {/* Number Keypad */}
        <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k, idx) => {
            if (k === '') return <div key={idx} />;
            if (k === '⌫') {
              return (
                <button
                  key={idx}
                  onClick={handleBackspace}
                  className="h-14 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 text-slate-400 text-sm font-semibold flex items-center justify-center transition-all"
                >
                  ⌫
                </button>
              );
            }
            return (
              <button
                key={idx}
                onClick={() => handleKeyPress(k)}
                className="h-14 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 text-white text-lg font-bold font-mono flex items-center justify-center transition-all"
              >
                {k}
              </button>
            );
          })}
        </div>

        {onCancel && (
          <button
            onClick={onCancel}
            className="text-xs text-slate-400 hover:text-white pt-2"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};
