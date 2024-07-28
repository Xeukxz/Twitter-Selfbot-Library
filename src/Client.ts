import EventEmitter from "node:events";
import { TimelineManager } from "./Managers/TimelineManager";
import { RESTApiManager } from "./REST/rest";
import puppeteer, { PuppeteerLaunchOptions } from "puppeteer";
import fs from "fs";
import { Timeline } from "./Timelines";
import { ProfileManager } from "./Managers/ProfileManager";
import { Profile } from "./Profile";
import child_process from "child_process";

export interface ClientParams {
  headless?: boolean;
  keepPageOpen?: boolean;
  debug?: boolean;
  puppeteerSettings?: PuppeteerLaunchOptions;
}

export interface ClientEvents {
  ready: void;
  timelineCreate: Timeline;
  profileCreate: Profile;
}


export class Client extends EventEmitter<Record<keyof ClientEvents, any>> {
  token!: string
  csrfToken!: string
  cookies!: string
  rest!: RESTApiManager
  timelines: TimelineManager = new TimelineManager(this)
  profiles: ProfileManager = new ProfileManager(this)
  debug: boolean // writes multiple debug files, not recommended for production
  features!: {
    config: {
      [key: string]: {
        value: boolean | string | number | any[]
      }
    },
    impression_pointers: {},
    impressions: {},
    keysRead: {},
    settingsVersion: string,
    get: <T extends string[]>(keys: string[]) => FeaturesGetData<T>
  }
  /**
   * Create a new client
   * @param headless Whether or not to run the browser in headless mode
   * 
   */
  constructor({
    headless = true,
    keepPageOpen = false,
    debug = false,
    puppeteerSettings
  }: ClientParams) {
    super();
    this.debug = debug; // ! DEVELOPMENT ONLY
    this.getAccountData({
      headless,
      keepPageOpen,
      puppeteerSettings
    }).then(() => {
      // console.log("Got account data.");
      this.rest = new RESTApiManager(this);
      this.emit("ready");
    })
  }

  // no idea what this was supposed to do 💀
  async build() {

  }

  async getAccountData({
    headless,
    keepPageOpen,
    puppeteerSettings
  }: ClientParams) {
    return new Promise<void>(async (resolve, reject) => {

      if(this.debug) {
        // ensure debug folder exists
        if (!fs.existsSync(`${__dirname}/../debug`)) {
          fs.mkdirSync(`${__dirname}/../debug`);
          console.log("Debug folder created.");
        }
      }

      // ensure storage file exists
      if (!fs.existsSync(`${__dirname}/../accountData.json`)) {
        fs.writeFileSync(`${__dirname}/../accountData.json`, "{}");
        console.log("Account data file created.");
      }
      let storedData = fs.readFileSync(`${__dirname}/../accountData.json`, "utf-8")
      if(storedData == "") storedData = "{}"
      let parsedStoredData = JSON.parse(storedData);
      
      if(Object.keys(parsedStoredData?.cookies ?? parsedStoredData).length > 0) {
        if(this.debug) console.log("Found stored account data.");
      } else {
        if(this.debug) console.log("No stored account data found.");
        headless = false;
      }
      
      // Launch the browser and open a new blank page
      if(this.debug) console.log(headless ? "Running in headless mode." : "Running in non-headless mode.")
      if(this.debug) console.log(keepPageOpen ? "Keeping browser open after getting account data." : "Closing browser after getting account data.")
      const browser = await puppeteer.launch({
        headless: headless,
        ...puppeteerSettings
      });

      browser.on('disconnected', async () => {
        if(parsedStoredData?.cookies) this.debug ? console.log('Browser has been disconnected, The client will continue running.') : null;
        else {
          await browser.close();
          browser.process()?.kill()
          throw new Error('Account data not found.')
        }
      });
      
      const page = await browser.newPage();
      // if stored data is an empty object
      if (Object.keys(parsedStoredData?.cookies ?? parsedStoredData)?.length > 0)
        await page.setCookie(...parsedStoredData.cookies);
      else {
        await page.setViewport({ width: 1080, height: 1024 });
        console.log("Please login to the account you wish to automate.");
      }


      // Navigate the page to a URL
      await page.goto("https://twitter.com/home");

      const html = await page.content();
      
      let featuresString = `${html.match(/"user":\{"config".+?,"debug"/)![0].replace(`,"debug"`, "").replace(`"user":`, "")}`
      this.features = {
        ...JSON.parse(featuresString),
        get: <T extends string[]>(keys: string[]): FeaturesGetData<T> => { //  jesus fucking christ
          return {
            ...Object.fromEntries(keys.map(key => [key, this.features.config[key].value])),
            URIEncoded: function() {
              return encodeURIComponent(JSON.stringify(this))
            }
          } as FeaturesGetData<T>;
        }
      }

      // Set screen size
      if (!headless) await page.setViewport({ width: 1080, height: 1024 });

      let gotData = false;

      page.on("request", async (request) => {
        if (gotData) return;
        // console.log(request.url());
        let headers = request.headers();
        // find the request with the authorization header
        let token = headers[`authorization`];
        let csrftoken = headers[`x-csrf-token`];
        // if(csrftoken) console.log(headers)
        // console.log(token, csrftoken);
        if (token && csrftoken) {
          gotData = true;
          // console.log(token);
          let cookies = await page.cookies();
          let cookiesString = cookies
            .map((cookie) => `${cookie.name}=${cookie.value}`)
            .join("; ");
          parsedStoredData = {
            Authorisation: token,
            "x-csrf-token": csrftoken,
            cookies: cookies,
            cookiesString: cookiesString,
          };
          fs.writeFileSync(
            `${__dirname}/../accountData.json`,
            JSON.stringify(parsedStoredData, null, 2)
          );
          // fs.writeFileSync('cookies.json', JSON.stringify(cookies))
          // console.log(cookies, cookiesString);
          page.off("request");
          if(this.debug) console.log(
            `Got account data. ${
              keepPageOpen ? "Keeping browser open." : "Closing browser."
            }`
          );
          if (!keepPageOpen) {
            if(this.debug) console.log("Closing browser.");
            if(!page.isClosed()) await page.close()
            await browser.close();
            if(this.debug) console.log("Browser closed.");
          }
          this.token = token;
          this.csrfToken = csrftoken;
          this.cookies = cookiesString;
          resolve();
        }
      });
    });
  }
}

export type FeaturesGetData<T extends string[]> = Record<T[number], boolean | string | number | any[]> & {
  URIEncoded: () => string;
};