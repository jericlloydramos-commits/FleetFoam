import React from 'react';
import { Sparkles, RefreshCw, CheckCircle2, Clock, AlertTriangle, Star } from 'lucide-react';
import { JobStatus } from '@/lib/types';

interface CrewActionBarProps {
  status: JobStatus;
  isUpdating: boolean;
  actionLabel?: string;
  onAdvance: () => void;
  rating?: number;
  review?: string;
}

export const CrewActionBar: React.FC<CrewActionBarProps> = ({
  status,
  isUpdating,
  actionLabel,
  onAdvance,
  rating,
  review,
}) => {
  if (status === 'AWAITING_APPROVAL') {
    return (
      <div 
        className="p-5 bg-purple-50 border-2 border-purple-300 rounded-2xl text-center text-purple-950 font-extrabold text-sm flex flex-col sm:flex-row items-center justify-center gap-3 shadow-xs"
        role="status"
        aria-live="polite"
      >
        <Clock size={22} className="text-purple-600 animate-spin shrink-0" aria-hidden="true" />
        <div>
          <span className="block uppercase tracking-wider text-xs font-black text-purple-800">Awaiting Customer Approval</span>
          <span className="text-xs font-semibold text-purple-900 mt-0.5 block">
            Detailing work submitted! Waiting for customer to inspect their vehicle and confirm completion.
          </span>
        </div>
      </div>
    );
  }

  if (status === 'NEEDS_REVISIT') {
    return (
      <div 
        className="p-5 bg-rose-50 border-2 border-rose-300 rounded-2xl text-center text-rose-950 font-bold text-sm flex flex-col sm:flex-row items-center justify-center gap-3 shadow-xs"
        role="status"
        aria-live="polite"
      >
        <AlertTriangle size={22} className="text-rose-600 shrink-0" aria-hidden="true" />
        <div>
          <span className="block uppercase tracking-wider text-xs font-black text-rose-800">Follow-up Visit Requested</span>
          <span className="text-xs font-semibold text-rose-900 mt-0.5 block">
            Customer requested corrections. Operations is scheduling another day for you to return and finish.
          </span>
        </div>
      </div>
    );
  }

  if (status === 'COMPLETED') {
    return (
      <div 
        className="p-5 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-emerald-950 shadow-xs space-y-2 text-center"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center justify-center gap-2 font-black text-sm uppercase tracking-wide text-emerald-900">
          <CheckCircle2 size={20} className="text-emerald-600" aria-hidden="true" />
          <span>Job Fully Completed &amp; Approved by Customer</span>
        </div>
        {rating && (
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <span className="text-xs font-bold text-slate-600">Customer Rating:</span>
            <div className="flex items-center gap-0.5 text-amber-500">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={16}
                  className={s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                />
              ))}
            </div>
            <span className="text-xs font-black text-slate-800 ml-1">({rating}/5)</span>
          </div>
        )}
        {review && (
          <p className="text-xs italic text-emerald-800 font-medium max-w-md mx-auto">
            &quot;{review}&quot;
          </p>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={isUpdating}
      onClick={onAdvance}
      aria-busy={isUpdating}
      className="w-full min-h-[60px] py-4 px-6 bg-slate-900 hover:bg-slate-800 active:bg-black text-white font-extrabold text-lg uppercase tracking-wider rounded-xl shadow-md transition-all border-2 border-slate-800 flex items-center justify-center gap-3 focus:ring-4 focus:ring-sky-500 cursor-pointer"
    >
      {isUpdating ? (
        <>
          <RefreshCw className="animate-spin" size={20} aria-hidden="true" />
          <span>Syncing Server...</span>
        </>
      ) : (
        <>
          <Sparkles size={20} className="text-amber-400" aria-hidden="true" />
          <span>{actionLabel || 'Advance Status'}</span>
        </>
      )}
    </button>
  );
};
