import React, { useEffect, useState } from 'react';
import { Outlet, Link } from 'react-router-dom';

export default function HRHub() {
  const [healthStatus, setHealthStatus] = useState<string>('Checking backend status...');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/v1/hr/health');
        if (response.ok) {
          const data = await response.json();
          setHealthStatus(`Backend Status: ${data.status} (Workspace: ${data.workspace})`);
        } else {
          setHealthStatus('Backend health check failed (non-2xx response).');
        }
      } catch (error) {
        setHealthStatus(`Backend health check error: ${error.message}`);
      }
    };
    checkHealth();
  }, []);

  return (
    <div className="flex h-full w-full">
      {/* Sidebar Navigation Placeholder */}
      <aside className="w-64 border-r border-gray-200 bg-gray-50 flex flex-col p-4">
        <h2 className="text-xl font-bold mb-6 text-gray-800">HR Department</h2>
        <nav className="flex flex-col gap-2">
          <Link to="/workspace/hr/employees" className="p-2 text-gray-700 hover:bg-gray-200 rounded transition-colors">
            Employees
          </Link>
          <Link to="/workspace/hr/payroll" className="p-2 text-gray-700 hover:bg-gray-200 rounded transition-colors">
            Payroll Manager
          </Link>
          <Link to="/workspace/hr/recruitment" className="p-2 text-gray-700 hover:bg-gray-200 rounded transition-colors">
            Recruitment
          </Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 bg-white flex flex-col overflow-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900">Welcome to the HR Department</h1>
          <div className="mt-4 text-sm font-mono text-gray-600 bg-gray-100 p-3 rounded border border-gray-200 inline-block">
            {healthStatus}
          </div>
        </header>

        {/* Outlet for nested department apps (Employees, Payroll, etc.) */}
        <div className="flex-1 border-2 border-dashed border-gray-200 rounded-lg p-6 bg-gray-50 flex flex-col">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
