import React from 'react';
import { JobStatus } from '@/lib/types';
import {
  Calendar,
  Truck,
  MapPin,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Star,
  RefreshCw,
} from 'lucide-react';

interface StatusBadgeProps {
  status: JobStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  className = '',
}) => {
  const getBadgeConfig = (status: JobStatus) => {
    switch (status) {
      case 'SCHEDULED':
        return {
          label: 'Scheduled',
          icon: Calendar,
          bgClass: 'bg-sky-50 text-sky-700 border-sky-200',
          iconClass: 'text-sky-600',
        };
      case 'ON_THE_WAY':
        return {
          label: 'On The Way',
          icon: Truck,
          bgClass: 'bg-amber-50 text-amber-800 border-amber-200',
          iconClass: 'text-amber-600 animate-pulse',
        };
      case 'ARRIVED':
        return {
          label: 'Arrived',
          icon: MapPin,
          bgClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          iconClass: 'text-indigo-600',
        };
      case 'IN_PROGRESS':
        return {
          label: 'In Progress',
          icon: Sparkles,
          bgClass: 'bg-cyan-50 text-cyan-800 border-cyan-300',
          iconClass: 'text-cyan-600 animate-spin',
        };
      case 'AWAITING_APPROVAL':
        return {
          label: 'Awaiting Customer Approval',
          icon: Clock,
          bgClass: 'bg-purple-50 text-purple-900 border-purple-300 font-extrabold',
          iconClass: 'text-purple-600 animate-pulse',
        };
      case 'COMPLETED':
        return {
          label: 'Completed',
          icon: CheckCircle2,
          bgClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          iconClass: 'text-emerald-600',
        };
      case 'NEEDS_REVISIT':
        return {
          label: 'Needs Follow-up Visit',
          icon: RefreshCw,
          bgClass: 'bg-rose-50 text-rose-900 border-rose-300 font-extrabold',
          iconClass: 'text-rose-600 animate-spin',
        };
      case 'CANCELLED':
        return {
          label: 'Cancelled',
          icon: XCircle,
          bgClass: 'bg-slate-100 text-slate-700 border-slate-300',
          iconClass: 'text-slate-500',
        };
      case 'DELAYED':
        return {
          label: 'Delayed',
          icon: AlertTriangle,
          bgClass: 'bg-rose-50 text-rose-800 border-rose-200',
          iconClass: 'text-rose-600',
        };
      default:
        return {
          label: status,
          icon: Calendar,
          bgClass: 'bg-slate-100 text-slate-700 border-slate-200',
          iconClass: 'text-slate-500',
        };
    }
  };

  const config = getBadgeConfig(status);
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1 border font-medium',
    md: 'px-3 py-1 text-xs sm:text-sm gap-1.5 border font-semibold',
    lg: 'px-4 py-1.5 text-sm sm:text-base gap-2 border font-bold',
  };

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20,
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-sm ${config.bgClass} ${sizeClasses[size]} ${className}`}
      aria-label={`Job status: ${config.label}`}
    >
      <Icon size={iconSizes[size]} className={config.iconClass} aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
};
