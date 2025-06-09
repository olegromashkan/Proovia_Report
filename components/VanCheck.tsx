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
  const parameters: any = (data as any).parameters || {};
  const checks = data.checks || {
    mileage: parameters.miles ? { value: parameters.miles, status: 'OK' } : undefined,
    tires: parameters.tires ? { value: Object.values(parameters.tires).join(' / '), status: 'OK' } : undefined,
    lights: parameters.check_engine !== undefined ? { value: parameters.check_engine, status: parameters.check_engine === 'true' ? 'OK' : 'Error' } : undefined,
    oil: parameters.check_oil !== undefined ? { value: parameters.check_oil, status: parameters.check_oil === 'true' ? 'OK' : 'Error' } : undefined,
    damage: parameters.corners ? { value: parameters.corners, status: parameters.corners === 'undamaged' ? 'OK' : 'Warning' } : undefined,
    washer_fluid: parameters.windshield ? { value: parameters.windshield, status: parameters.windshield === 'undamaged' ? 'OK' : 'Warning' } : undefined,
  };

  const getItem = (item?: CheckItem): CheckItem =>
    item || { value: 'N/A', status: 'OK' };

  const visualStatuses = {
    tires: getItem(checks.tires).status,
    lights: getItem(checks.lights).status,
    oil: getItem(checks.oil).status,
    damage: getItem(checks.damage).status,
  };

  const visualDetails = {
    tires: String(getItem(checks.tires).value),
    lights: String(getItem(checks.lights).value),
    oil: String(getItem(checks.oil).value),
    damage: String(getItem(checks.damage).value),
  };

  return (
    <div className="card bg-base-200 shadow-md transition-all duration-300 hover:shadow-xl w-full">
      <figure className="p-4 bg-base-300/50 w-full flex justify-center">
        <div className="w-72">
          <VanVisual statuses={visualStatuses} details={visualDetails} />
        </div>
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
            {Object.entries(parameters).map(([k, v]) => {
              if (['miles','tires','check_engine','check_oil','corners','windshield'].includes(k)) return null;
              return <CheckRow key={k} label={k.replace(/_/g,' ')} item={{ value: String(v), status: 'OK' }} />;
            })}
        </div>
      </div>
    </div>
  );
}
