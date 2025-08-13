import { createScheduleHandler } from '../../lib/scheduleTool';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

export default createScheduleHandler('schedule_trips_tool2', ['Driver1', 'fromLeftIndex']);
