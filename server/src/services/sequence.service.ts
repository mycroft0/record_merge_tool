import { Client } from "pg";
import { nextTick } from "process";
import { getClient, isLocked } from "../config/db";
import Logger from "../common/logger.service";

export class SequenceService {
  private clientInUse: number = 0;
  private client: Client;

  private sequenceConfig: any = {
    mwams: { prefix: "NL" },
    mwnetworks: { prefix: "MWN" },
    mwsk1: { prefix: "SK"},
    mwspain: { prefix: "SP" },
    mwlaustria: { prefix: "AT" },
    mwpoland: { prefix: "PL" },
    mwitaly: { prefix: "IT" },
    mwfrance: { prefix: "FR" },
    mwuk: { prefix: "UK" },
    mwlg: { prefix: "DE" },
    mwslovenia: { prefix: "SI" },
    MWLCzech: { prefix: "PLZ" },
    mwbulgaria: { prefix: "BG" },
    mwromania: { prefix: "RO" },
    mwcz: { prefix: "CZ" },
    mwlireland: { prefix: "IE" },
    CCS: { prefix: "ECS" },
    jwhu: { prefix: "HU" },
    mwch: { prefix: "CH" },
    f4ward: { prefix: "FWUK" },
    f4wardfi: { prefix: "FWFI" },
    f4wardfr: { prefix: "FWFR" },
    mwdk: { prefix: "DK" },
    mwnuk: { prefix: "UKN" },
    mwlt: { prefix: "LT" },
    mwse: { prefix: "SE" },
    mwpt: { prefix: "PT" },
    mwgr: { prefix: "GR" },
    mwbe: { prefix: "BE" },
    mwhr: { prefix: "HR" },
    mwrs: { prefix: "RS" },
    mwno: { prefix: "NO" },
    moduleConfig: {
      tt_load: {
        table: "fms_tt_load",
        sequenceCol: "job_number",
        idCol: "id",
        sequenceSrc: "wp"
      },
      tt_order: {
        table: "fms_tt_orders",
        prefix: "ORD",
        sequenceCol: "order_number",
        idCol: "id",
      },
      wp: {
        table: "ward_project",
        sequenceCol: "job_no",
        idCol: "ward_project_id",
      },
      fms_prj: {
        table: "fms_project",
        sequenceCol: "project_number",
        idCol: "id",
        sequenceSrc: "wp"
      },
    },
  };

  constructor() {
    this.client = getClient();
  }

  async init() {
    await this.client.connect();
  }

  private async clear() {
    this.clientInUse--;
    if (!this.clientInUse && !isLocked()){
      await this.client.end();
    }
  }

  async assignNextSequenceNumber(inData: any) {
    Logger.info("Call assignNextSequenceNumber ...");
    try {
      this.clientInUse++;

      const dataset = this.client.database || "";
      const year = inData.projectDate.slice(2, 4);
      const idValue = inData.id;
      const datasetPrefix = this.sequenceConfig[dataset]
        ? this.sequenceConfig[dataset].prefix
        : "";
      //const moduleConfig = this.sequenceConfig.moduleConfig[inData.type];

      /*
        Configuring parameters for seq source and target
        tgt - target, meaning target where sequence should be set into
        src - source, meaning what data/tables serves as source of sequence
        if: tgtConfig has sequenceSrc => then srcConfig is taken from appropriate config part 
        else: srcConfig = tgtConfig ( source and target of sequence are the same table)
      */
      let srcConf, tgtConf, tgtTable, srcTable, tgtSeqCol, srcSeqCol, tgtIdCol, srcIdCol;
      tgtConf = this.sequenceConfig.moduleConfig[inData.type];
      if (tgtConf.sequenceSrc){
        srcConf = this.sequenceConfig.moduleConfig[tgtConf.sequenceSrc];
      }else{
        srcConf = this.sequenceConfig.moduleConfig[inData.type];
      }
      

      srcTable = srcConf.table;
      srcSeqCol = srcConf.sequenceCol;
      srcIdCol = srcConf.idCol;
      tgtTable = tgtConf.table;
      tgtSeqCol = tgtConf.sequenceCol;
      tgtIdCol = tgtConf.idCol;

      const modulePrefix = srcConf.prefix ? srcConf.prefix : "";
      const sequencePrefix = datasetPrefix + modulePrefix + year;

      this.client.query("BEGIN");
      let lock = `SELECT pg_advisory_xact_lock(1000)`;
      let lockTimout = `SET LOCAL lock_timeout TO '5s'`;

      let getSeqSrcQuery = `SELECT MAX(${srcSeqCol}) AS last_job 
						FROM ${srcTable} 
						WHERE ${srcSeqCol} LIKE $1`;

      let setTgtSeqQuery = `UPDATE ${tgtTable} 
						SET ${tgtSeqCol} = $1 
						WHERE ${tgtIdCol} = $2 RETURNING ${tgtIdCol}, ${tgtSeqCol}`;


      await this.client.query(lock);
      await this.client.query(lockTimout);
      let { rows } = await this.client.query(getSeqSrcQuery, [sequencePrefix+"%"]);

      let lastJob = rows[0].last_job || sequencePrefix + "000000";
      let lastSequenceNum = parseInt(lastJob.substr(lastJob.length - 6), 10) || 0;
      let nextSequenceNum = `${sequencePrefix}${(lastSequenceNum + 1)
        .toString()
        .padStart(6, "0")}`;
      let setSeqVals = [nextSequenceNum, idValue];
      let result = await this.client.query(setTgtSeqQuery, setSeqVals);

      if(tgtConf.sequenceSrc){
        const setSrcSeqQuery =  `INSERT INTO ${srcTable} (${srcSeqCol}, date_project) VALUES ($1, now())`;
        await this.client.query(setSrcSeqQuery, [nextSequenceNum]);
      }

      await this.client.query("COMMIT");

      Logger.info(`Working in dataset: ${dataset}`);
      Logger.info("Process sequence assignment");
      Logger.info(`Max sequence from ${srcTable} = ${lastJob}`);
      Logger.info(`Assign sequence ${nextSequenceNum} to ${tgtTable}`);
      if (tgtConf.sequenceSrc) {
        Logger.info(`Reserving job no ${nextSequenceNum} in ${srcTable}`);
      }

      return result.rows[0];
    } catch (err) {
      this.client.query("ROLLBACK");
      Logger.error("Error: assignNextSequenceNumber => ", err);
      throw err;
    } finally {
      await this.clear();
    }
  }
}
