import React from 'react';

interface TrackerTotalsCardProps {
  total: number;
  completed: number;
}

export function TrackerTotalsCard({ total, completed }: TrackerTotalsCardProps) {
  const remaining = Math.max(total - completed, 0);
  const progress = total > 0 ? Math.min(Math.round((completed / total) * 100), 100) : 0;

  return (
    <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
      <header className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Totals</h2>
        <span className="text-xs font-medium text-indigo-600">{progress}%</span>
      </header>

      <div className="mt-4 grid grid-cols-1 gap-4 text-sm text-gray-700 sm:grid-cols-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Completed</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">{completed}</p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Remaining</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">{remaining}</p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total Mountains</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">{total}</p>
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-indigo-600 transition-all"
          style={{ width: `${progress}%` }}
          aria-hidden
        />
        <span className="sr-only">{progress}% complete</span>
      </div>
    </section>
  );
}
