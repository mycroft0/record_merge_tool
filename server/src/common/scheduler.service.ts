import * as schedule from 'node-schedule';
import EmailService from '../services/email.service';
import Logger from './logger.service';

export class SchedulerService {

	constructor(){ 
		this.init();
	}

	private init(){
		this.heliosEmailChecker();
	}

	private heliosEmailChecker(){
		if (process.env.NODE_ENV === 'production'){
			const job = schedule.scheduleJob(
				'*/5 * * * *',
				async () => {
					try {
						Logger.info('Scheduler: Checking for new emails...');
						const resultData = EmailService.processHeliosEmails(); 
					}catch(err){
						console.log(err);
						Logger.error("Unable to check emails", err ); 
					}
				}
			)
		}
	}

}