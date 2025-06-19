import React from 'react';
import Icon from './Icon';
import { formatDateTime } from '../lib/formatDate';

// --- Types ---
interface CheckItem {
  value: string | number | Record<string, any>;
  status: 'OK' | 'Warning' | 'Error';
}

interface ToolsData {
  spare_wheel?: boolean;
  straps?: number;
  ramp?: boolean;
  blankets?: number;
  trolley?: boolean;
}

interface VanCheckData {
  van_id: string;
  driver_id: string;
  date: string;
  tools?: ToolsData;
  parameters?: Record<string, any>;
  checks?: Partial<{
    mileage: CheckItem;
    tires: CheckItem;
    corners: CheckItem;
    coolant_level: CheckItem;
    fuel: CheckItem;
    check_engine: CheckItem;
    check_adblue: CheckItem;
    check_antifreeze: CheckItem;
    windshield: CheckItem;
    check_oil: CheckItem;
  }>;
}

interface Props {
  data: VanCheckData;
  contractor?: string;
}

// --- Style maps ---
const statusStyles = {
  OK: { 
    color: 'text-emerald-600 dark:text-emerald-400', 
    bgColor: 'bg-white dark:bg-gray-900',
    borderColor: 'border-emerald-400 dark:border-emerald-600',
    icon: 'check-circle' 
  },
  Warning: { 
    color: 'text-amber-600 dark:text-amber-400', 
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-400 dark:border-amber-600',
    icon: 'exclamation-triangle' 
  },
  Error: { 
    color: 'text-red-400 dark:text-red-300', // Paler red, similar to amber
    bgColor: 'bg-red-100 dark:bg-red-900/20', // Paler red background
    borderColor: 'border-red-400 dark:border-red-600',
    icon: 'exclamation-circle' 
  },
};

const iconMap: Record<string, string> = {
  Fuel: 'gas-pump',
  'Oil Level': 'oil-can',
  Antifreeze: 'snowflake',
  Coolant: 'temperature-low',
  AdBlue: 'vial',
  Corners: 'camera',
  'Check Engine': 'exclamation-triangle',
  Windshield: 'shield-alt', // Updated to a more intuitive icon
  Tires: 'car', // Added for Tires subsection
};

// --- Helpers ---
function parseStatus(val: any, field?: string): 'OK' | 'Warning' | 'Error' {
  const str = String(val).toLowerCase();
  if (field === 'antifreeze' && ['no', 'false', 'none'].includes(str)) return 'OK';
  if (['ok', 'true', 'yes', 'undamaged', 'good', 'normal'].includes(str)) return 'OK';
  if (['warning', 'warn', 'low'].includes(str)) return 'Warning';
  if (['error', 'bad', 'false', 'no', 'damaged'].includes(str)) return 'Error';
  return 'OK';
}

// --- Sub components ---
const StatusIndicator = ({ label, item }: { label: string; item: CheckItem }) => {
  const style = statusStyles[item.status] || statusStyles.OK;
  const labelIcon = iconMap[label] || 'question-circle';

  return (
    <div className="group relative">
      <div className={`
        flex flex-col items-center p-2 rounded-lg transition-all duration-200
        ${style.bgColor} ${style.borderColor} border
        hover:scale-105 hover:shadow-md cursor-pointer
      `}>
        <Icon name={labelIcon} className={`w-5 h-5 ${style.color} mb-1`} />
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center leading-tight">
          {label}
        </span>
      </div>
      <div className="
        absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
        px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-lg
        opacity-0 group-hover:opacity-100 transition-opacity duration-200
        pointer-events-none whitespace-nowrap z-10
      ">
        {`${label}: ${item.value}`}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );
};

const TireStatus = ({ item }: { item: CheckItem }) => {
  if (typeof item.value !== 'object' || item.value === null) return null;
  const tires = item.value as Record<string, string>;
  const positions: { key: string; label: string; position: string }[] = [
    { key: 'left_front', label: 'LF', position: 'top-0 left-0' },
    { key: 'right_front', label: 'RF', position: 'top-0 right-0' },
    { key: 'left_back', label: 'LB', position: 'bottom-0 left-0' },
    { key: 'right_back', label: 'RB', position: 'bottom-0 right-0' },
  ];

  return (
    <div className="flex flex-col items-center">
      <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
        <Icon name="car" className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        Tires
      </h4>
      <div className="relative w-20 h-24">
        <div className="absolute inset-x-2 inset-y-2 bg-gradient-to-b from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded-lg border border-gray-300 dark:border-gray-500"></div>
        {positions.map(({ key, label, position }) => {
          const status = parseStatus(tires[key]);
          const style = statusStyles[status];
          return (
            <div key={key} className={`absolute ${position} group`}>
              <div className={`
                w-6 h-6 rounded-full flex items-center justify-center
                text-sm font-bold transition-all duration-200
                ${style.bgColor} ${style.borderColor} ${style.color} border-2
                hover:scale-110 hover:shadow-md cursor-pointer
        `}>
                {label.charAt(0)}
              </div>
              <div className="
                absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
                px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-lg
                opacity-0 group-hover:opacity-100 transition-opacity duration-200
                pointer-events-none whitespace-nowrap z-10
              ">
                {`${label}: ${tires[key] || 'N/A'}`}
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
    <div className="flex items-center gap-2">
      <Icon name="gauge" className="w-5 h-5 text-gray-500 dark:text-gray-400" />
      <span className="font-mono text-sm bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 rounded-lg px-2.5 py-1 tracking-wider shadow-sm">
        {padded}
      </span>
    </div>
  );
};

const ToolGrid = ({ tools, tires }: { tools: ToolsData; tires: CheckItem }) => {
  const entries = Object.entries(tools).filter(([, v]) => v !== undefined);
  if (entries.length === 0 && !tires) return null;

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
      <h4 className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">Tools & Equipment</h4>
      <div className="flex flex-col gap-3 text-sm">
        {entries.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2 last:border-b-0">
            <span className="text-gray-700 dark:text-gray-300 capitalize font-medium">
              {k.replace(/_/g, ' ')}
            </span>
            {typeof v === 'boolean' ? (
              <Icon
                name={v ? 'check-circle' : 'x-circle'}
                className={`w-5 h-5 ${v ? 'text-emerald-500' : 'text-red-400'}`}
              />
            ) : (
              <span className="font-semibold text-gray-900 dark:text-gray-100 bg-gray-200 dark:bg-gray-700 rounded-full px-2.5 py-0.5">
                {v}
              </span>
            )}
          </div>
        ))}
        {tires && (
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <TireStatus item={tires} />
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main component ---
export default function VanCheck({ data, contractor }: Props) {
  if (!data) return null;

  const { van_id, driver_id } = data;
  const parameters = data.parameters || {};
  const tools = data.tools || {};

  const getParam = (names: string[]): any => {
    for (const name of names) {
      const key = Object.keys(parameters).find(
        k => k.toLowerCase() === name.toLowerCase()
      );
      if (key) return parameters[key];
    }
    return undefined;
  };

  const checks = data.checks || {
    mileage: { value: getParam(['miles', 'mileage']) || '0', status: 'OK' },
    tires: { value: parameters.tires || {}, status: 'OK' },
    corners: { value: parameters.corners, status: parseStatus(parameters.corners) },
    coolant_level: { value: parameters.coolant_level, status: parseStatus(parameters.coolant_level) },
    fuel: { value: parameters.fuel, status: parseStatus(parameters.fuel) },
    check_engine: { value: parameters.check_engine, status: parseStatus(parameters.check_engine) },
    check_adblue: { value: parameters.check_adblue, status: parseStatus(parameters.check_adblue) },
    check_antifreeze: { value: parameters.check_antifreeze, status: parseStatus(parameters.check_antifreeze, 'antifreeze') },
    windshield: { value: parameters.windshield, status: parseStatus(parameters.windshield) },
    check_oil: { value: parameters.check_oil, status: parseStatus(parameters.check_oil) },
  };

  const getItem = (item?: CheckItem): CheckItem => item || { value: 'N/A', status: 'OK' };

  const allChecks = Object.values(checks).map(check => getItem(check));
  const hasErrors = allChecks.some(check => check.status === 'Error');
  const hasWarnings = allChecks.some(check => check.status === 'Warning');
  const overallStatus = hasErrors ? 'Error' : hasWarnings ? 'Warning' : 'OK';
  const overallStyle = statusStyles[overallStatus];

  return (
    <div className={`
      bg-white dark:bg-gray-900 rounded-xl shadow-md transition-all duration-300 
      hover:shadow-lg border ${overallStyle.borderColor} w-full max-w-md mx-auto
    `}>
      {/* Header */}
      <div className={`
        ${overallStyle.bgColor} rounded-t-xl p-4 border-b ${overallStyle.borderColor}
      `}>
        <div className="flex justify-between items-center gap-4"> {/* Aligned items-center */}
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-mono font-bold text-gray-800 dark:text-gray-100 bg-gray-200 dark:bg-gray-700 rounded px-3 py-1 shadow-sm inline-flex items-center gap-2">
              <Icon name="truck" className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              {van_id}
            </h2>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Icon name="user" className="w-5 h-5" />
              <span>{driver_id}</span>
            </p>
            {contractor && (
              <p className="text-sm text-gray-500 dark:text-gray-500">{contractor}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <Odometer mileage={getItem(checks.mileage).value as string | number} />
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Icon name="calendar" className="w-5 h-5" />
              <span>{formatDateTime(data.date, { year: 'numeric', month: '2-digit', day: '2-digit' })}</span>
            </div>
            <div className={`
              flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold
              ${overallStyle.bgColor} ${overallStyle.color} border ${overallStyle.borderColor}
              ${overallStatus === 'Error' ? 'shadow-[0_0_8px_rgba(248,113,113,0.3)]' : ''}
            `}>
              <Icon name={overallStyle.icon} className="w-5 h-5" />
              <span>{overallStatus}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Tools and System Checks */}
        <div className="grid grid-cols-2 gap-4">
          {/* Tools & Tires */}
          {(Object.keys(tools).length > 0 || checks.tires) && (
            <ToolGrid tools={tools} tires={getItem(checks.tires)} />
          )}

          {/* System Checks */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
            <h4 className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">System Checks</h4>
            <div className="grid grid-cols-2 gap-3">
              <StatusIndicator label="Fuel" item={getItem(checks.fuel)} />
              <StatusIndicator label="Oil Level" item={getItem(checks.check_oil)} />
              <StatusIndicator label="Coolant" item={getItem(checks.coolant_level)} />
              <StatusIndicator label="AdBlue" item={getItem(checks.check_adblue)} />
              <StatusIndicator label="Antifreeze" item={getItem(checks.check_antifreeze)} />
              <StatusIndicator label="Check Engine" item={getItem(checks.check_engine)} />
              <StatusIndicator label="Windshield" item={getItem(checks.windshield)} />
              <StatusIndicator label="Corners" item={getItem(checks.corners)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
