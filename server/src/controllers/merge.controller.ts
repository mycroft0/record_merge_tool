import {Request, Response} from 'express';
import {ShipperService} from "../services/merge.service";


export class ShipperController {
    async getShipperList(req: Request, res: Response) {
        const importService = new ShipperService();
        await importService.init();
        const {letter_search} = req.body;

        const dataInfo = await importService.getInformation(req.body[0].letter);

        const response = {"OK": true, message: "Successful!", data: dataInfo}
        res.status(200).send(response);

    }

    async mergeShipperList(req: Request, res: Response) {
        const mergeRecordsService = new ShipperService();
        await mergeRecordsService.init();


        try {
            const master_id = req.body[0].id
            for (let i = 0; i < req.body.length; i++) {

                await mergeRecordsService.mergeRecords(master_id, req.body[i].id);

            }

            const response = {"OK": true, message: "Successful updated!"}
            res.status(200).send(response);

        } catch (err: any) {
            res.status(500).send({"OK": false, message: err.stack});
        }


    }
}

export default new ShipperController();