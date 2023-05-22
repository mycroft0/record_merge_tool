import {Client} from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

let client: Client;
let clientInUse:number = 0;
let lock: boolean = false;

export const createClient = (database: string) => {
	client = new Client({
		host: process.env.DB_HOST,
		port: Number ( process.env.DB_PORT ),
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		database
	});
}

export const endClient = async () => {
	await client.end();
}

export const lockClient = () => {
	lock = true;	
}

export const unlockClient = () => {
	lock = false;
}

export const isLocked = () => {
	return lock;
}

export const getClient = () => {
	return client;
} 

export const clearUsage = async () => {
  	clientInUse--;
  	if (!clientInUse && !isLocked()) {
    	await endClient();
  	}
};

export const useClient = () => {
	clientInUse++;
}