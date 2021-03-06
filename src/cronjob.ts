import cronjob from 'cron';
import { DateTime } from 'luxon';
import { getBusRoutes } from '@services/routes';
import env from '@root/constant';

const isProduction = env.ENV === 'production';

const every12Hours = '0 0 */12 * * *';

const updateJob = new cronjob.CronJob(
  every12Hours,
  updateBusRoutes,
  null,
  isProduction,
  'Asia/Hong_Kong',
  null,
  isProduction
);

async function updateBusRoutes() {
  console.info(
    `Start updating bus routes data at ${DateTime.now().toString()}`
  );

  try {
    await getBusRoutes();
  } catch (error) {
    console.error('Error on updating bus routes', error);
  }

  console.info(
    `Successfully updated bus routes data at ${DateTime.now().toString()}`
  );
}
