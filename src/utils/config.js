require('dotenv').config();

module.exports = {
  sendAmountCLP: 25000,
  homeUrl: 'https://www.riamoneytransfer.com/',
  secureLoginUrl: 'https://secure.riamoneytransfer.com/login',
  secureBaseUrl: 'https://secure.riamoneytransfer.com/',
  timeout: 60000,
  otpTimeout: null,
  stepDelayMs: 2000,
  email: process.env.RIA_EMAIL,
  password: process.env.RIA_PASSWORD
};
