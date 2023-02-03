import { CronJob } from 'cron';

const CRON_INTERVAL_FIVE_MINUTES = '*/5 * * * *';

export class CronService {
    private activeCrons = new Map<number, CronJob>;

    setupCron(groupId: number, onTick: () => void): void {
        const cron = new CronJob(CRON_INTERVAL_FIVE_MINUTES, onTick);

        cron.start();

        this.activeCrons.set(groupId, cron);
    }

    stopCron(groupId: number): void {
        const cron = this.activeCrons.get(groupId);
        if (cron) {

            cron.stop();

            this.activeCrons.delete(groupId);
        }
    }
}
