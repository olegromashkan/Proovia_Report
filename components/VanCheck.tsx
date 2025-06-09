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
    coolant_level?: CheckItem;
    fuel?: CheckItem;
    check_adblue?: CheckItem;
    check_antifreeze?: CheckItem;
  };
}

interface Props {
  data: VanCheckData;
  contractor?: string;
}

const statusMap = {
  OK: { color: 'text-success', icon: 'check-circle' },
  Warning: { color: 'text-warning', icon: 'exclamation-triangle' },
  Error: { color: 'text-error', icon: 'x-circle' },
};

const iconMap = {
  Mileage: 'truck',
  Tires: 'truck', // Replace with tire-specific icon if available
  Lights: 'light-bulb',
  'Oil Level': 'beaker',
  'Washer Fluid': 'droplet',
  'Body Damage': 'shield-exclamation',
  'Coolant Level': 'thermometer',
  Fuel: 'fuel-pump',
  'Check AdBlue': 'beaker',
  'Check Antifreeze': 'snowflake',
};

const CheckRow = ({ label, item }: { label: string; item: CheckItem }) => {
  const { color, icon: statusIcon } = statusMap[item.status] || { color: 'text-base-content', icon: 'question-mark-circle' };
  const labelIcon = iconMap[label as keyof typeof iconMap] || 'question-mark-circle';
  const hasDetails = typeof item.value === 'string' && item.value.toLowerCase() !== 'ok' && item.value.toLowerCase() !== 'no';

  return (
    <div className="flex justify-between items-center text-sm py-2 px-4 rounded-lg bg-base-100 transition-all hover:bg-base-200 hover:shadow-sm">
      <div className="flex items-center gap-3">
        <Icon name={labelIcon} className="w-5 h-5 text-base-content/60 transition-transform hover:scale-110" />
        <span className="text-base-content/80 font-medium">{label}</span>
      </div>
      <div className="tooltip tooltip-left" data-tip={`${label}${hasDetails ? `: ${item.value}` : ''}`}>
        <div className={`flex items-center gap-2 font-semibold ${color}`}>
          <span>{hasDetails ? item.status : String(item.value)}</span>
          <Icon name={statusIcon} className="w-5 h-5 transition-transform hover:scale-110" />
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
    coolant_level: parameters.coolant ? { value: parameters.coolant, status: parameters.coolant === 'normal' ? 'OK' : 'Warning' } : undefined,
    fuel: parameters.fuel ? { value: parameters.fuel, status: Number(parameters.fuel) > 25 ? 'OK' : 'Warning' } : undefined,
    check_adblue: parameters.adblue ? { value: parameters.adblue, status: parameters.adblue === 'normal' ? 'OK' : 'Warning' } : undefined,
    check_antifreeze: parameters.antifreeze ? { value: parameters.antifreeze, status: parameters.antifreeze === 'normal' ? 'OK' : 'Warning' } : undefined,
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
    <div className="card bg-base-200 shadow-lg transition-all duration-300 hover:shadow-xl max-w-3xl mx-auto">
      <figure className="p-6 bg-base-300">
        <div className="w-full max-w-md">
          <VanVisual statuses={visualStatuses} details={visualDetails} />
        </div>
      </figure>
      <div className="card-body p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="card-title text-primary text-xl font-bold">{van_id}</h2>
            <p className="text-sm text-base-content/60">{driver_id} ({contractor || 'N/A'})</p>
          </div>
          <div className="badge badge-outline bg-base-100 border-base-300 text-sm font-medium">
            {new Date(data.date).toLocaleDateString()}
          </div>
        </div>
        <div className="divider my-2 bg-gradient-to-r from-transparent via-base-300 to-transparent h-px"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <CheckRow label="Mileage" item={{ value: getItem(checks.mileage).value, status: 'OK' }} />
          <CheckRow label="Tires" item={getItem(checks.tires)} />
          <CheckRow label="Lights" item={getItem(checks.lights)} />
          <CheckRow label="Oil Level" item={getItem(checks.oil)} />
          <CheckRow label="Washer Fluid" item={getItem(checks.washer_fluid)} />
          <CheckRow label="Body Damage" item={getItem(checks.damage)} />
          <CheckRow label="Coolant Level" item={getItem(checks.coolant_level)} />
          <CheckRow label="Fuel" item={getItem(checks.fuel)} />
          <CheckRow label="Check AdBlue" item={getItem(checks.check_adblue)} />
          <CheckRow label="Check Antifreeze" item={getItem(checks.check_antifreeze)} />
          {Object.entries(parameters).map(([k, v]) => {
            if (['miles', 'tires', 'check_engine', 'check_oil', 'corners', 'windshield', 'coolant', 'fuel', 'adblue', 'antifreeze'].includes(k)) return null;
            return <CheckRow key={k} label={k.replace(/_/g, ' ')} item={{ value: String(v), status: 'OK' }} />;
          })}
        </div>
      </div>
    </div>
  );
};