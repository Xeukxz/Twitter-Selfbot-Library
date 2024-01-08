import { Client } from "../Client";
import Axios, { AxiosResponse } from "axios";
import fs from 'fs'

export class RESTApiManager {
  client: Client;
  headers: {
    Authorization: string,
    'x-csrf-token': string,
    Cookie: string
  }
  constructor(client: Client) {
    this.client = client;
    this.headers = {
      Authorization: `${this.client.token}`,
      "x-csrf-token": `${this.client.csrfToken}`,
      "Cookie": `${this.client.cookies}`
    }
  }

  get(url: string): Promise<AxiosResponse> {
    return new Promise((resolve, reject) => {
      // console.log(`GET ${url}`)
      Axios({
        method: 'get',
        url: url,
        headers: this.headers,
      }).then((res) => {
        resolve(res);
      }).catch((err) => {
        reject(err);
      })
    });
  }

  post(url: string, data: any): Promise<AxiosResponse> {
    return new Promise((resolve, reject) => {
      // console.log(`POST ${url}`)
      Axios({
        method: 'post',
        url: url,
        headers: this.headers,
        data: data
      }).then((res) => {
        resolve(res);
      }).catch((err) => {
        reject(err);
      })
    });
  }
}


