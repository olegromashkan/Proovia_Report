import React from 'react';

interface Props {
  data: any;
  contractor?: string;
}

function iconize(val: any): string {
  const s = String(val).toLowerCase();
  if (val === true || s === 'true' || s === 'good' || s === 'undamaged') return '✅';
  if (val === false || s === 'false' || s === 'low' || s === 'damaged') return '❌';
  if (s === 'medium') return '⚠️';
  return '⚠️';
}

const Item = ({ label, value }: { label: string; value: any }) => (
  <div className="flex flex-col items-center" title={String(value)}>
    <span className="text-lg">{iconize(value)}</span>
    <span className="text-xs">{label}</span>
  </div>
);

export default function VanCheck({ data, contractor }: Props) {
  if (!data) return null;
  const { van_id, driver_id, tools = {}, parameters = {}, date } = data;
  const tires = parameters.tires || {};

  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body p-3 space-y-3 text-sm">
        <div>
          <h3 className="font-bold">
            {driver_id}
            {contractor && (
              <div className="text-xs text-base-content/60">{contractor}</div>
            )}
          </h3>
          <div className="text-xs text-base-content/60">Van {van_id}{date ? ` • ${new Date(date).toLocaleDateString()}` : ''}</div>
        </div>
        <div className="grid grid-cols-5 gap-2">
          <Item label="Spare" value={tools.spare_wheel} />
          <Item label="Straps" value={tools.straps} />
          <Item label="Ramp" value={tools.ramp} />
          <Item label="Blankets" value={tools.blankets} />
          <Item label="Trolley" value={tools.trolley} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Item label="Corners" value={parameters.corners} />
          <Item label="Windshield" value={parameters.windshield} />
          {parameters.miles && (
            <div className="flex flex-col items-center" title={String(parameters.miles)}>
              <span className="text-lg">{Number(parameters.miles).toLocaleString()}</span>
              <span className="text-xs">Miles</span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-6 gap-2">
          <Item label="Coolant" value={parameters.coolant_level} />
          <Item label="Fuel" value={parameters.fuel} />
          <Item label="Oil" value={parameters.check_oil} />
          <Item label="Antifr" value={parameters.check_antifreeze} />
          <Item label="Engine" value={parameters.check_engine} />
          <Item label="AdBlue" value={parameters.check_adblue} />
        </div>
        <div className="grid grid-cols-4 gap-2">
          <Item label="LF" value={tires.left_front} />
          <Item label="RF" value={tires.right_front} />
          <Item label="LR" value={tires.left_back} />
          <Item label="RR" value={tires.right_back} />
        </div>
      </div>
    </div>
  );
}
