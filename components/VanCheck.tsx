// components/VanCheck.tsx
import React from 'react';
import Icon from './Icon';
import VanVisual from './VanVisual';

interface CheckItem {
  value: string | number;
  status: 'OK' | 'Warning' | 'Error';
}

interface VanCheckData {
  van_id: string;
  driver_id: string;
  date: string;
  checks?: {
    mileage?: CheckItem;
    tires?: CheckItem;
    oil?: CheckItem;
    lights?: CheckItem;
    damage?: CheckItem;
    washer_fluid?: CheckItem;
  };
}

interface Props {
  data: VanCheckData;
  contractor?: string;
}

const statusMap = {
  OK: { color: 'text-success', icon: 'check' },
  Warning: { color: 'text-warning', icon: 'clock' },
  Error: { color: 'text-error', icon: 'ban' },
};

const CheckRow = ({ label, item }: { label: string; item: CheckItem }) => {
  const { color, icon } = statusMap[item.status] || { color: 'text-base-content', icon: 'up-right-from-square' };
  const hasDetails = typeof item.value === 'string' && item.value.toLowerCase() !== 'ok' && item.value.toLowerCase() !== 'no';

  return (
    <div className={`flex justify-between items-center text-sm py-1.5 border-b border-base-100 ${hasDetails ? 'items-start' : ''}`}>
      <span className="text-base-content/80">{label}</span>
      <div className="tooltip tooltip-left" data-tip={hasDetails ? item.value : label}>
        <div className={`flex items-center gap-2 font-semibold ${color}`}>
            <span>{hasDetails ? item.status : String(item.value)}</span>
            <Icon name={icon} />
        </div>
      </div>
    </div>
  );
};

export default function VanCheck({ data, contractor }: Props) {
  const { van_id, driver_id } = data;
  const checks = data.checks || {};

  const getItem = (item?: CheckItem): CheckItem =>
    item || { value: 'N/A', status: 'OK' };

  const visualStatuses = {
    tires: getItem(checks.tires).status,
    lights: getItem(checks.lights).status,
    oil: getItem(checks.oil).status,
    damage: getItem(checks.damage).status,
  };

  return (
    <div className="card card-side bg-base-200 shadow-md transition-all duration-300 hover:shadow-xl">
        <figure className="p-4 w-2/5 bg-base-300/50">
            <VanVisual statuses={visualStatuses} />
        </figure>
      <div className="card-body p-4">
        <div className="flex justify-between items-start">
            <div>
                 <h2 className="card-title text-primary">{van_id}</h2>
                 <p className="text-xs text-base-content/60">{driver_id} ({contractor || 'N/A'})</p>
            </div>
            <div className="badge badge-outline">{new Date(data.date).toLocaleDateString()}</div>
        </div>
        <div className="divider my-1"></div>
        <div className="space-y-1">
            <CheckRow label="Mileage" item={{ value: getItem(checks.mileage).value, status: 'OK' }} />
            <CheckRow label="Tires" item={getItem(checks.tires)} />
            <CheckRow label="Lights" item={getItem(checks.lights)} />
            <CheckRow label="Oil Level" item={getItem(checks.oil)} />
            <CheckRow label="Washer Fluid" item={getItem(checks.washer_fluid)} />
            <CheckRow label="Body Damage" item={getItem(checks.damage)} />
        </div>
      </div>
    </div>
  );
}
