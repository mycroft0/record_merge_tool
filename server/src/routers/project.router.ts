import { Router, Request, Response } from 'express';
import ProjectController from "../controllers/project.controller";


export class ProjectRouter {
	private router: Router = Router();
	
	constructor(){
		this.configureRoutes();
	}

	private configureRoutes(){
		this.router.get("/", (req: Request, res: Response) => {
			ProjectController.getProjects(req, res);
		});
		this.router.post("/:type", (req: Request, res: Response) => {
			ProjectController.createProject(req, res);
		});
		this.router.get("/helios", (req: Request, res: Response) => {
			ProjectController.processJobsFromHelios(req, res);
		});
	}

	getRoutes(){
		return this.router;
	}

}

export default new ProjectRouter();