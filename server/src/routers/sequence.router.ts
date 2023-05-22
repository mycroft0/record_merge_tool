import {Router, Request, Response} from "express";
import SequenceController from "../controllers/sequence.controller";

export class SequenceRouter {
	private router: Router = Router();

	constructor() {
		this.configureRoutes();
	}

	private configureRoutes() {
		this.router.patch("/next/:type/:id", async (req: Request, res: Response) => {
			await SequenceController.assignNextSequenceNumber(req, res);
		});
	}

	getRoutes() {
		return this.router;
	}
}

export default new SequenceRouter();