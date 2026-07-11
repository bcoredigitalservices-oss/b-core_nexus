import React from 'react';
import UniversalDataGrid from '../../components/ui/UniversalDataGrid';

export default function PayrollManagerView() {
  return (
    <div className="flex-1 flex flex-col h-full w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Payroll Manager</h2>
        <button className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors shadow-sm">
          Create New
        </button>
      </div>
      
      <div className="flex-1 min-h-[400px] bg-white rounded-lg shadow border border-gray-200 p-4">
        <UniversalDataGrid 
          endpointUrl="/api/v1/hr/payroll" 
          title="Payroll Records"
          columns={[
            { key: 'id', label: 'Record ID', sortable: true },
            { key: 'created_at', label: 'Created Date', sortable: true },
            { key: 'status', label: 'Status' }
          ]} 
        />
      </div>
    </div>
  );
}
