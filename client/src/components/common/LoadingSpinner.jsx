import React from 'react';

export default function LoadingSpinner({ message = 'Loading...', size = 'default' }) {
  const sizeClasses = {
    small: 'w-4 h-4 border-2',
    default: 'w-8 h-8 border-3',
    large: 'w-12 h-12 border-4'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div
        className={`${sizeClasses[size] || sizeClasses.default} border-navy-800/20 border-t-teal-accent rounded-full animate-spin mb-3`}
      />
      {message && (
        <p className="text-xs font-medium text-navy-800/70 tracking-wide uppercase">
          {message}
        </p>
      )}
    </div>
  );
}
