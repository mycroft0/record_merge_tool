import { Request, Response } from 'express';
import { ConfigService } from '../services/config.service';

export class ConfigController {
    async getAddresses(req: Request, res: Response){
        const configService = new ConfigService();
        configService.init();
        const addresses = await configService.getAddresses();
        const reponse = {"OK": true, message: "Successfull!", data: addresses};
        res.status(200).send(reponse);
    }
}

export default new ConfigController();