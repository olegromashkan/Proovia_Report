import React from 'react';

interface Props {
  data: any;
}

function yesNoIcon(val: boolean | string | undefined) {
  if (val === true || val === 'true') return '✅';
  if (val === false || val === 'false') return '❌';
  return '⚠️';
}

export default function VanCheck({ data }: Props) {
  if (!data) return null;
  const { van_id, driver_id, tools = {}, parameters = {} } = data;
  const tires = parameters.tires || {};

  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body p-4 space-y-3">
        <h3 className="card-title text-primary">
          Driver {driver_id} – Van {van_id}
        </h3>

        <div>
          <h4 className="font-semibold">🧰 Equipment:</h4>
          <ul className="ml-4 list-disc">
            <li>Spare Wheel: {yesNoIcon(tools.spare_wheel)}</li>
            <li>Straps: {tools.straps ?? 'N/A'}</li>
            <li>Ramp: {yesNoIcon(tools.ramp)}</li>
            <li>Blankets: {tools.blankets ?? 'N/A'}</li>
            <li>Trolley: {yesNoIcon(tools.trolley)}</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold">🧾 Vehicle Condition:</h4>
          <ul className="ml-4 list-disc">
            <li>Corners: {yesNoIcon(parameters.corners === 'undamaged')} {parameters.corners === 'undamaged' ? 'Undamaged' : parameters.corners}</li>
            <li>Windshield: {yesNoIcon(parameters.windshield === 'undamaged')} {parameters.windshield === 'undamaged' ? 'Undamaged' : parameters.windshield}</li>
            {parameters.miles && (
              <li>Mileage: {Number(parameters.miles).toLocaleString()} mi</li>
            )}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold">🛢 Fluids & Checks:</h4>
          <ul className="ml-4 list-disc">
            <li>Coolant Level: {yesNoIcon(parameters.coolant_level === 'good')} {parameters.coolant_level}</li>
            <li>Fuel Level: {yesNoIcon(parameters.fuel)}</li>
            <li>Oil Check: {yesNoIcon(parameters.check_oil)}</li>
            <li>Antifreeze Check: {yesNoIcon(parameters.check_antifreeze)}</li>
            <li>Check Engine: {yesNoIcon(parameters.check_engine)}</li>
            <li>AdBlue: {yesNoIcon(parameters.check_adblue)}</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold">🛞 Tyre Condition:</h4>
          <ul className="ml-4 list-disc">
            <li>Left Front: {yesNoIcon(tires.left_front)} {tires.left_front}</li>
            <li>Left Rear: {yesNoIcon(tires.left_back)} {tires.left_back}</li>
            <li>Right Front: {yesNoIcon(tires.right_front)} {tires.right_front}</li>
            <li>Right Rear: {yesNoIcon(tires.right_back)} {tires.right_back}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
