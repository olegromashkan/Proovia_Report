export interface CheckItem {
  value: string | number | Record<string, any>;
  status: 'OK' | 'Warning' | 'Error';
}

export interface ToolsData {
  spare_wheel?: boolean;
  straps?: number;
  ramp?: boolean;
  blankets?: number;
  trolley?: boolean;
}

export interface VanCheckData {
  van_id: string;
  driver_id?: string;
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
  [key: string]: any;
}
