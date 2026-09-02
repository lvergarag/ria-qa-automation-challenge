const { By, until, Key } = require('selenium-webdriver');
const config = require('../utils/config');
const { xpathLiteral } = require('../utils/xpath');

class RiaSendMoneyPage {
  constructor(driver) {
    this.driver = driver;

    this.countryDropdownCandidates = [
      By.xpath("//*[normalize-space(.)='Estás enviando a']/following::*[@role='combobox'][1]"),
      By.xpath("//*[normalize-space(.)='Estás enviando a']/following::button[1]"),
      By.xpath("//*[contains(normalize-space(.),'Estás enviando a')]/following::*[self::button or @role='combobox'][1]")
    ];

    this.sendAmountCandidates = [
      By.css('input[analytics-name="send-money-amount-from-amount"]'),
      By.xpath("//*[normalize-space(.)='Envías']/following::input[1]"),
      By.css('input[name="sendAmount"]'),
      By.css('input[inputmode="decimal"]'),
      By.css('input[inputmode="numeric"]')
    ];

    this.receiveCurrencyDropdownCandidates = [
      By.xpath("//*[contains(normalize-space(.),'Los destinatarios reciben')]/following::*[@role='combobox'][1]"),
      By.xpath("//*[contains(normalize-space(.),'Los destinatarios reciben')]/following::button[1]"),
      By.xpath("//*[contains(normalize-space(.),'Los destinatarios reciben')]/following::*[self::button or @role='combobox'][1]")
    ];

    this.receiveAmountCandidates = [
      By.xpath("//*[contains(normalize-space(.),'Los destinatarios reciben')]/following::input[1]"),
      By.css('input[name="receiveAmount"]')
    ];

    this.invalidAmountMessageCandidates = [
      By.css('[role="alert"]'),
      By.css('[aria-live="polite"]'),
      By.css('[aria-live="assertive"]'),
      By.xpath("//*[contains(normalize-space(.),'Ingresa un monto mayor')]"),
      By.xpath("//*[contains(normalize-space(.),'Introduzca un importe vÃ¡lido')]"),
      By.xpath("//*[contains(normalize-space(.),'Enter a valid amount')]"),
      By.xpath("//*[contains(normalize-space(.),'amount greater')]")
    ];

    this.exchangeRateCandidates = [
      By.xpath("//*[contains(normalize-space(.),'1 CLP') and contains(normalize-space(.),'HTG')]"),
      By.xpath("//*[contains(normalize-space(.),'Tarifa')]/following::*[contains(normalize-space(.),'CLP') and contains(normalize-space(.),'HTG')][1]"),
      By.xpath("//*[contains(normalize-space(.),'tipo de cambio') or contains(normalize-space(.),'Tipo de cambio')][1]/following::*[contains(normalize-space(.),'CLP')][1]")
    ];

    this.clpCurrency = By.xpath("//*[normalize-space(.)='CLP']");
    this.htgCurrency = By.xpath("//*[normalize-space(.)='HTG']");
  }

  async findFirstVisible(candidates, timeout = config.timeout) {
    let lastError;

    for (const locator of candidates) {
      try {
        const element = await this.driver.wait(
          until.elementLocated(locator),
          Math.min(timeout, 15000)
        );

        await this.driver.wait(
          until.elementIsVisible(element),
          Math.min(timeout, 15000)
        );

        return element;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error('No se encontró ningún elemento candidato.');
  }

  async waitForPage() {
    await this.driver.wait(async () => {
      const url = (await this.driver.getCurrentUrl()).toLowerCase();
      return url.includes('/send-money');
    }, config.timeout);
  }

  async selectDestinationCountry(country) {
    await this.waitForPage();
    const countryLiteral = xpathLiteral(country);

    const dropdown = await this.findFirstVisible(this.countryDropdownCandidates);

    await this.driver.executeScript(
      "arguments[0].scrollIntoView({block:'center', inline:'center'});",
      dropdown
    );

    try {
      await dropdown.click();
    } catch (_) {
      await this.driver.executeScript("arguments[0].click();", dropdown);
    }

    const optionCandidates = [
      By.xpath(`//*[@role='option' and (contains(normalize-space(.),${countryLiteral}) or contains(normalize-space(.),'Haiti'))]`),
      By.xpath(`//*[self::button or self::li or self::div][contains(normalize-space(.),${countryLiteral}) or contains(normalize-space(.),'Haiti')]`)
    ];

    const option = await this.findFirstVisible(optionCandidates, config.timeout);

    await this.driver.executeScript(
      "arguments[0].scrollIntoView({block:'center', inline:'center'});",
      option
    );

    try {
      await option.click();
    } catch (_) {
      await this.driver.executeScript("arguments[0].click();", option);
    }

    // Solo confirmamos que el país quedó visible. NO esperamos HTG aquí.
    await this.driver.wait(async () => {
      const matches = await this.driver.findElements(
        By.xpath(`//*[contains(normalize-space(.),${countryLiteral}) or contains(normalize-space(.),'Haiti')]`)
      );

      for (const el of matches) {
        try {
          if (await el.isDisplayed()) return true;
        } catch (_) {}
      }
      return false;
    }, config.timeout);
  }

  async enterSendAmount(amount) {
    const input = await this.findFirstVisible(this.sendAmountCandidates);

    await this.driver.executeScript(
      "arguments[0].scrollIntoView({block:'center', inline:'center'});",
      input
    );

    await this.driver.wait(until.elementIsEnabled(input), config.timeout);

    // Intento normal
    await input.click();
    try {
      await input.clear();
    } catch (_) {}

    await input.sendKeys(Key.chord(Key.CONTROL, 'a'));
    await input.sendKeys(Key.BACK_SPACE);
    await input.sendKeys(String(amount));
    await input.sendKeys(Key.TAB);

    let raw = (await input.getAttribute('value')) || '';
    let numericValue = raw.replace(/[^\d]/g, '');

    // Fallback para input controlado por framework
    if (numericValue !== String(amount)) {
      await this.driver.executeScript(
        `
        const el = arguments[0];
        const value = arguments[1];
        const nativeSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
        ).set;

        nativeSetter.call(el, value);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new Event('blur', { bubbles: true }));
        `,
        input,
        String(amount)
      );
    }

    await this.driver.wait(async () => {
      const current = (await input.getAttribute('value')) || '';
      return current.replace(/[^\d]/g, '') === String(amount);
    }, config.timeout);

    console.log(`[RIA] Monto de envío configurado en ${amount} CLP`);
  }

  async getSendAmountValue() {
    const input = await this.findFirstVisible(this.sendAmountCandidates);
    const raw = (await input.getAttribute('value')) || '';
    return raw.replace(/[^\d]/g, '');
  }

  async getInvalidAmountMessage() {
    let lastText = '';

    await this.driver.wait(async () => {
      for (const locator of this.invalidAmountMessageCandidates) {
        const elements = await this.driver.findElements(locator);

        for (const element of elements) {
          try {
            if (!(await element.isDisplayed())) continue;

            const text = (
              (await element.getText()) ||
              (await element.getAttribute('textContent')) ||
              ''
            ).trim();

            if (text) {
              lastText = text;
              return true;
            }
          } catch (_) {}
        }
      }

      return false;
    }, config.timeout);

    return lastText;
  }

  async isSendCurrencyCLP() {
    const elements = await this.driver.findElements(this.clpCurrency);

    for (const element of elements) {
      try {
        if (await element.isDisplayed()) return true;
      } catch (_) {}
    }
    return false;
  }

  async selectReceiveCurrency(currency) {
    const currencyLiteral = xpathLiteral(currency);
    const dropdown = await this.findFirstVisible(this.receiveCurrencyDropdownCandidates);

    await this.driver.executeScript(
      "arguments[0].scrollIntoView({block:'center', inline:'center'});",
      dropdown
    );

    try {
      await dropdown.click();
    } catch (_) {
      await this.driver.executeScript("arguments[0].click();", dropdown);
    }

    const optionCandidates = [
      By.xpath(`//*[@role='option' and contains(normalize-space(.),${currencyLiteral})]`),
      By.xpath(`//*[self::button or self::li or self::div][contains(normalize-space(.),${currencyLiteral})]`)
    ];

    const option = await this.findFirstVisible(optionCandidates, config.timeout);

    try {
      await option.click();
    } catch (_) {
      await this.driver.executeScript("arguments[0].click();", option);
    }

    await this.driver.wait(
      until.elementLocated(this.htgCurrency),
      config.timeout
    );
  }

  async isDestinationCurrencyHTG() {
    const elements = await this.driver.findElements(this.htgCurrency);

    for (const element of elements) {
      try {
        if (await element.isDisplayed()) return true;
      } catch (_) {}
    }
    return false;
  }

  async getReceiveAmountText() {
    try {
      const input = await this.findFirstVisible(this.receiveAmountCandidates, 10000);
      return ((await input.getAttribute('value')) || (await input.getText()) || '').trim();
    } catch (_) {
      const candidates = [
        By.xpath("//*[contains(normalize-space(.),'Los destinatarios reciben')]/following::*[normalize-space(.)!=''][1]"),
        By.xpath("//*[contains(normalize-space(.),'Los destinatarios reciben')]/following::*[contains(normalize-space(.),'HTG')][1]")
      ];
      const value = await this.findFirstVisible(candidates, config.timeout);
      return (await value.getText()).trim();
    }
  }

  normalizeNumericText(rawValue) {
    const value = String(rawValue || '')
      .replace(/\s/g, '')
      .replace(/[^\d,.-]/g, '');

    if (!value) return NaN;

    const lastComma = value.lastIndexOf(',');
    const lastDot = value.lastIndexOf('.');

    if (lastComma >= 0 && lastDot >= 0) {
      const decimalSeparator = lastComma > lastDot ? ',' : '.';
      const thousandSeparator = decimalSeparator === ',' ? '.' : ',';
      const normalized = value
        .split(thousandSeparator).join('')
        .replace(decimalSeparator, '.');
      return Number(normalized);
    }

    const separator = lastComma >= 0 ? ',' : (lastDot >= 0 ? '.' : null);

    if (!separator) return Number(value);

    const parts = value.split(separator);
    const decimals = parts[parts.length - 1];

    if (parts.length === 2 && (value.startsWith('0' + separator) || decimals.length <= 2)) {
      return Number(value.replace(separator, '.'));
    }

    return Number(parts.join(''));
  }

  async getExchangeRateText() {
    for (const locator of this.exchangeRateCandidates) {
      try {
        const elements = await this.driver.findElements(locator);

        for (const element of elements) {
          try {
            if (!(await element.isDisplayed())) continue;

            const text = ((await element.getText()) || '').trim();
            if (!text) continue;

            const compact = text.replace(/\s+/g, ' ');
            const segmentMatch = compact.match(/1\s*CLP\s*=\s*(.*?)\s*HTG/i);

            if (segmentMatch) {
              const numericParts = segmentMatch[1].match(/\d+(?:[.,]\d+)?/g);
              if (numericParts && numericParts.length) {
                return `1 CLP = ${numericParts[numericParts.length - 1]} HTG`;
              }
            }

            if (/CLP/i.test(compact) && /HTG/i.test(compact)) {
              return compact;
            }
          } catch (_) {}
        }
      } catch (_) {}
    }

    // Fallback: revisar el texto visible de la página completa.
    try {
      const bodyText = await this.driver.findElement(By.css('body')).getText();
      const lines = String(bodyText).split(/\r?\n/);

      for (const line of lines) {
        if (!/CLP/i.test(line) || !/HTG/i.test(line)) continue;

        const compact = line.replace(/\s+/g, ' ').trim();
        const segmentMatch = compact.match(/1\s*CLP\s*=\s*(.*?)\s*HTG/i);

        if (segmentMatch) {
          const numericParts = segmentMatch[1].match(/\d+(?:[.,]\d+)?/g);
          if (numericParts && numericParts.length) {
            return `1 CLP = ${numericParts[numericParts.length - 1]} HTG`;
          }
        }
      }
    } catch (_) {}

    return '';
  }

  async getTransferSummary() {
    const sendAmountRaw = await this.getSendAmountValue();
    const receiveAmountRaw = await this.getReceiveAmountText();
    let exchangeRateText = await this.getExchangeRateText();

    // Si la interfaz no expone la tarifa como texto, calculamos la tasa efectiva
    // únicamente a partir de los valores reales mostrados por Ria.
    if (!exchangeRateText) {
      const sendAmount = this.normalizeNumericText(sendAmountRaw);
      const receiveAmount = this.normalizeNumericText(receiveAmountRaw);

      if (
        Number.isFinite(sendAmount) &&
        sendAmount > 0 &&
        Number.isFinite(receiveAmount) &&
        receiveAmount > 0
      ) {
        const calculatedRate = receiveAmount / sendAmount;
        exchangeRateText = `1 CLP = ${calculatedRate.toFixed(6)} HTG (calculado desde los valores mostrados)`;
      }
    }

    return {
      sendAmountCLP: sendAmountRaw,
      exchangeRateHTG: exchangeRateText,
      receiveAmountHTG: receiveAmountRaw
    };
  }

  async logTransferSummary() {
    const summary = await this.getTransferSummary();

    console.log(`[RIA] Monto enviado: ${summary.sendAmountCLP} CLP`);
    console.log(`[RIA] Tipo de cambio: ${summary.exchangeRateHTG || 'No disponible'} `);
    console.log(`[RIA] Monto recibido: ${summary.receiveAmountHTG} HTG`);

    return summary;
  }

  async isConvertedAmountValid() {
    const text = await this.getReceiveAmountText();
    const normalized = String(text)
      .replace(/\s/g, '')
      .replace(/\./g, '')
      .replace(',', '.')
      .replace(/[^0-9.-]/g, '');

    const amount = Number(normalized);
    return Number.isFinite(amount) && amount > 0;
  }
}

module.exports = RiaSendMoneyPage;
