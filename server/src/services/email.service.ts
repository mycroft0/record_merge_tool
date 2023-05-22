import nodemailer from "nodemailer";
import { ImapFlow } from "imapflow";
import { readFileSync } from "fs";
import * as Mustache from "mustache";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

import Logger from "../common/logger.service";
import { createClient, lockClient, unlockClient, endClient } from "../config/db";
import { ProjectService } from "./project.service";
import { lsolve } from "mathjs";

export class EmailService {
  private database = "";
  private imapConfig = {
    host: process.env.IMAP_HOST as string,
    port: parseInt(process.env.IMAP_PORT as string),
    secure: true,
    auth: {
      user: process.env.IMAP_USER as string,
      pass: process.env.EMAIL_PASSWORD as string,
    },
    logger: Logger,
  };

  constructor() {
    // Constructor logic here:
  }

  /*=============================================================
		Outgoing Email Processing
	=============================================================*/
  async sendJobCreatedNotification(data: any) {
    let templateName: string = "email_fms_job_created";
    let msgSubject: string = `FMS Update New Record: AWB: ${data.awb} - RYR REF: ${data.shipment_no} - ${data.origin}/${data.destination}`;
    return this.sendEmail(data, templateName, msgSubject);
  }

  async sendCustomsJobCreatedNotification(data: any) {
    let templateName: string = "email_fms_job_created";
    let msgSubject: string = `FMS New Record: Job no.: ${data.jobNo} - MRN: ${data.mawb}`;
    return this.sendEmail(data, templateName, msgSubject);
  }

  private async sendEmail(
    data: any,
    emailTemplate: string,
    emailSubject: string
  ) {
    // Preparing data, like date formats etc.
    this.prepareData(data);

    const htmlTemplate = readFileSync(
      `${process.env.TEMPLATE_DIR}/html/${emailTemplate}.html`,
      "utf-8"
    );
    Mustache.parse(htmlTemplate);
    const rendered = Mustache.render(htmlTemplate, data);

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT as string),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    try {
      const into = await transporter.sendMail({
        sender: "noreply@mauriceward.com",
        from: process.env.SMTP_USER,
        to: data.sendTo,
        subject: emailSubject,
        attachments: data.attachments,
        html: rendered,
      });
      return { send: true };
    } catch (err) {
      Logger.error("Error sending email: ", err);
      console.log(err);
      return { send: false, error: err };
    }
  }

  private prepareData(data: any) {
    //Data modification if requred
  }

  /*=============================================================
		Incoming Email Processing
	=============================================================*/
  public async processHeliosEmails() {
    Logger.info("Start processing Helios emails...");
    let srcDirs: any = [];
    let mailList:any = {};

    const client = new ImapFlow(this.imapConfig);
    await client.connect();
    
    let lock = await client.getMailboxLock('INBOX');
  
    try{
      const searchOpt = {
        from: "customs.notifications@mauriceward.com",
        subject: "Propuštěno, MRN",
      };
      const attOpt = {
        uid: true,
        flags: true,
        source: true,
        internalDate: true,
        bodyStructure: true,
        envelope: true,
      };

      for await (let msg of client.fetch(searchOpt, attOpt)) {
        let { uid, bodyStructure, envelope } = msg;
        const emailSubject = envelope.subject;
        const mrn = emailSubject.replace(/^(.*?MRN=)(.*?)$/, "$2");
        mailList[uid] = { mrn, bodyStructure, subject: envelope.subject  };
      }

      for (let uid in mailList) {
        let { mrn, bodyStructure, subject } = mailList[uid];

        if(srcDirs.includes(`/tmp/${mrn}`)){
          Logger.info(`Duplicate e-mail detected for MRN: ${mrn}`);
          continue;
        }

        for (let part of bodyStructure.childNodes) {
          if (part.disposition && part.disposition === "attachment") {
            let {meta, content} = await client.download('' + uid, part.part, {uid: true});
            if (content && meta.filename) {
              try {
                const path = `/tmp/${mrn}`;
                if (!fs.existsSync(path)) {
                  fs.mkdirSync(path, { recursive: true });
                }

                let fileName = part.dispositionParameters.filename;
                if (fileName.endsWith(".pdf") || fileName.endsWith(".xml")) {
                  fileName = fileName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                  fileName = fileName.replace(/[^a-zA-Z0-9\.]/g, "_");
                  fileName = fileName.replace(/[.](?=.*[.])/g, "_");
                  Logger.info("Writing file: " + path + "/" + fileName);
                  let out = fs.createWriteStream(`${path}/${fileName}`);
                  await new Promise<void>((resolve) => {
                    content.pipe(out);
                    out.once("finish", () => { resolve(); });
                  });
                }
              } catch (err) {
                Logger.error(`Error writing file ${meta.filename}`, err);
              }
            }
          }
        }
        srcDirs.push(`/tmp/${mrn}`);
      }

      Logger.info("Prosessing dirs: " + JSON.stringify(srcDirs));
      this.database = "mwcz";
      createClient(this.database);
      const projectService = new ProjectService();
      projectService.init();
      const customsJobs = await projectService.processCustomsProjectsCZ(srcDirs);

      await client.messageMove(searchOpt, "Processed");
      await client.messageMove('1:*', "Trash");
      await client.logout();
    }catch(err){
      Logger.error("Error processing email: ", err);
    }finally{
      Logger.info("Release!");
      lock.release();
    }
    
  }

  private storeFilesByPattern(files: any, pattern: RegExp, path: string) {
    files.forEach(async (file: any) => {
      if (file.filename && pattern.test(file.filename)) {
        Logger.info("Writing file: " + path + "/" + file.filename);
        try {
          if (!fs.existsSync(path)) {
            fs.mkdirSync(path, { recursive: true });
          }
          fs.writeFileSync(`${path}/${file.filename}`, file.content);
        } catch (err) {
          Logger.error(`Error writing file ${file.filename}`, err);
        }
      }
    });
  }

}

export default new EmailService();
