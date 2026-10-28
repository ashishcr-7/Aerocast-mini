import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';
import { useStation } from '../context/StationContext';
import { AlertCircle } from 'lucide-react';

export const Layout: React.FC = () => {
  const { error, refresh, isRefreshing } = useStation();

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex font-sans antialiased">
      {/* Left Sticky Sidebar */}
      <Sidebar />

      {/* Main Content Area with generous breathing room */}
      <div className="flex-1 flex flex-col min-w-0 px-8 lg:px-12 py-8 overflow-y-auto">
        <div className="max-w-6xl w-full mx-auto space-y-8">
          <TopHeader />

          {/* Global Error Alert */}
          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={refresh}
                disabled={isRefreshing}
                className="font-bold underline hover:text-rose-900 cursor-pointer text-xs"
              >
                Retry
              </button>
            </div>
          )}

          <Outlet />
        </div>
      </div>
    </div>
  );
};
