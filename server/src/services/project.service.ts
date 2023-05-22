import camelcaseKeys from "camelcase-keys";
import { Client } from "pg";
import Logger from "../common/logger.service";
import { endClient, getClient, isLocked, lockClient, unlockClient } from "../config/db";
import { SequenceService } from "./sequence.service";
import { round } from 'mathjs';
import pg from 'pg';
import convert from "xml-js";
import fs from 'fs';

export class ProjectService {
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

  async getProjects(filter: any) {
    try {
      this.clientInUse++;
      let values = [];

      let sql: string = `SELECT wp.ward_project_id, wp.job_no, wp.mawb, wp.hawb,
				wp.reference, wp.gross, 
				co.name AS origin, co.code AS origin_code,
				cd.name AS destination, cd.code AS destination_code,
				e.name AS handled_by,
        ( 
          SELECT json_agg(dims)::jsonb 
          FROM ward_project_hawb_volumes AS dims 
          WHERE ward_project_id = wp.ward_project_id 
        ) AS dimentions
				FROM ward_project wp 
				LEFT JOIN country co ON co.id = wp.origin_country_id
				LEFT JOIN country cd ON cd.id = wp.destination_country_id
				LEFT JOIN employee e ON e.id = NULLIF(wp.handled_by_id, '')::INTEGER
				WHERE 1 = 1 `;

      if (filter.jobNo) {
        sql += ` AND ( job_no ILIKE $1 
				OR mawb ILIKE $1 
				OR reference ILIKE $1 )`;
        values.push(`%${filter.jobNo}%`);
      } else if (filter.wardProjectId) {
        sql += ` AND ward_project_id = $1`;
        values.push(filter.wardProjectId);
      }

      const data = await this.client.query(sql, values);
      const jobs = camelcaseKeys(data.rows, { deep: true });
      return jobs;
    } catch (err) {
      console.log("Error: ", err);
    } finally {
      await this.clear();
    }
  }

  async createProject(type: string, data:any){
    if(type === 'customs'){
      data.shipment_type = type;
      data.internal = false;
      return await this.postCustomsProject(data);
    }else{
      //some other project type
    }

  }
  
  async postWardProject(data: any) {
    try {
      this.clientInUse++;
      let values: any = [];
      let items = "";
      data.forEach((element: any) => {
        values.push(element);
      });
      let sql: string = `INSERT ward_project (

			)	VALUES (

			) RETURNING *`;
      const result = await this.client.query(sql, values);
      const jobs = camelcaseKeys(result.rows, { deep: true });

      return jobs;
    } catch (err) {
      console.log(err);
    } finally {
      await this.clear();
    }
  }

  // Processing projects created based on XML files received from Helios
  async processCustomsProjectsCZ(srcDirs: any) {
    try {
      lockClient();
      pg.types.setTypeParser(1082, (val: any) => {
        return val;
      });

      let jobs:any = [];

      for (const dir of srcDirs) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const reDeclaration = /CR_PROD.xml|CR_PRID.xml/i;
          if (file && reDeclaration.test(file)) {
            Logger.info("Processing declaration: " + file);
            const fileContent = fs.readFileSync(dir + "/" + file, "utf8");
            const jsonDeclaration = convert.xml2js(fileContent, {
              compact: true,
            });
            const wpData = await this.prepareCustomsData(jsonDeclaration);
            const isDuplicit:number = await this.mrnExists(wpData);
            const declarantRegEx = /Nikola Žižková|Michal Kocák|Iveta Sedláková|Kateřina Tutokyová/;
            const refNoRegExp = /^(SB\/|OR\/|AI\/|TR\/)/;
            if(declarantRegEx.test(wpData?.declarant) 
            || refNoRegExp.test(wpData?.refNo)
            || isDuplicit > 0){
              continue;
            }
            const jobDetails = await this.postCustomsProject(wpData);
            if (jobDetails && jobDetails[0].jobNo) {
              Logger.info("Job created: " + jobDetails[0].jobNo);
			        const year = jobDetails[0].dateProject.substring(0, 4);
			        const countryCode = jobDetails[0].jobNo.substring(0, 2);
			        const ATTCH_DIR = process.env.JOB_ATTACHMENTS_DIR || "/tmp"
			        const destPath = `${ATTCH_DIR}/CZ/${year}/${jobDetails[0].jobNo}`;
        	    if (!fs.existsSync(destPath)) {
          	  	fs.mkdirSync(destPath, { recursive: true });
			        }
			        fs.renameSync(dir, destPath);
              jobs.push(jobDetails[0]);
              break;
            }
          }
        }
      }

	    return jobs;
    } catch (err) {
      Logger.error("Error: processCustomsProjects => ", err);
    } finally {
      unlockClient();
      endClient();
    }
  }

  private async mrnExists(wpData:any){
    try{
      const query = `SELECT COUNT(*) FROM ward_project WHERE job_no = $1`;
      const results = await this.client.query(query, [wpData.mrn]);
      return results.rows[0].count;
    }catch(err){
      Logger.error("Error: mrnExists => ", err);
    }

  }

  private async prepareCustomsData(data: any) {
    try {
      const type = data.CZ429A ? "CZ429A" : "CZ529A";
      const originCcountry = await this.getCountryBy({
        by: "code",
        value: data[type].H.H09._text,
      });
      const destinationCountry = await this.getCountryBy({
        by: "code",
        value: data[type].H.H04._text,
      });
      const projectDate = data[type].H.QH68._text.replace(
        /(\d{4})(\d{2})(\d{2})/,
        "$1-$2-$3"
      );

      const commodity = this.getCommodityDetails(data[type].G);
      const terms = ( data[type].DODP && data[type].DODP.DODP01 ? data[type].DODP.DODP01._text : "" );
      const declarant = ( data[type].REP.REP01 ? data[type].REP.REP01._text : "" );
      const customsFee = ( data[type].PV?.PPV?.PPV03 ? data[type].PV.PPV.PPV03._text : 0 );
      const variableSymbol = ( data[type].PV?.PPV?.PPV04 ? data[type].PV.PPV.PPV04._text : "" );
      const refNo = ( data[type].H.H06 ? data[type].H.H06._text : "" );

      const projectDetails = {
        shipment_type: "customs",
        date_project: projectDate,
        mrn: data[type].H.H01._text,
        pieces: data[type].H.H43._text,
        gross: commodity.gross,
        commodity: commodity.description,
        chargeable_weight: commodity.chargeable,
        origin_country_id: originCcountry?.id,
        destination_country_id: destinationCountry?.id,
        terms,
        declarant,
        customsFee,
        variableSymbol,
        refNo
      };

      return projectDetails;
    } catch (err) {
      Logger.error("Error: prepareWardProjectData => ", err);
    }
  }

  private getCommodityDetails(data: any) {
    let commodity: any;
    if (data.length) {
      let description = "";
      let chargeable: number = 0;
      let gross: number = 0;
      for (const item of data) {
        description += item.G04._text || "" + "\n";
        gross += +item.G06._text;
        chargeable += +item.G06._text;
      }
      commodity = { description, gross, chargeable };
    } else {
      commodity = {
        description: data.G04._text || "",
        gross: +data.G06._text || 0,
        chargeable: +data.G06._text || 0,
      };
    }

    return commodity;
  }

  async postCustomsProject(data: any) {
    try {
      this.clientInUse++;
      const jobNo = data.mrn ? data.mrn : "";
      let values: any = [
        jobNo,
        data.shipment_type,
        data.date_project,
        data.refNo,
        round(data.pieces, 2),
        round(data.gross, 2),
        round(data.chargeable_weight, 2),
        data.commodity,
        data.origin_country_id,
        data.destination_country_id,
        data.terms,
        false,
        data.refNo
      ];

      let sql: string = `INSERT INTO ward_project (
        job_no,
				shipment_type,
				date_project,
				mawb,
				pieces, 
				gross, 
				chargeable_weight, 
				commodity, 
				origin_country_id,
				destination_country_id,
				freight_terms,
				internal,
        billing_reference
			)	VALUES (
				$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
			) RETURNING *`;
      const result = await this.client.query(sql, values);
      const jobs = camelcaseKeys(result.rows, { deep: true });

      if (!jobs.length) {
        const sequenceService = new SequenceService();
        const sequence = await sequenceService.assignNextSequenceNumber({
          type: "wp",
          id: jobs[0].wardProjectId,
          projectDate: jobs[0].dateProject,
        });
        jobs[0].jobNo = sequence.job_no;
      }
      return jobs;
    } catch (err) {
      Logger.error("Error: postCustomsProject", err);
    } finally {
      await this.clear();
    }
  }

  async getShipperBy(data: any) {
    try {
      this.clientInUse++;
      let values: any = [data.value];

      let sql: string = `SELECT * FROM shipper 
			WHERE  ${data.by} = $1`;

      const result = await this.client.query(sql, values);
      const shipperDetails = camelcaseKeys(result.rows, { deep: true });

      return shipperDetails;
    } catch (err) {
      Logger.error("Error: getShipperBy", err);
    } finally {
      await this.clear();
    }
  }

  async getCountryBy(data: any) {
    try {
      this.clientInUse++;
      let values: any = [data.value];

      let sql: string = `SELECT * FROM country  
			WHERE ${data.by} = $1`;

      const result = await this.client.query(sql, values);
      const countryDetails = camelcaseKeys(result.rows, { deep: true });

      return countryDetails[0];
    } catch (err) {
      Logger.error("Error: getCountryBy", err);
    } finally {
      await this.clear();
    }
  }
}