import React from 'react';

type Data = Record<string, any>;

const HIDDEN_PATTERNS = [
  'Is_Locked',
  'Route',
  'Drivers',
  'Checksum',
  'OptimoId',
  'isLast',
  'Order_Link',
  'Trip',
  'Address1',
  'Tasks_Ref',
  'Current_Location',
  'Driver_Total',
  'Warehouse_Locations',
  'Longitude',
  'is_Geocoded',
  'Latitude',
  'ID',
];

function categorize(data: Data) {
  const categories: Record<string, [string, any][]> = {};
  for (const [key, value] of Object.entries(data)) {
    if (HIDDEN_PATTERNS.some((p) => key.includes(p))) continue;
    const parts = key.split('.');
    const group = parts.length > 1 ? parts[0] : 'General';
    const label = parts.length > 1 ? parts.slice(1).join('.') : parts[0];
    if (!categories[group]) categories[group] = [];
    categories[group].push([label, value]);
  }
  return categories;
}

export default function OrderView({ data }: { data: Data }) {
  const categories = categorize(data);
  return (
    <div className="space-y-4">
      {Object.keys(categories).map((cat) => (
        <div key={cat} className="border rounded">
          <h2 className="font-semibold bg-gray-100 p-2">{cat}</h2>
          <div className="table-responsive">
            <table className="w-full text-sm">
            <tbody>
              {categories[cat].map(([k, v]) => (
                <tr key={k} className="odd:bg-gray-50">
                  <td className="border px-2 py-1 font-mono whitespace-nowrap">
                    {k}
                  </td>
                  <td className="border px-2 py-1 break-all">
                    {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
