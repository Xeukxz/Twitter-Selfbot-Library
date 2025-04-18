import { Client } from "../Client";
import { inspect } from 'util'
import Axios, { AxiosError, AxiosResponse } from "axios";
import fs from 'fs'
import { BaseTimelineUrlData } from '../Timelines/BaseTimeline';
import { Queries } from "../Routes";

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
  requestCount: number = 0;
  errorCount: number = 0;
  /**
   * Tracing data for debugging
   */
  _trace: {
    url: string,
    time: number,
    status: string
    summary: () => string
  } = {
    url: 'undefined',
    time: 0,
    status: 'undefined',
    summary: () => {
      return `\n\x1b[1m[TRACE]\x1b[0m\n`
           + `Time: \x1b[90m${this._trace.time > 0 ? new Date(this._trace.time).toLocaleString() + `${this._trace.time}` : 'undefined'}\x1b[0m\n`
           + `Status: \x1b[90m${this._trace.status}\x1b[0m\n`
           + `curl: \x1b[90mcurl -X GET "${this._trace.url}" ${Object.entries(this.headers).map(([key, value]) => `-H "${key}: ${value}"`).join(' ')}\x1b[0m`
    }
  };
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
      let headers: any = this.headers;
      if(noAuth) delete headers.Authorization;
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
    variables: BaseTimelineUrlData['variables'] | any,
    method?: 'get' | 'post'
    fieldToggles?: {
      [key: string]: boolean
    }
  }): Promise<AxiosResponse> {
    return new Promise((resolve, reject) => {
      let features = this.client.features.get(query.metadata.featureSwitches);
      let url = `https://x.com/i/api/graphql/${query.queryId}/${query.operationName}?variables=${variables.URIEncoded()}&features=${features.URIEncoded()}${fieldToggles ? '&'+encodeURIComponent(JSON.stringify(fieldToggles)) : ''}`;
      this._trace.url = url;
      this._trace.time = Date.now();
      this._trace.status = 'pending';
      this.get(url).then((res) => {
        if(this.client.debug) fs.writeFileSync(`${__dirname}/../../debug/debug-graphql-${this.requestCount++}.json`, JSON.stringify(res.data, null, 2));
        if(res.data.errors) {
          if(this.client.debug) {
            console.error(`GraphQL Error: ${(res.data.errors as Array<any>).map(e => e.message).join(' // ')}`);
            fs.writeFileSync(`${__dirname}/../../debug/debug-graphql-error-${this.errorCount++}.json`, JSON.stringify(res.data, null, 2));
            fs.writeFileSync(`${__dirname}/../../debug/debug-graphql-full-${this.errorCount}.txt`, inspect(res, {depth: 10}));
            console.error(`Error written to debug-error-graphql-${this.errorCount}.json`);
          }
          if(res.data.errors[0].retry_after !== undefined) {
            if(this.client.debug) console.error(`Retrying after ${res.data.errors[0].retry_after}ms`);
            setTimeout(async () => {
              resolve(await this.graphQL({query, variables, method, fieldToggles}))
            }, res.data.errors[0].retry_after);
          } else reject(res.data.errors);
        } else resolve(res);
      }).catch((err: AxiosError) => {
        this._trace.status = `${err.response?.statusText} // Code: ${err.code}`
        if(err.response?.status == 503) {
          if(this.client.debug) console.error(`GraphQL Error: 503 Service Unavailable. Retrying in 30000ms.`);
          setTimeout(async () => {
            resolve(await this.graphQL({query, variables, method, fieldToggles}))
          }, 30000);
        } else if((err as AxiosError).code == 'ECONNRESET') {
          if(this.client.debug) console.error(`GraphQL Error: ECONNRESET. Retrying in 30000ms.`);
          setTimeout(async () => {
            resolve(await this.graphQL({query, variables, method, fieldToggles}))
          }, 30000);
        } else reject(err);
      });
    });
  }
}


