import axios from 'axios'

export const baseURL = process.env.REACT_APP_BASEURL;
export const dataBase = document.getElementById('dataset').value;// process.env.REACT_APP_DATABASE;


export const api = axios.create({baseURL})