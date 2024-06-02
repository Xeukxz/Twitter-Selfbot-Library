import EventEmitter from "node:events";
import { TimelineManager } from "./Timelines/TimelineManager";
import { RESTApiManager } from "./REST/rest";
import puppeteer from "puppeteer";
import fs from "fs";
import { Timeline } from "./Timelines";

export interface ClientParams {
  headless: boolean;
  keepPageOpen?: boolean;
  debug?: boolean;
}

export interface ClientEvents {
  ready: void;
  timelineCreate: Timeline;
}


export class Client extends EventEmitter<Record<keyof ClientEvents, any>> {
  timelines: TimelineManager = new TimelineManager(this)
  token!: string
  csrfToken!: string
  cookies!: string
  rest!: RESTApiManager
  debug: boolean // writes multiple debug files, not recommended for production
  
  /**
   * Create a new client
   * @param headless Whether or not to run the browser in headless mode
   * @param keepPageOpen Whether or not to keep the browser open after getting the account data
   * 
   */
  constructor({
    headless = true,
    keepPageOpen = false,
    debug = false,
  }: ClientParams) {
    super();
    this.debug = debug; // ! DEVELOPMENT ONLY
    this.getAccountData({
      headless,
      keepPageOpen,
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
  }: ClientParams) {
    return new Promise<void>(async (resolve, reject) => {

      if(this.debug) {
        // ensure debug folder exists
        if (!fs.existsSync(`${__dirname}\\..\\debug`)) {
          fs.mkdirSync(`${__dirname}\\..\\debug`);
          console.log("Debug folder created.");
        }
      }

      // ensure storage file exists
      if (!fs.existsSync(`${__dirname}\\..\\accountData.json`)) {
        fs.writeFileSync(`${__dirname}\\..\\accountData.json`, "{}");
        console.log("Account data file created.");
      }
      let storedData = JSON.parse(
        fs.readFileSync(`${__dirname}\\..\\accountData.json`, "utf-8")
      );

      // Launch the browser and open a new blank page
      console.log(headless ? "Running in headless mode." : "Running in non-headless mode.")
      console.log(keepPageOpen ? "Keeping browser open after getting account data." : "Closing browser after getting account data.")
      const browser = await puppeteer.launch({
        headless: Object.keys(storedData?.cookies ?? storedData)?.length > 0 ? headless : false,
      });

      browser.on('disconnected', async () => {
        if(storedData?.cookies) console.log('Browser has been disconnected, The client will continue running.');
        else {
          console.log('Browser has been disconnected, Account information has not been gathered. Exiting...');
          await browser.close();
          process.exit(1);
        }
      });
      
      const page = await browser.newPage();
      // if stored data is an empty object
      if (Object.keys(storedData?.cookies ?? storedData)?.length > 0)
        await page.setCookie(...storedData.cookies);
      else {
        await page.setViewport({ width: 1080, height: 1024 });
        console.log("Please login to the account you wish to automate.");
      }

      // if(storedCookies && storedCookies.length > 0)

      // Navigate the page to a URL
      await page.goto("https://twitter.com/home");

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
          storedData = {
            Authorisation: token,
            "x-csrf-token": csrftoken,
            cookies: cookies,
            cookiesString: cookiesString,
          };
          fs.writeFileSync(
            `${__dirname}\\..\\accountData.json`,
            JSON.stringify(storedData, null, 2)
          );
          // fs.writeFileSync('cookies.json', JSON.stringify(cookies))
          // console.log(cookies, cookiesString);
          page.off("request");
          console.log(
            `Got account data. ${
              keepPageOpen ? "Keeping browser open." : "Closing browser."
            }`
          );
          if (!keepPageOpen) await browser.close();
          this.token = token;
          this.csrfToken = csrftoken;
          this.cookies = cookiesString;
          resolve();
        }
      });
    });
  }
}