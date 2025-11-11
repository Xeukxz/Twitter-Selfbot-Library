import { Client } from "../Client";
import { inspect } from 'util'
import Axios, { AxiosError, AxiosResponse, RawAxiosRequestHeaders, RawAxiosResponseHeaders } from "axios";
import fs from 'fs'
import { BaseTimelineUrlData } from '../Timelines/BaseTweetBasedTimeline';
import { Queries } from "../Routes";
import { ClientTransaction } from 'x-client-transaction-id';

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
           + `curl: \x1b[90mcurl -X GET "${this._trace.url}" ${Object.entries(this.headers).map(([key, value]) => `-H "${key}: ${value}"`).join(' ')} --compressed\x1b[0m\n`
           + `Headers: \x1b[90m${JSON.stringify(this.headers, null, 2)}\x1b[0m\n`
    }
  };
  transactionGenerator!: ClientTransaction; // Initialized in Client constructor
  constructor(client: Client) {
    this.client = client;
    this.headers = {
      'Authorization': `${this.client.token}`,
      'x-csrf-token': `${this.client.csrfToken}`,
      'Cookie': `${Object.entries(this.client.cookies).map(([key, value]) => `${key}=${value}`).join('; ')}`,
      'content-type': "application/json",
      'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
      'Accept': "*/*",
      'Accept-Language': "en-US",
      'Accept-Encoding': "gzip, deflate",
      'Connection': "close",
      'TE': "trailers",
    }
  }

  async get(url: string, noAuth: boolean = false, noTransaction: boolean = false): Promise<AxiosResponse> {
    return new Promise(async (resolve, reject) => {
      let headers: any = this.headers;
      if(noAuth) delete headers.Authorization;
      if(!noTransaction) headers["x-client-transaction-id"] = await this.transactionGenerator.generateTransactionId('GET', url.replace("https://x.com", "").split('?')[0]);
      Axios({
        method: 'get',
        url: url,
        headers: headers,
      }).then((res) => {
        this.checkForSetCookieHeaders(res.headers);
        resolve(res);
      }).catch((err) => {
        reject(err);
      })
    });
  }

  async post(url: string, data: any, overwriteHeaders?: RawAxiosRequestHeaders, noTransaction: boolean = false): Promise<AxiosResponse> {
    return new Promise(async (resolve, reject) => {
      let headers: any = overwriteHeaders ? {...this.headers, ...overwriteHeaders} : this.headers;
      if(!noTransaction) headers["x-client-transaction-id"] = await this.transactionGenerator.generateTransactionId('POST', url.replace("https://x.com", "").split('?')[0]);
      Axios({
        method: 'post',
        url: url,
        headers: overwriteHeaders ? {...this.headers, ...overwriteHeaders} : this.headers,
        data: data
      }).then((res) => {
        this.checkForSetCookieHeaders(res.headers);
        resolve(res);
      }).catch((err) => {
        reject(err);
      })
    });
  }

  private checkForSetCookieHeaders(headers: RawAxiosResponseHeaders) {
    if(headers['set-cookie']) {
      let setCookies = headers['set-cookie'];
      if(typeof setCookies == 'string') setCookies = [setCookies];
      setCookies.forEach((cookieStr) => {
        let parts = cookieStr.split(';')[0].split('=');
        let key = parts.shift()!.trim();
        let value = parts.join('=').trim();
        this.client.cookies[key] = value;
      });
    }
  }

  async graphQL({
    query,
    variables,
    method = 'get',
    payload,
    fieldToggles
  }: {
    query: Queries,
    variables: BaseTimelineUrlData['variables'] | any,
    method?: 'get' | 'post',
    payload?: any,
    fieldToggles?: {
      [key: string]: boolean
    }
  }): Promise<AxiosResponse> {
    return new Promise((resolve, reject) => {
      let features = this.client.features.get(query.metadata.featureSwitches);
      let url = `https://x.com/i/api/graphql/${query.queryId}/${query.operationName}${method == "get" ? `?variables=${variables.URIEncoded()}&features=${features.URIEncoded()}${fieldToggles ? '&'+encodeURIComponent(JSON.stringify(fieldToggles)) : ''}` : ''}`;
      this._trace.url = url;
      this._trace.time = Date.now();
      this._trace.status = 'pending';

      const onResponse = (res: AxiosResponse) => {
        if(this.client.debug) fs.writeFileSync(`${__dirname}/../../debug/debug-graphql-${this.requestCount++}.json`, JSON.stringify(res.data, null, 2));
        if(res.data.errors) {
          if(this.client.debug) {
            console.error(`GraphQL Error: ${(res.data.errors as Array<any>).map(e => e.message).join(' // ')}`);
            fs.writeFileSync(`${__dirname}/../../debug/debug-graphql-error-${this.errorCount}.json`, JSON.stringify(res.data, null, 2));
            fs.writeFileSync(`${__dirname}/../../debug/debug-graphql-full-${this.errorCount}.txt`, inspect(res, {depth: 10}));
            console.error(`Error written to debug-error-graphql-${this.errorCount++}.json`);
          }
          if(res.data.data) {
            if(this.client.debug) console.warn(`GraphQL Warning: Received errors alongside data: ${(res.data.errors as Array<any>).map(e => e.message).join(' // ')}`);
            resolve(res);
            return;
          }
          if(res.data.errors[0].retry_after !== undefined) {
            if(this.client.debug) console.error(`Retrying after ${res.data.errors[0].retry_after}ms`);
            setTimeout(async () => {
              resolve(await this.graphQL({query, variables, method, payload, fieldToggles}))
            }, res.data.errors[0].retry_after);
          } else reject(res.data.errors);
        } else resolve(res);
      };
      (method == 'get' ? this.get(url) : this.post(url, {
        variables: variables,
        features: features,
        ...payload
      }))
        .then(onResponse).catch((err: AxiosError) => {
          this._trace.status = `${err.response?.statusText} // Code: ${err.code}`
          if(err.response?.status == 503) {
            if(this.client.debug) console.error(`GraphQL Error: 503 Service Unavailable. Retrying in 30000ms.`);
            setTimeout(async () => {
              resolve(await this.graphQL({query, variables, method, payload, fieldToggles}))
            }, 30000);
          } else if((err as AxiosError).code == 'ECONNRESET') {
            if(this.client.debug) console.error(`GraphQL Error: ECONNRESET. Retrying in 30000ms.`);
            setTimeout(async () => {
              resolve(await this.graphQL({query, variables, method, payload, fieldToggles}))
            }, 30000);
          } else reject(err);
        });
    });
  }
}


