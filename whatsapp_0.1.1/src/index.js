const puppeteer = require('puppeteer-core');
const _cliProgress = require('cli-progress');
require("./welcome");
var spinner = require("./step");
var utils = require("./utils");
var qrcode = require('qrcode-terminal');
var path = require("path");
var argv = require('yargs').argv;
var rev = require("./detectRev");
var constants = require("./constants");
var configs = require("../bot");
var bodyParser = require('body-parser')
var app = require('express')()
const cors = require('cors');

async function Main() {

    try {
        var page;
        await downloadAndStartThings();
        var isLogin = await checkLogin();
        if (!isLogin) {
            await getAndShowQR();
        }
        if (configs.smartreply.suggestions.length >= 0) {
            await setupSmartReply();
        }
        app.use(cors());
        app.use(bodyParser.urlencoded({ extended: false }))
        app.use(bodyParser.json())
        app.post('/message',(request,response)=>{
            var date = new Date(request.body.timestamp*1000)
            var hours = date.getHours();
            var minutes = "0" + date.getMinutes();
            var seconds = "0" + date.getSeconds();
            var formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
            console.log(formattedTime);     
            response.send("Mensagem Recebida");
        })
        app.listen(80,()=>console.log('Server Online'))
        console.log("WBOT is ready !! Let those message come.");
    } catch (e) {
        console.error("Looks like you got an error." + e);
        page.screenshot({ path: path.join(process.cwd(), "error.png") })
        console.warn(e);
        throw e;
    }

    /**
     * If local chrome is not there then this function will download it first. then use it for automation. 
     */
 

    async function downloadAndStartThings() {
        let botjson = utils.externalInjection("bot.json");
        var appconfig = await utils.externalInjection("bot.json");
        appconfig = JSON.parse(appconfig);
        spinner.start("Downloading chrome\n");
        const browserFetcher = puppeteer.createBrowserFetcher({
            path: process.cwd()
        });
        const progressBar = new _cliProgress.Bar({}, _cliProgress.Presets.shades_grey);
        progressBar.start(100, 0);
        var revNumber = await rev.getRevNumber();
        const revisionInfo = await browserFetcher.download(revNumber, (download, total) => {
            var percentage = (download * 100) / total;
            progressBar.update(percentage);
        });
        progressBar.update(100);
        spinner.stop("Downloading chrome ... done!");
        spinner.start("Launching Chrome");
        var pptrArgv = [];
        if (argv.proxyURI) {
            pptrArgv.push('--proxy-server=' + argv.proxyURI);
        }
        const extraArguments = Object.assign({});
        extraArguments.userDataDir = constants.DEFAULT_DATA_DIR;
        const browser = await puppeteer.launch({
            executablePath: revisionInfo.executablePath,
            headless: appconfig.appconfig.headless,
            userDataDir: path.join(process.cwd(), "ChromeSession"),
            devtools: false,
            args: [...constants.DEFAULT_CHROMIUM_ARGS, ...pptrArgv], ...extraArguments
        });
        spinner.stop("Launching Chrome ... done!");
        if (argv.proxyURI) {
            spinner.info("Using a Proxy Server");
        }
        spinner.start("Opening Whatsapp");
        page = await browser.pages();
        if (page.length > 0) {
            page = page[0];
            page.setBypassCSP(true)
            if (argv.proxyURI) {
                await page.authenticate({ username: argv.username, password: argv.password });
            }
            page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36");
            await page.goto('https://web.whatsapp.com', {
                waitUntil: 'networkidle0',
                timeout: 0
            });
            if (appconfig.appconfig.darkmode) {
                page.addStyleTag({ path: path.join(__dirname, "style.css") });
            }
            
            var filepath = path.join(__dirname, "WAPI.js");
            await page.addScriptTag({ path: require.resolve(filepath) });
            filepath = path.join(__dirname, "inject.js");
            await page.addScriptTag({ path: require.resolve(filepath) });
            
            botjson.then((data) => {
                page.evaluate("var intents = " + data);
            }).catch((err) => {
                console.log("there was an error \n" + err);
            });
            spinner.stop("Opening Whatsapp ... done!");
            page.exposeFunction("log", (message) => {
                console.log(message);
            })
            page.exposeFunction("getFile", utils.getFileInBase64);
        }
    }

    async function checkLogin() {
        spinner.start("Page is loading");
        //TODO: avoid using delay and make it in a way that it would react to the event. 
        await utils.delay(10000);
        var output = await page.evaluate("localStorage['last-wid']");
        if (output) {
            spinner.stop("Looks like you are already logged in");
        } else {
            spinner.info("You are not logged in. Please scan the QR below");
        }
        return output;
    }

    //TODO: add logic to refresh QR.
    async function getAndShowQR() {
        //TODO: avoid using delay and make it in a way that it would react to the event. 
        //await utils.delay(10000);
        await page.waitForSelector("img[alt='Scan me!']");
        var imageData = await page.evaluate(`document.querySelector("img[alt='Scan me!']").parentElement.getAttribute("data-ref")`);
        qrcode.generate(imageData, { small: true });
        spinner.start("Waiting for scan \nKeep in mind that it will expire after few seconds");
        var isLoggedIn = await page.evaluate("WAPI.isLoggedIn();");
        while (!isLoggedIn) {
            //TODO: avoid using delay and make it in a way that it would react to the event. 
            await utils.delay(300);
            isLoggedIn = await page.evaluate("WAPI.isLoggedIn();");
        }
        if (isLoggedIn) {
            spinner.stop("Looks like you are logged in now");
        }
    }

    async function setupSmartReply() {
        spinner.start("setting up smart reply");
        await page.waitForSelector(".app");
        await page.evaluate(`
            var observer = new MutationObserver((mutations) => {
                for (var mutation of mutations) {
                    console.log(mutation);
                    if (mutation.addedNodes.length && mutation.addedNodes[0].id === 'main') {
                        //newChat(mutation.addedNodes[0].querySelector('.copyable-text span').innerText);
                        console.log("%cChat changed !!", "font-size:x-large");
                        WAPI.addOptions();
                    }
                }
            });
            observer.observe(document.querySelector('.app'), { attributes: false, childList: true, subtree: true });
        `);
        spinner.stop("setting up smart reply ... done!");
        page.waitForSelector("#main", { timeout: 0 }).then(async () => {
            await page.exposeFunction("sendMessage", async message => {
                return new Promise(async (resolve, reject) => {
                    //send message to the currently open chat using power of puppeteer 
                    await page.type("div.selectable-text[data-tab]", message);
                    if (configs.smartreply.clicktosend) {
                        await page.click("#main > footer > div.copyable-area > div:nth-child(3) > button");
                    }
                });
            });
        });
    }
}

Main();