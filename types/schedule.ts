export interface Trip {
    ID: string;
    Start_Time?: string;
    End_Time?: string;
    Driver1?: string;
    Contractor?: string;
    Punctuality?: string;
    Calendar_Name?: string;
    Order_Value?: string;
    isAssigned?: boolean;
    fromLeftIndex?: number; // For right trips, to track origin in left
}

export interface RouteGroup {
    name: string;
    codes: string[];
    isFull: boolean;
    color: string;
}

export interface TimeSettings {
    lateEndHour: number;
    earlyStartHour: number;
    earlyEndHour: number;
    lateStartHour: number;
    restMessage: string;
    earlyMessage: string;
    enableRestWarning: boolean;
    enableEarlyWarning: boolean;
}
