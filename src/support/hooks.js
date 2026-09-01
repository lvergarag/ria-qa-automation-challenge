const {
  Before,
  After,
  BeforeStep,
  AfterStep,
  Status,
  setDefaultTimeout
} = require('@cucumber/cucumber');

const { Builder } = require('selenium-webdriver');
const RiaHomePage = require('../pages/RiaHomePage');
const RiaLoginPage = require('../pages/RiaLoginPage');
const RiaSendMoneyPage = require('../pages/RiaSendMoneyPage');

setDefaultTimeout(2147483647);

Before(async function () {
  this.driver = await new Builder()
    .forBrowser('chrome')
    .build();

  await this.driver.manage().window().maximize();

  this.homePage = new RiaHomePage(this.driver);
  this.loginPage = new RiaLoginPage(this.driver);
  this.sendMoneyPage = new RiaSendMoneyPage(this.driver);
});

BeforeStep(async function () {
  if (this.driver && this.stepDelayMs > 0) {
    await this.driver.sleep(this.stepDelayMs);
  }
});

AfterStep(async function () {
  if (this.driver && this.stepDelayMs > 0) {
    await this.driver.sleep(this.stepDelayMs);
  }
});

After(async function (scenario) {
  if (!this.driver) return;

  if (scenario.result?.status === Status.FAILED) {
    try {
      const image = await this.driver.takeScreenshot();
      await this.attach(Buffer.from(image, 'base64'), 'image/png');
    } catch (_) {}
  }

  await this.driver.quit();
});
