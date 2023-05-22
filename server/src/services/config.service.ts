import { Client } from "pg";
import { getClient, isLocked } from "../config/db";

import Logger from "../common/logger.service";


export class ConfigService {
    private clientInUse: number = 0;
    private client: Client;

    constructor(){
        this.client = getClient();
    }

    async init(){
        await this.client.connect();
    }

    private async clear(){
        this.clientInUse--;
        if(!this.clientInUse && !isLocked()){
            await this.client.end();
        }
    }

    async getAddresses(){
        try{
            this.clientInUse++;

            let addressDetails:any; 

            const diffAddressQuery = `SELECT * FROM fms_config WHERE parameter = 'dept_diff_address'`;
            const diffAddressResult = await this.client.query(diffAddressQuery, []);
console.log(diffAddressResult);
            if(diffAddressResult.rows[0]?.value === 'true'){
                const addressDetQuery = `
                SELECT 
                sh.name AS company, sh.phone AS phone, 
                ad.address1, ad.address2, ad.city, ad.zipcode, 
                co.name AS country 
                FROM job_departments jd
                LEFT JOIN shipper sh ON sh.id = jd.shipper_id 
                LEFT JOIN address ad ON ad.trans_id = sh.id 
                LEFT JOIN country co ON co.id = ad.country_id
                `;
                addressDetails = await this.client.query(addressDetQuery, []);
                console.log(addressDetQuery);
            }else{
                const addressDetQuery = `
                    SELECT
                    sh.name AS company, sh.phone AS phone, 
                    ad.address1, ad.address2, ad.city, ad.zipcode, 
                    co.name AS country 
                    FROM fms_config fc 
                    LEFT JOIN shipper sh ON sh.id = fc.value::INTEGER
                    LEFT JOIN address ad ON ad.trans_id = sh.id
                    LEFT JOIN country co ON co.id = ad.country_id
                    WHERE  fc.parameter = 'default_shipper_id'
                `;
                addressDetails = await this.client.query(addressDetQuery, []);
                console.log(addressDetQuery);
            }

console.log(addressDetails);

            return addressDetails.rows;
        }catch(err){
            Logger.info("Error: when getting address details => ", err);
        }finally{
            await this.clear();
        }
    }
}