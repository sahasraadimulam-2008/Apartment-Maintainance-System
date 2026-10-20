import React from 'react';

export const PriorityBadge = ({ priority }) => {
  const styles = {
    Critical: 'bg-rose-50 text-rose-700 border-rose-200/80 font-semibold ring-1 ring-rose-500/10',
    High: 'bg-amber-50 text-amber-800 border-amber-200/80 font-medium ring-1 ring-amber-500/10',
    Medium: 'bg-teal-50 text-teal-800 border-teal-200/80 font-medium ring-1 ring-teal-500/10',
    Low: 'bg-slate-50 text-slate-700 border-slate-200/80 font-normal'
  };

  const style = styles[priority] || 'bg-ivory-100 text-navy-800 border-ivory-300';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border ${style}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {priority || 'Normal'}
    </span>
  );
};

export const StatusBadge = ({ status }) => {
  const styles = {
    Open: 'bg-amber-50 text-amber-800 border-amber-200/90',
    'In Progress': 'bg-blue-50 text-blue-800 border-blue-200/90',
    Resolved: 'bg-teal-50 text-teal-800 border-teal-200/90',
    Closed: 'bg-slate-100 text-slate-700 border-slate-300',
    Rejected: 'bg-rose-50 text-rose-800 border-rose-200/90',
    Pending: 'bg-amber-50 text-amber-800 border-amber-200/90',
    Paid: 'bg-emerald-50 text-emerald-800 border-emerald-200/90',
    Overdue: 'bg-rose-50 text-rose-800 border-rose-200/90',
    Available: 'bg-emerald-50 text-emerald-800 border-emerald-200/90',
    'On Duty': 'bg-blue-50 text-blue-800 border-blue-200/90',
    'On Leave': 'bg-slate-100 text-slate-700 border-slate-300',
    Unavailable: 'bg-rose-50 text-rose-800 border-rose-200/90',
    vacant: 'bg-slate-100 text-slate-700 border-slate-200',
    occupied: 'bg-teal-50 text-teal-800 border-teal-200',
    under_maintenance: 'bg-amber-50 text-amber-800 border-amber-200'
  };

  const style = styles[status] || 'bg-ivory-100 text-navy-800 border-ivory-300';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${style}`}>
      {status || 'Unknown'}
    </span>
  );
};

export const RoleBadge = ({ role }) => {
  const styles = {
    admin: 'bg-navy-900 text-ivory-50 border-navy-700',
    staff: 'bg-teal-glow text-white border-teal-light',
    resident: 'bg-ivory-200 text-navy-850 border-ivory-300'
  };

  const labels = {
    admin: 'Administrator',
    staff: 'Maintenance Staff',
    resident: 'Resident'
  };

  const style = styles[role] || 'bg-ivory-100 text-navy-800 border-ivory-300';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide border uppercase ${style}`}>
      {labels[role] || role}
    </span>
  );
};
