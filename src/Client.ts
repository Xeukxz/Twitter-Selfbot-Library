import EventEmitter from "events";
import { TimelineManager } from "./Timelines/TimelineManager";
import { RESTApiManager } from "./REST/rest";
import puppeteer from "puppeteer";
import fs from "fs";

export interface ClientParams {
  headless?: boolean | "new";
  keepPageOpen?: boolean;
}

export class Client extends EventEmitter {
  timelines: TimelineManager = new TimelineManager(this)
  token!: string
  csrfToken!: string
  cookies!: string
  rest!: RESTApiManager
  
  /**
   * Create a new client
   * @param headless Whether or not to run the browser in headless mode
   * @param keepPageOpen Whether or not to keep the browser open after getting the account data
   * 
   */
  constructor({
    headless = "new",
    keepPageOpen = false,
  }: ClientParams) {
    super();
    this.getAccountData({
      headless,
      keepPageOpen,
    }).then(() => {
      // console.log("Got account data.");
      this.rest = new RESTApiManager(this);
      this.emit("ready");
    })
  }

  async build() {

  }

  async getAccountData({
    headless,
    keepPageOpen,
  }: ClientParams) {
    return new Promise<void>(async (resolve, reject) => {
      // Launch the browser and open a new blank page
      const browser = await puppeteer.launch({
        headless: headless,
      });

      browser.on('disconnected', () => {
        console.log('Browser disconnected, but program continues running...');
        // Here you can handle the disconnection, for example by launching a new browser
        // browser = await puppeteer.launch();
      });
      
      const page = await browser.newPage();
      let storedData = JSON.parse(
        fs.readFileSync(`${__dirname}\\..\\accountData.json`, "utf-8")
      );
      // if stored data is an empty object
      if (Object.keys(storedData?.cookies)?.length > 0)
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
          fs.writeFileSync(
            `${__dirname}\\..\\accountData.json`,
            JSON.stringify({
              Authorisation: token,
              "x-csrf-token": csrftoken,
              cookies: cookies,
              cookiesString: cookiesString,
            }, null, 2)
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