import { App } from './App';
import * as dotenv from 'dotenv';

dotenv.config();
if(!process.env.APP_PORT){
	process.exit();
}

const PORT: number =  parseInt( process.env.APP_PORT );

const app = new App();
app.run(PORT);