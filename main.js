const puppeteer = require('puppeteer');
const nodemailer = require('nodemailer');
const sendInBlue = require('nodemailer-sendinblue-transport');
const express = require('express');
// const PuppetHelper = require('./puppet-helper').PuppetHelper;
const pm2 = require('pm2');
const Heroku = require('heroku-client')
const heroku = new Heroku({ token: process.env.HEROKU_API_TOKEN })

const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://kadyn:YMZM6XxZAft5QHg@kadyndb.b7mcv.azure.mongodb.net/KadynDB?retryWrites=true&w=majority";
// change it up
async function checkInStock(url, collection) {
    try {
        const browser = await puppeteer.launch({headless: true, args: ['--no-sandbox']});
        // const page1 = await browser.newPage();
        const page2 = await browser.newPage();
        await page2.setViewport({ width: 1600, height: 900 });
        await page2.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36');

        // First give https://alaskankleekaicoloradoice.com/ some traffic
        // try {
        //     await page1.goto("https://kadynmarshall.com", { waitUntil: 'networkidle2' });
        //     await page1.waitForSelector("body > main > a");
        //     await page1.click("body > main > a");
        //     await wait(400);
        //     await page1.goto("https://west-elizabeth.com", { waitUntil: 'networkidle2' });
        //     await page1.waitForSelector("body > a");
        //     await page1.click("body > a");
        //     await wait(400);
        //     await page1.waitForSelector("#e63bdb32-60e4-4372-ba27-8557c5799e49 > div > div > section > div > div.x-el.x-el-div.c1-1.c1-2.c1-18.c1-19.c1-1a.c1-1b.c1-1c.c1-29.c1-2a.c1-13.c1-t.c1-i.c1-j.c1-k.c1-l.c1-2b.c1-2c.c1-2d.c1-m.c1-14.c1-n.c1-o.c1-p > div.x-el.x-el-div.c1-1.c1-2.c1-18.c1-19.c1-1a.c1-1b.c1-1c.c1-t.c1-38.c1-39.c1-3a.c1-i.c1-j.c1-3b.c1-3c.c1-3d.c1-1g.c1-m.c1-1h.c1-n.c1-1i.c1-o.c1-1j.c1-p > div > div > div > div > div:nth-child(3) > a");
        //     await page1.click("#e63bdb32-60e4-4372-ba27-8557c5799e49 > div > div > section > div > div.x-el.x-el-div.c1-1.c1-2.c1-18.c1-19.c1-1a.c1-1b.c1-1c.c1-29.c1-2a.c1-13.c1-t.c1-i.c1-j.c1-k.c1-l.c1-2b.c1-2c.c1-2d.c1-m.c1-14.c1-n.c1-o.c1-p > div.x-el.x-el-div.c1-1.c1-2.c1-18.c1-19.c1-1a.c1-1b.c1-1c.c1-t.c1-38.c1-39.c1-3a.c1-i.c1-j.c1-3b.c1-3c.c1-3d.c1-1g.c1-m.c1-1h.c1-n.c1-1i.c1-o.c1-1j.c1-p > div > div > div > div > div:nth-child(3) > a");
        //     await wait(200);
        // } catch (error) {
        //     console.log(error);
        // }
        // page1.close();

        await page2.goto(url, { waitUntil: 'networkidle2' });
        // const puppetHelper = new PuppetHelper(page);

        // await login(page, puppetHelper);

        await page2.waitForSelector('#addToCartSubmit');
        await page2.waitForSelector('#productName');
        await wait(2000);
        let [addToCartButton] = await page2.$x('//*[@id="addToCartSubmit"]');
        let [productNameElement] = await page2.$x('//*[@id="productName"]');
        let documentText = await page2.evaluate(() => document.body.outerHTML);
        let stockStatus = documentText.match(/data-pv-product-stock-status="(\W|\w)+"/i)[0].match(/outstock|instock/)[0];
        let buttonText = await page2.evaluate(el => el.textContent, addToCartButton);
        let productName = await page2.evaluate(el => el.textContent, productNameElement);
        let now = new Date();

        // Update refreshCount
        res = await collection.findOne({});
        refreshCount = res.count + 1;
        collection.updateOne({}, {$set: {count: refreshCount}});
        
        if (buttonText.trim() === 'Place in Cart' && stockStatus === 'instock') {
            console.log('In stock - ' + now.toUTCString());
            await page2.screenshot({path: './screenshot.png'});
            sendEmails(url, productName, refreshCount);
        } else {
            console.log('Out of stock -- ' + now.toUTCString() + " -- Refresh count: " + refreshCount);
            // setTimeout(() => checkInStock(url), 15000)
        }

        await page2.close();
        await browser.close();
    } catch (error) {
        console.log(error);
        heroku.request({
            method: 'DELETE',
            path: '/apps/lv-stock-monitor/dynos',
            headers: {
                'Content-Type': 'application/json',
                "Accept": "application/vnd.heroku+json; version=3"
            }
            }).then(response => {
            console.log("How am I still here?")
            exit()
        })
    }
}

async function login(page, puppetHelper) {
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36');
    await page.goto('https://secure.louisvuitton.com/eng-us/mylv/orders', { waitUntil: 'networkidle2' });

    let bodyHTML = await page.evaluate(() => document.body.innerHTML);
    await page.waitForSelector('#loginloginForm');
    await wait(2000);
    await puppetHelper.enterText('#loginloginForm', 'kadynm49@gmail.com');
    await wait(500);
    await puppetHelper.enterText('#passwordloginForm', 'ro2#8yf8DuiN');
    await wait(500);
    await page.evaluate((selector) => document.querySelector(selector).click(), '#loginSubmit_'); 
    await page.screenshot({path: './screenshot.png'});
    process.exit(1);
}

function sendEmails(url, productName, refreshCount) {
    // Set up smtp server info
    const transporter = nodemailer.createTransport(sendInBlue({apiKey: 'w1PgYD09MVTcfL4j'}));

    const message1 = createMessage('<westcelizabeth@gmail.com>', productName, url, refreshCount);
    const message2 = createMessage('<2062938550@vtext.com>', productName, url, refreshCount);
    const message3 = createMessage('<kadynm49@gmail.com>', productName, url, refreshCount);
    const message4 = createMessage('<2068190875@vtext.com>', productName, url, refreshCount);

    sendEmail(transporter, message1);
    sendEmail(transporter, message2);
    sendEmail(transporter, message3);
    sendEmail(transporter, message4);
}

function sendEmail(transporter, message) {
    transporter.sendMail(message, (err) => {
        if (err) {
            console.log('Error occurred while attempting to send email\n' + message + '\n' + err.message);
        }
    });
}

function createMessage(recipient, productName, url, refreshCount) {
    try {
        return {
            from: '<kadynm49@gmail.com>',
            to: recipient,
            subject: productName + ' IS NOW AVAILABLE!!!',
            text: 'Go buy it! \n\n' + url + '\n\nLove,\nKadyn\n\nNumber of page refreshes: ' + refreshCount,
            attachments: [
                {
                    filename: 'screenshot.png',
                    path: './screenshot.png'
                }
            ]
        };
    } catch (error) {
        return {
            from: '<kadynm49@gmail.com>',
            to: recipient,
            subject: productName + ' IS NOW AVAILABLE!!!',
            text: 'Go buy it! \n\n' + url + '\n\nLove,\nKadyn'
        };
    }
}

const app = express();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`This app is running on port ${ PORT }`);
});

function wait(time) {
    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            resolve();
        }, time);
    });
}

(async () => {
    const client = new MongoClient(uri, { useNewUrlParser: true , useUnifiedTopology: true});
    client.connect(async err => {
        const collection = client.db("lv-stock-monitor").collection("refreshCount");
        while (true) {
            try {
                await wait(10000);
                await checkInStock('https://us.louisvuitton.com/eng-us/products/mini-pochette-accessoires-damier-ebene-001035', collection);
            } catch (error) {
                console.log(error);
            }
        }
    });
})()

// https://us.louisvuitton.com/eng-us/products/mini-pochette-accessoires-damier-ebene-001035
// https://us.louisvuitton.com/eng-us/products/voguez-volez-voyagez-paperweight-monogram-metal-nvprod1250322v
