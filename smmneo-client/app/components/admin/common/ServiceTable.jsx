import React, { memo, useCallback } from 'react';

const ServiceRow = memo(({ service, onEdit, onDelete }) => {
  const serviceId = service.service || service._id;

  return (
    <tr className="hover:bg-violet-50 transition border-b border-slate-200">
      <td className="px-6 py-4 text-sm font-semibold text-slate-900">{serviceId}</td>
      <td className="px-6 py-4 text-sm font-medium text-slate-700">{service.name}</td>
      <td className="px-6 py-4 text-sm text-slate-700">
        <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold">
          {service.type || 'N/A'}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-slate-700">
        <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-lg text-xs font-semibold">
          {service.category}
        </span>
      </td>
      <td className="px-6 py-4 text-sm font-bold text-slate-900">${service.rate?.toFixed(2) || '0.00'}</td>
      <td className="px-6 py-4 text-sm text-slate-600 font-medium">{service.min || 0}</td>
      <td className="px-6 py-4 text-sm text-slate-600 font-medium">{service.max || 0}</td>
      <td className="px-6 py-4 text-center">
        {service.refill ? (
          <span className="inline-block px-2.5 py-1 rounded-lg bg-green-100 text-green-700 text-xs font-bold">
            ✓ Yes
          </span>
        ) : (
          <span className="inline-block px-2.5 py-1 rounded-lg bg-red-100 text-red-700 text-xs font-bold">
            ✗ No
          </span>
        )}
      </td>
      <td className="px-6 py-4 text-center">
        {service.cancel ? (
          <span className="inline-block px-2.5 py-1 rounded-lg bg-green-100 text-green-700 text-xs font-bold">
            ✓ Yes
          </span>
        ) : (
          <span className="inline-block px-2.5 py-1 rounded-lg bg-red-100 text-red-700 text-xs font-bold">
            ✗ No
          </span>
        )}
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(service)}
            className="px-3 py-1.5 text-xs font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-lg transition active:scale-95"
          >
            ✏️ Edit
          </button>
          <button
            onClick={() => onDelete(service._id || serviceId)}
            className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition active:scale-95"
          >
            🗑️ Delete
          </button>
        </div>
      </td>
    </tr>
  );
});

ServiceRow.displayName = 'ServiceRow';

const ServiceTable = memo(({ services, loading, onEdit, onDelete }) => {
  return (
    <>
      {services.length === 0 && !loading && (
        <div className="p-12 text-center bg-gradient-to-br from-slate-50 to-white rounded-lg">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-lg font-bold text-slate-900 mb-2">No Services Found</p>
          <p className="text-slate-600">Try adjusting your filters or search terms</p>
        </div>
      )}

      {services.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-slate-100 to-slate-50 border-b-2 border-slate-300">
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-900 uppercase tracking-wider">ID</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-900 uppercase tracking-wider">Service Name</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-900 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-900 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-900 uppercase tracking-wider">Rate</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-900 uppercase tracking-wider">Min</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-900 uppercase tracking-wider">Max</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-900 uppercase tracking-wider">Refill</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-900 uppercase tracking-wider">Cancel</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-900 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {services.map((service, idx) => (
                <ServiceRow
                  key={service._id || service.service}
                  service={service}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
});

ServiceTable.displayName = 'ServiceTable';

export default ServiceTable;

