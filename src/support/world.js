const { setWorldConstructor } = require('@cucumber/cucumber');
const config = require('../utils/config');

class CustomWorld {
  constructor({ attach, log, parameters }) {
    this.attach = attach;
    this.log = log;
    this.parameters = parameters;

    this.driver = null;
    this.homePage = null;
    this.loginPage = null;
    this.sendMoneyPage = null;

    this.initialReceiveAmount = null;
    this.convertedAmount = null;
    this.transferSummary = null;
    this.stepDelayMs = config.stepDelayMs;
  }
}

setWorldConstructor(CustomWorld);
