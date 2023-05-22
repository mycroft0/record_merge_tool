import {Router, Request, Response} from "express";
import ConfigController from "../controllers/config.controller";
import { ProjectRouter } from "./project.router";

export class ConfigRouter {

    private router: Router = Router();

    constructor(){
        this.configureRoutes();
    }

    private configureRoutes(){
        this.router.get("/addresses", (req: Request, res: Response) => {
            ConfigController.getAddresses(req, res);
        })
    }

    getRoutes(){
        return this.router;
    }

}

export default new ConfigRouter;