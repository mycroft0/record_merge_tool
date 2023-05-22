import { Request, Response } from 'express';

import { ProjectService } from "../services/project.service"; 
import EmailService from '../services/email.service';

export class ProjectController {

	async getProjects(req: Request, res: Response){
		const projectService = new ProjectService();
		projectService.init();
		const {jobNo, wardProjectId} = req.query;
		const projects = await projectService.getProjects({ jobNo, wardProjectId });
		const response = { "OK": true, message: "Successful!", data: projects };
		res.status(200).send(response);
	}

	async createProject(req: Request, res: Response){
		const projectService = new ProjectService();
		projectService.init();
		const {type} = req.params;
		const projectDetails = await projectService.createProject(type, req.body);
		const response = { "OK": true, message: "Successful!", data: projectDetails };
		res.status(200).send(response);
	}

	async processJobsFromHelios(req: Request, res: Response){
		const resultData = EmailService.processHeliosEmails(); 
		const response = { "OK": true, message: "Successful!", data: resultData };
		res.status(200).send(response);
	}
}

export default new ProjectController();