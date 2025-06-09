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
  checks?: Partial<{ // Используем Partial для большей гибкости
    mileage: CheckItem;
    tires: CheckItem;
    oil: CheckItem;
    lights: CheckItem;
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

const statusMap = {
  OK: { color: 'text-success', icon: 'check-circle' },
  Warning: { color: 'text-warning', icon: 'exclamation-triangle' },
  Error: { color: 'text-error', icon: 'x-circle' },
};

const iconMap: Record<string, string> = {
  Mileage: 'truck',
  Tires: 'record-circle',
  Lights: 'lightbulb',
  'Oil Level': 'droplet-half',
  'Washer Fluid': 'droplet',
  'Body Damage': 'shield-exclamation',
  'Coolant Level': 'thermometer-half',
  Fuel: 'fuel-pump',
  'Check AdBlue': 'beaker',
  'Check Antifreeze': 'snow',
};

function parseStatus(val: any): 'OK' | 'Warning' | 'Error' {
  const str = String(val).toLowerCase();
  if (['ok', 'true', 'yes', 'undamaged', 'good', 'normal'].includes(str)) return 'OK';
  if (['warning', 'warn', 'low'].includes(str)) return 'Warning';
  if (['error', 'bad', 'false', 'no', 'damaged'].includes(str)) return 'Error';
  return 'OK'; // По умолчанию считаем, что все в порядке
}

const CheckRow = ({ label, item }: { label: string; item: CheckItem }) => {
  const { color, icon: statusIcon } = statusMap[item.status] || { color: 'text-base-content', icon: 'question-circle' };
  const labelIcon = iconMap[label] || 'question-circle';
  const hasDetails = typeof item.value === 'string' && !['ok', 'no', 'yes', 'good', 'undamaged', 'normal'].includes(item.value.toLowerCase());

  return (
    <div className="flex justify-between items-center text-sm py-2 px-3 rounded-lg bg-base-100 transition-all hover:bg-base-200 hover:shadow-inner">
      <div className="flex items-center gap-3">
        <Icon name={labelIcon} className="w-5 h-5 text-primary/70" />
        <span className="text-base-content/80 font-medium">{label}</span>
      </div>
      <div className="tooltip tooltip-left" data-tip={`${label}: ${item.value}`}>
        <div className={`flex items-center gap-2 font-semibold ${color}`}>
          <span>{hasDetails ? item.status : String(item.value)}</span>
          <Icon name={statusIcon} className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

const TiresRow = ({ item }: { item: CheckItem }) => {
  if (typeof item.value !== 'object' || item.value === null) return null;
  const tires = item.value as Record<string, string>;
  const positions: [string, string][] = [['FL', 'front_left'], ['FR', 'front_right'], ['RL', 'rear_left'], ['RR', 'rear_right']];
  
  return (
    <div className="md:col-span-2 flex justify-between items-center text-sm py-2 px-3 rounded-lg bg-base-100 hover:bg-base-200 hover:shadow-inner">
      <div className="flex items-center gap-3"><Icon name={iconMap['Tires']} className="w-5 h-5 text-primary/70" /><span className="text-base-content/80 font-medium">Tires</span></div>
      <div className="flex gap-4">{positions.map(([short, key]) => (<div key={key} className="text-center text-xs"><div className={`font-semibold ${statusMap[parseStatus(tires[key])].color}`}>{tires[key] ?? '-'}</div><div className="text-base-content/60">{short}</div></div>))}</div>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div><h3 className="font-semibold text-base-content/70 mb-2 px-1">{title}</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-2">{children}</div></div>
);

export default function VanCheck({ data, contractor }: Props) {
  if (!data) return null; // Защита от отсутствия данных
  
  const { van_id, driver_id } = data;
  const parameters = data.parameters || {};
  
  // Нормализация данных: если нет объекта `checks`, создаем его из `parameters`
  const checks = data.checks || {
    mileage: { value: parameters.miles || 'N/A', status: 'OK' },
    tires: { value: parameters.tires || {}, status: parseStatus(parameters.tires?.status) },
    lights: { value: String(parameters.check_engine), status: parseStatus(parameters.check_engine) },
    oil: { value: String(parameters.check_oil), status: parseStatus(parameters.check_oil) },
    damage: { value: parameters.corners || 'N/A', status: parseStatus(parameters.corners) },
    washer_fluid: { value: parameters.windshield || 'N/A', status: parseStatus(parameters.windshield) },
    coolant_level: { value: parameters.coolant || 'N/A', status: parseStatus(parameters.coolant) },
    fuel: { value: parameters.fuel || 'N/A', status: Number(parameters.fuel) > 25 ? 'OK' : 'Warning' },
    check_adblue: { value: parameters.adblue || 'N/A', status: parseStatus(parameters.adblue) },
    check_antifreeze: { value: parameters.antifreeze || 'N/A', status: parseStatus(parameters.antifreeze) },
  };

  const getItem = (item?: CheckItem): CheckItem => item || { value: 'N/A', status: 'OK' };

  const tiresValue = getItem(checks.tires).value;
  const visualTireStatus = typeof tiresValue === 'object' 
    ? Object.values(tiresValue).some(v => parseStatus(v) !== 'OK') ? 'Warning' : 'OK'
    : getItem(checks.tires).status;

  const visualStatuses = {
    tires: visualTireStatus,
    lights: getItem(checks.lights).status,
    oil: getItem(checks.oil).status,
    damage: getItem(checks.damage).status,
  };
  
  const visualDetails = {
      tires: typeof tiresValue === 'object' ? Object.entries(tiresValue).map(([k,v]) => `${k}: ${v}`).join(', ') : String(tiresValue),
      lights: `Lights: ${getItem(checks.lights).value}`,
      oil: `Oil: ${getItem(checks.oil).value}`,
      damage: `Damage: ${getItem(checks.damage).value}`,
  };

  return (
    <div className="card bg-base-200 shadow-lg transition-all duration-300 hover:shadow-xl w-full">
      <figure className="p-4 bg-base-300/40"><div className="w-full max-w-sm"><VanVisual statuses={visualStatuses} details={visualDetails} /></div></figure>
      <div className="card-body p-4 sm:p-6">
        <div className="flex justify-between items-start">
          <div><h2 className="card-title text-primary text-xl font-bold">{van_id}</h2><p className="text-sm text-base-content/60">{driver_id} ({contractor || 'N/A'})</p></div>
          <div className="badge badge-outline bg-base-100 border-base-300 text-sm font-medium">{new Date(data.date).toLocaleDateString()}</div>
        </div>
        <div className="divider my-2"></div>
        <div className="space-y-4">
          <Section title="General">
            <CheckRow label="Mileage" item={{ value: getItem(checks.mileage).value, status: 'OK' }} />
            <CheckRow label="Fuel" item={getItem(checks.fuel)} />
            <TiresRow item={getItem(checks.tires)} />
            <CheckRow label="Lights" item={getItem(checks.lights)} />
            <CheckRow label="Body Damage" item={getItem(checks.damage)} />
          </Section>
          <Section title="Fluids">
            <CheckRow label="Oil Level" item={getItem(checks.oil)} />
            <CheckRow label="Washer Fluid" item={getItem(checks.washer_fluid)} />
            <CheckRow label="Coolant Level" item={getItem(checks.coolant_level)} />
            <CheckRow label="Check AdBlue" item={getItem(checks.check_adblue)} />
            <CheckRow label="Check Antifreeze" item={getItem(checks.check_antifreeze)} />
          </Section>
        </div>
      </div>
    </div>
  );
};