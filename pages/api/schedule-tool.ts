import { createScheduleHandler } from '../../lib/scheduleTool';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

export default createScheduleHandler('schedule_trips_tool', ['Driver1', 'isAssigned']);