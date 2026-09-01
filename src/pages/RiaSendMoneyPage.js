const { By, until, Key } = require('selenium-webdriver');
const config = require('../utils/config');

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
      By.xpath(`//*[@role='option' and (contains(normalize-space(.),'${country}') or contains(normalize-space(.),'Haiti'))]`),
      By.xpath(`//*[self::button or self::li or self::div][contains(normalize-space(.),'${country}') or contains(normalize-space(.),'Haiti')]`)
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
        By.xpath(`//*[contains(normalize-space(.),'${country}') or contains(normalize-space(.),'Haiti')]`)
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
      By.xpath(`//*[@role='option' and contains(normalize-space(.),'${currency}')]`),
      By.xpath(`//*[self::button or self::li or self::div][contains(normalize-space(.),'${currency}')]`)
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
