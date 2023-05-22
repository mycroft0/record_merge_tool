import express, {Application, Request, Response} from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

import { createClient } from './config/db';
import ProjectRouter from './routers/project.router';
import SequenceRouter from './routers/sequence.router';
import ConfigRouter from './routers/config.router';
import { SchedulerService } from './common/scheduler.service';
import Logger from './common/logger.service';
import ShipperRouter from "./routers/merge.router";

export class App {
	private app: Application;
	private scheduler: SchedulerService;

	constructor(){
		this.app = express();
		this.middlewareSetup();
		this.routesSetup();
		this.scheduler = new SchedulerService();
	}

	private middlewareSetup(): void{
		this.app.use(
			express.json()
		);
		this.app.use(
			express.urlencoded({extended: true})
		);

		this.app.use(cors({
			origin: true,
			methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'],
			credentials: true 
		}));
		this.app.use(helmet());
		this.app.use(compression());
	}

	private routesSetup(): void{
		this.app.use("/:database/*", (req: Request, res: Response, next: any)=>{
			const database = req.query.database as string || req.params.database;
			if (!database){
				res.status(404).send({"OK": false, message: "Missing required paramter!"});
			}
			createClient(database);
			next();
		});

		this.app.use("/:database/projects", ProjectRouter.getRoutes());
		this.app.use("/:database/sequences", SequenceRouter.getRoutes());
		this.app.use("/:database/configs", ConfigRouter.getRoutes());
		this.app.use("/:database/list", ShipperRouter.getRoutes())

		this.app.all("*", (req: Request, res: Response) => {
			res.status(404).send({"OK": false, message: "Please check your URL!"});
		});
	}

	run(port: number): void{
		this.app.listen(
			port,
			"localhost",
			() => {console.log(`Application started on port: ${port}`)}
		);
		Logger.info(`Server is running on port ${port}`);
	}

}
