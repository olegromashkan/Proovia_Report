import React from 'react';
import Icon from './Icon';

// --- Types ---
interface CheckItem {
  value: string | number | Record<string, any>;
  status: 'OK' | 'Warning' | 'Error';
}

interface VanCheckData {
  van_id: string;
  driver_id: string;
  date: string;
  checks?: Partial<{
    mileage: CheckItem;
    tires: CheckItem;
    lights: CheckItem;
    oil: CheckItem;
    damage: CheckItem;
    washer_fluid: CheckItem;
    coolant_level: CheckItem;
    fuel: CheckItem;
    check_adblue: CheckItem;
    check_antifreeze: CheckItem;
  }>;
  parameters?: Record<string, any>;
}

interface Props {
  data: VanCheckData;
  contractor?: string;
}

// --- Style maps ---
const statusStyles = {
  OK: { color: 'text-success', icon: 'check-circle' },
  Warning: { color: 'text-warning', icon: 'exclamation-triangle' },
  Error: { color: 'text-error', icon: 'x-circle' },
};

const iconMap: Record<string, string> = {
  Lights: 'brightness-high',
  Fuel: 'fuel-pump',
  'Oil Level': 'droplet-half',
  Antifreeze: 'snow',
  Coolant: 'thermometer-half',
  AdBlue: 'beaker',
  'Washer Fluid': 'droplet-fill',
  'Body Damage': 'shield-exclamation',
};

// --- Helpers ---
function parseStatus(val: any): 'OK' | 'Warning' | 'Error' {
  const str = String(val).toLowerCase();
  if (['ok', 'true', 'yes', 'undamaged', 'good', 'normal'].includes(str)) return 'OK';
  if (['warning', 'warn', 'low'].includes(str)) return 'Warning';
  if (['error', 'bad', 'false', 'no', 'damaged'].includes(str)) return 'Error';
  return 'OK';
}

// --- Sub components ---
const StatusIndicator = ({ label, item }: { label: string; item: CheckItem }) => {
  const { color, icon: statusIcon } = statusStyles[item.status] || { color: 'text-base-content', icon: 'question-circle' };
  const labelIcon = iconMap[label] || 'question-circle';

  return (
    <div className="tooltip" data-tip={`${label}: ${item.value}`}> 
      <Icon name={labelIcon} className={`w-8 h-8 transition-all duration-300 hover:scale-110 ${color}`} />
    </div>
  );
};

const TireStatus = ({ item }: { item: CheckItem }) => {
  if (typeof item.value !== 'object' || item.value === null) return null;
  const tires = item.value as Record<string, string>;
  const positions = [
    { key: 'front_left', label: 'FL', gridClass: 'col-start-1 row-start-1' },
    { key: 'front_right', label: 'FR', gridClass: 'col-start-2 row-start-1' },
    { key: 'rear_left', label: 'RL', gridClass: 'col-start-1 row-start-2' },
    { key: 'rear_right', label: 'RR', gridClass: 'col-start-2 row-start-2' },
  ];

  return (
    <div className="relative w-24 h-32">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-24 bg-base-100 rounded-md border-2 border-base-300"></div>
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-2 items-center">
        {positions.map(({ key, label, gridClass }) => {
          const status = parseStatus(tires[key]);
          const { color } = statusStyles[status];
          return (
            <div key={key} className={`tooltip z-10 ${gridClass}`} data-tip={`${label}: ${tires[key] || 'N/A'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all ${color.replace('text-', 'border-')} ${color.replace('text-', 'bg-')}/20`}>
                {label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Odometer = ({ mileage }: { mileage: string | number }) => {
  const padded = String(mileage).padStart(6, '0');
  return (
    <div className="mt-2 font-mono text-lg bg-neutral text-neutral-content rounded-md px-2 py-0.5 inline-block tracking-widest">
      {padded}
    </div>
  );
};

// --- Main component ---
export default function VanCheck({ data, contractor }: Props) {
  if (!data) return null;

  const { van_id, driver_id } = data;
  const parameters = data.parameters || {};

  const checks = data.checks || {
    mileage: { value: parameters.miles || '0', status: 'OK' },
    tires: { value: parameters.tires || {}, status: 'OK' },
    lights: { value: String(parameters.lights_ok), status: parseStatus(parameters.lights_ok) },
    oil: { value: String(parameters.oil_ok), status: parseStatus(parameters.oil_ok) },
    damage: { value: parameters.body_damage || 'OK', status: parseStatus(parameters.body_damage) },
    washer_fluid: { value: String(parameters.washer_fluid_ok), status: parseStatus(parameters.washer_fluid_ok) },
    coolant_level: { value: String(parameters.coolant_ok), status: parseStatus(parameters.coolant_ok) },
    fuel: { value: parameters.fuel || 'N/A', status: Number(parameters.fuel) > 25 ? 'OK' : 'Warning' },
    check_adblue: { value: String(parameters.adblue_ok), status: parseStatus(parameters.adblue_ok) },
    check_antifreeze: { value: String(parameters.antifreeze_ok), status: parseStatus(parameters.antifreeze_ok) },
  };

  const getItem = (item?: CheckItem): CheckItem => item || { value: 'N/A', status: 'OK' };

  return (
    <div className="card bg-base-200 shadow-lg transition-all duration-300 hover:shadow-xl w-full">
      <div className="card-body p-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="card-title text-primary text-xl font-bold">{van_id}</h2>
            <p className="text-sm text-base-content/60">{driver_id} ({contractor || 'N/A'})</p>
          </div>
          <div className="text-right">
            <div className="badge badge-outline bg-base-100 border-base-300 font-medium">
              {new Date(data.date).toLocaleDateString()}
            </div>
            <Odometer mileage={getItem(checks.mileage).value} />
          </div>
        </div>

        <div className="divider my-2"></div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="grid grid-cols-3 gap-y-4 gap-x-2 place-items-center">
            <StatusIndicator label="Lights" item={getItem(checks.lights)} />
            <StatusIndicator label="Fuel" item={getItem(checks.fuel)} />
            <StatusIndicator label="Oil Level" item={getItem(checks.oil)} />
            <StatusIndicator label="Antifreeze" item={getItem(checks.check_antifreeze)} />
            <StatusIndicator label="Coolant" item={getItem(checks.coolant_level)} />
            <StatusIndicator label="AdBlue" item={getItem(checks.check_adblue)} />
            <StatusIndicator label="Washer Fluid" item={getItem(checks.washer_fluid)} />
            <StatusIndicator label="Body Damage" item={getItem(checks.damage)} />
          </div>

          <div className="flex items-center justify-center border-l-2 border-base-300/50 pl-4">
            <TireStatus item={getItem(checks.tires)} />
          </div>
        </div>
      </div>
    </div>
  );
}
