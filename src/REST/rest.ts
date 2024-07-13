import { Client } from "../Client";
import Axios, { AxiosResponse } from "axios";
import fs from 'fs'
import { BaseTimelineUrlData } from '../Timelines/BaseTimeline';
import { Queries } from "../Routes";

let count = 0;

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

  get(url: string, noAuth: boolean = false): Promise<AxiosResponse> {
    return new Promise((resolve, reject) => {
      // console.log(`GET ${url}`)
      let headers: any = this.headers;
      if(noAuth) delete headers.Authorization;
      // console.log(headers)
      Axios({
        method: 'get',
        url: url,
        headers: headers,
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

  graphQL({
    query,
    variables,
    method = 'get',
    fieldToggles
  }: {
    query: Queries,
    variables: BaseTimelineUrlData['variables'],
    method?: 'get' | 'post'
    fieldToggles?: {
      [key: string]: boolean
    }
  }): Promise<AxiosResponse> {
    return new Promise((resolve, reject) => {
      console.log(variables)
      let features = this.client.features.get(query.metadata.featureSwitches);
      this.get(`https://x.com/i/api/graphql/${query.queryId}/${query.operationName}?variables=${variables.URIEncoded()}&features=${features.URIEncoded()}${fieldToggles ? '&'+encodeURIComponent(JSON.stringify(fieldToggles)) : ''}`).then((res) => {
        fs.writeFileSync(`${__dirname}/../../debug/debug-graphql-${count++}.json`, JSON.stringify(res.data, null, 2));
        resolve(res);
      }).catch((err) => {
        reject(err);
      });
    });
  }
}


