import {Client} from "pg";
import {getClient, isLocked} from "../config/db";

import Logger from "../common/logger.service";
import camelcaseKeys from "camelcase-keys";
import {SequenceService} from "./sequence.service";
import {round} from "mathjs";


export class ShipperService {
    private clientInUse: number = 0;
    private client: Client;

    constructor() {
        this.client = getClient();
    }

    async init() {
        await this.client.connect();
    }

    private async clear() {
        this.clientInUse--;
        if (!this.clientInUse && !isLocked()) {
            await this.client.end();
        }
    }

    async getInformation(letter_search: string) {
        try {

            let valueInject = ''

            if (letter_search == '1-9') {
                valueInject = '[' + '^A-Za-zА-Яа-я' + ']%';
            } else {
                valueInject = '[' + letter_search + letter_search.toLowerCase() + "]%";
            }

            const values = [
                valueInject
            ]

            const selectAllShipperQuery = 'SELECT shipper.name, shipper.id, shipper.master_id, shipper.is_master , address.address2, country.name AS country_name FROM ((shipper  INNER JOIN address ON shipper.id = address.trans_id ) INNER JOIN country ON address.country_id = country.id) WHERE shipper.name SIMILAR TO $1 ORDER BY shipper.name  '; //$1

            const {rows} = await this.client.query(selectAllShipperQuery, values);

            return rows;

        } catch (err) {
            Logger.info("Error: when getting address details => ", err);
        } finally {
            await this.clear();
        }
    }


    async mergeRecords(master_id: string, child_id: string) {
        try {

            const values = [
                master_id,
                child_id
            ]
            const values1 =[
                child_id
            ]

            if(master_id == child_id){
                let selectAllShipperQuery: string = `UPDATE shipper SET is_master = 1 WHERE id = $1`
                const {rows} = await this.client.query(selectAllShipperQuery, values1);
                return rows;
            }

            let selectAllShipperQuery: string = `UPDATE shipper SET master_id = $1 WHERE id = $2 `

            //   const selectAllShipperQuery = 'SELECT * FROM shipper LIMIT 40';
            const {rows} = await this.client.query(selectAllShipperQuery, values);
            return rows;

        } catch (err) {
            Logger.info("Error: when getting address details => ", err);
        } finally {
            await this.clear();
        }
    }


}