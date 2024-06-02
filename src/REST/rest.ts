import { Client } from "../Client";
import Axios, { AxiosResponse } from "axios";
import fs from 'fs'

export class RESTApiManager {
  client: Client;
  headers: {
    'Authorization': string,
    'x-csrf-token': string,
    'Cookie': string,
    'content-type': string,
    'User-Agent': string,
    'Accept': string,
    'Accept-Language': string,
    'Accept-Encoding': string,
    'Connection': string,
    'TE': string,
  }
  constructor(client: Client) {
    this.client = client;
    this.headers = {
      'Authorization': `${this.client.token}`,
      'x-csrf-token': `${this.client.csrfToken}`,
      'Cookie': `${this.client.cookies}`,
      'content-type': "application/json",
      'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
      'Accept': "*/*",
      'Accept-Language': "en-US",
      'Accept-Encoding': "gzip, deflate",
      'Connection': "close",
      'TE': "trailers",
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


