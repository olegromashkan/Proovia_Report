import React from 'react';
import Icon from './Icon';
import VanVisual from './VanVisual';

interface CheckItem {
  value: string | number | Record<string, any>;
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

function parseStatus(val: any): 'OK' | 'Warning' | 'Error' {
  const str = String(val).toLowerCase();
  if (['ok', 'true', 'yes', 'undamaged', 'good'].includes(str)) return 'OK';
  if (['warning', 'warn', 'medium'].includes(str)) return 'Warning';
  if (['error', 'bad', 'false', 'no', 'damaged'].includes(str)) return 'Error';
  return 'OK';
}

function normalizeTires(value: any): Record<string, any> | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const v = value as Record<string, any>;
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      if (v[k] !== undefined) return v[k];
    }
    return undefined;
  };
  return {
    front_left: pick('front_left', 'left_front'),
    front_right: pick('front_right', 'right_front'),
    rear_left: pick('rear_left', 'left_rear', 'left_back'),
    rear_right: pick('rear_right', 'right_rear', 'right_back'),
  };
}

const TiresRow = ({ item }: { item: CheckItem }) => {
  const tires = normalizeTires(item.value) || {};
  const positions: [string, string][] = [
    ['FL', 'front_left'],
    ['FR', 'front_right'],
    ['RL', 'rear_left'],
    ['RR', 'rear_right'],
  ];
  return (
    <div className="col-span-full flex justify-between items-center text-sm py-2 px-4 rounded-lg bg-base-100 transition-all hover:bg-base-200 hover:shadow-sm">
      <div className="flex items-center gap-3">
        <Icon name={iconMap['Tires']} className="w-5 h-5 text-base-content/60" />
        <span className="text-base-content/80 font-medium">Tires</span>
      </div>
      <div className="flex gap-4">
        {positions.map(([short, key]) => (
          <div key={key} className="text-center text-xs">
            <div className="font-semibold">{tires[key] ?? '-'}</div>
            <div className="text-base-content/60">{short}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-4">
    <h3 className="font-semibold text-base-content/70 mb-1">{title}</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>
  </div>
);

export default function VanCheck({ data, contractor }: Props) {
  const { van_id, driver_id } = data;
  const parameters: any = (data as any).parameters || {};
  const checks = data.checks || {
    mileage: parameters.miles ? { value: parameters.miles, status: 'OK' } : undefined,
    tires: parameters.tires ? { value: parameters.tires, status: 'OK' } : undefined,
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

  const parseStatus = (val: any): 'OK' | 'Warning' | 'Error' => {
    const str = String(val).toLowerCase();
    if (['ok', 'true', 'yes', 'undamaged', 'good'].includes(str)) return 'OK';
    if (['warning', 'warn'].includes(str)) return 'Warning';
    if (['error', 'bad', 'false', 'no', 'damaged'].includes(str)) return 'Error';
    return 'OK';
  };

  const tiresValue = getItem(checks.tires).value;
  const normalizedTires = normalizeTires(tiresValue);
  const visualTireStatuses =
    normalizedTires
      ? {
          front_left: parseStatus(normalizedTires.front_left),
          front_right: parseStatus(normalizedTires.front_right),
          rear_left: parseStatus(normalizedTires.rear_left),
          rear_right: parseStatus(normalizedTires.rear_right),
        }
      : getItem(checks.tires).status;

  const visualStatuses = {
    tires: visualTireStatuses,
    lights: getItem(checks.lights).status,
    oil: getItem(checks.oil).status,
    damage: getItem(checks.damage).status,
  };

  const visualDetails = {
    tires: normalizedTires || tiresValue,
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
        <div className="flex flex-wrap justify-center gap-4 my-2">
          <div className="tooltip" data-tip={`Lights: ${getItem(checks.lights).value}`}>
            <Icon name={iconMap['Lights']} className={`w-6 h-6 ${statusMap[getItem(checks.lights).status].color}`} />
          </div>
          <div className="tooltip" data-tip={`Fuel: ${getItem(checks.fuel).value}`}>
            <Icon name={iconMap['Fuel']} className={`w-6 h-6 ${statusMap[getItem(checks.fuel).status].color}`} />
          </div>
          <div className="tooltip" data-tip={`Oil Level: ${getItem(checks.oil).value}`}>
            <Icon name={iconMap['Oil Level']} className={`w-6 h-6 ${statusMap[getItem(checks.oil).status].color}`} />
          </div>
          <div className="tooltip" data-tip={`Washer Fluid: ${getItem(checks.washer_fluid).value}`}>
            <Icon name={iconMap['Washer Fluid']} className={`w-6 h-6 ${statusMap[getItem(checks.washer_fluid).status].color}`} />
          </div>
          <div className="tooltip" data-tip={`Coolant Level: ${getItem(checks.coolant_level).value}`}>
            <Icon name={iconMap['Coolant Level']} className={`w-6 h-6 ${statusMap[getItem(checks.coolant_level).status].color}`} />
          </div>
          <div className="tooltip" data-tip={`Body Damage: ${getItem(checks.damage).value}`}>
            <Icon name={iconMap['Body Damage']} className={`w-6 h-6 ${statusMap[getItem(checks.damage).status].color}`} />
          </div>
          <div className="tooltip" data-tip={`AdBlue: ${getItem(checks.check_adblue).value}`}>
            <Icon name={iconMap['Check AdBlue']} className={`w-6 h-6 ${statusMap[getItem(checks.check_adblue).status].color}`} />
          </div>
          <div className="tooltip" data-tip={`Antifreeze: ${getItem(checks.check_antifreeze).value}`}>
            <Icon name={iconMap['Check Antifreeze']} className={`w-6 h-6 ${statusMap[getItem(checks.check_antifreeze).status].color}`} />
          </div>
          <TiresRow item={getItem(checks.tires)} />
        </div>
      </div>
    </div>
  );
};