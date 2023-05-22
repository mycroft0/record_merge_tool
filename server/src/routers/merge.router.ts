import {Router, Request, Response} from "express";
import ShipperController from "../controllers/merge.controller";


export class ShipperRouter {

    private router: Router = Router();

    constructor(){
        this.shipperRouter();
    }

    private shipperRouter(){
        this.router.post("/shipper", (req: Request, res: Response) => {
            ShipperController.getShipperList(req,res);
        });

        this.router.post("/merge", (req: Request, res: Response) => {
            ShipperController.mergeShipperList(req,res);
        });

    }

    getRoutes(){
        return this.router;
    }

}

export default new ShipperRouter();