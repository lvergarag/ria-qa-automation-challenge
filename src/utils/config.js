require('dotenv').config();

function getPositiveNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const otpTimeout = getPositiveNumber(process.env.RIA_OTP_TIMEOUT_MS, 600000);

module.exports = {
  sendAmountCLP: 25000,
  homeUrl: 'https://www.riamoneytransfer.com/en-cl/',
  secureLoginUrl: 'https://secure.riamoneytransfer.com/login',
  secureBaseUrl: 'https://secure.riamoneytransfer.com/',
  timeout: 60000,
  otpTimeout,
  stepDelayMs: 2000,
  email: process.env.RIA_EMAIL,
  password: process.env.RIA_PASSWORD
};
