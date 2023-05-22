import { Request, Response } from 'express';
import { SequenceService } from '../services/sequence.service';

export class SequenceController {
	
	async assignNextSequenceNumber(req: Request, res: Response) {
		const sequenceService = new SequenceService();
		sequenceService.init();
		const { type, id } = req.params;
		const projectDate = req.query.date || new Date().toISOString().slice(0, 10);
		try {
			const sequence = await sequenceService.assignNextSequenceNumber({ type, id, projectDate });
			const response = { "OK": true, message: "Successful!", data: sequence };
			res.status(200).send(response);
		} catch(err) {
			res.status(200).send({error: { message: "Error!", data: err }});
		}
	}

}

export default new SequenceController();