import { createScheduleHandler, scheduleApiConfig } from '../../lib/scheduleTool';

export const config = scheduleApiConfig;

export default createScheduleHandler('schedule_trips_tool2', ['Driver1', 'fromLeftIndex']);
