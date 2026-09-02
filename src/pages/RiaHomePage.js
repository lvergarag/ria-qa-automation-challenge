const { By, until, Key } = require('selenium-webdriver');
const config = require('../utils/config');
const { xpathLiteral } = require('../utils/xpath');

class RiaHomePage {
  constructor(driver) {
    this.driver = driver;

    this.startTransferLink = By.xpath(
      "//a[normalize-space(.)='Start your transfer' or normalize-space(.)='Start your Transfer']"
    );

    this.sendAmountCandidates = [
      By.css('input[aria-label="You send"]'),
      By.css('input[aria-label="Envías"]'),
      By.css('input[name="sendAmount"]'),
      By.xpath("//input[contains(@aria-label,'Amount') or contains(@aria-label,'Importe') or contains(@aria-label,'send') or contains(@aria-label,'env')]")
    ];

    this.receiveAmountCandidates = [
      By.css('input[aria-label="They receive"]'),
      By.css('input[aria-label="Reciben"]'),
      By.css('input[name="receiveAmount"]'),
      By.xpath("//input[contains(@aria-label,'Receive') or contains(@aria-label,'Reciben') or contains(@aria-label,'receive')]")
    ];

    this.countryDropdownCandidates = [
      By.css('button[aria-label="Select Destination"]'),
      By.css('[data-testid="country-select-dropdown"]'),
      By.xpath("//*[@role='combobox' and (contains(.,'Send to') or contains(.,'Enviar a'))]")
    ];

    this.htgCurrencyOptionCandidates = [
      By.xpath("//*[@role='option' and contains(normalize-space(.),'HTG')]"),
      By.xpath("//*[@role='menuitem' and contains(normalize-space(.),'HTG')]"),
      By.xpath("//*[self::button or self::li][contains(normalize-space(.),'HTG')]"),
      By.xpath("//*[self::div and (@role='option' or @role='menuitem')][contains(normalize-space(.),'HTG')]")
    ];

    this.invalidAmountError = By.xpath(
      "//*[contains(normalize-space(.),'Introduzca un importe válido') " +
      "or contains(normalize-space(.),'Enter a valid amount') " +
      "or contains(normalize-space(.),'Enter an amount between')]"
    );
  }

  async open() {
    await this.driver.get(config.homeUrl);
  }

  async findFirstVisible(candidates, timeout = config.timeout) {
    let lastError;
    for (const locator of candidates) {
      try {
        const element = await this.driver.wait(async () => {
          const elements = await this.driver.findElements(locator);

          for (const candidate of elements) {
            try {
              if (await candidate.isDisplayed()) {
                return candidate;
              }
            } catch (_) {}
          }

          return false;
        }, Math.min(timeout, 10000));

        return element;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error('No se encontró ningún elemento candidato.');
  }

  async clickStartTransfer() {
    const link = await this.driver.wait(
      until.elementLocated(this.startTransferLink),
      config.timeout
    );
    await this.driver.wait(until.elementIsVisible(link), config.timeout);
    await this.driver.executeScript(
      "arguments[0].scrollIntoView({block:'center'});",
      link
    );
    await link.click();
  }

  async getOriginCurrency() {
    const candidates = [
      By.xpath("//*[normalize-space(.)='CLP']"),
      By.xpath("//*[contains(normalize-space(.),'CLP')]")
    ];

    const element = await this.findFirstVisible(candidates);
    return (await element.getText()).trim();
  }

  async getDestinationCurrency() {
    const candidates = [
      By.xpath("//button[@aria-label='Select Destination' and contains(normalize-space(.),'HTG')]"),
      By.xpath("//*[normalize-space(.)='HTG']"),
      By.xpath("//*[@role='option' and contains(normalize-space(.),'HTG')]")
    ];

    const element = await this.findFirstVisible(candidates);
    return (await element.getText()).trim();
  }

  async isDestinationButtonCurrency(currency) {
    const buttons = await this.driver.findElements(
      By.css('button[aria-label="Select Destination"]')
    );

    for (const button of buttons) {
      try {
        const text = await button.getText();
        if ((await button.isDisplayed()) && text.includes(currency)) {
          return true;
        }
      } catch (_) {}
    }

    return false;
  }

  async clickElement(element) {
    await this.driver.executeScript(
      "arguments[0].scrollIntoView({block:'center', inline:'center'});",
      element
    );

    await this.driver.sleep(300);

    try {
      await element.click();
    } catch (_) {
      await this.driver.executeScript("arguments[0].click();", element);
    }
  }

  async isConvertedAmountValid() {
    const raw = await this.getReceiveAmount();
    const normalized = String(raw || '')
      .replace(/\s/g, '')
      .replace(/\./g, '')
      .replace(',', '.')
      .replace(/[^0-9.-]/g, '');

    const amount = Number(normalized);

    return Number.isFinite(amount) && amount > 0;
  }

  async enterInvalidAmount(value) {
    const input = await this.findFirstVisible(this.sendAmountCandidates);
    await input.clear();
    await input.sendKeys(value, Key.TAB);
  }

  async isInvalidAmountMessageVisible() {
    await this.driver.wait(async () => {
      const errors = await this.driver.findElements(this.invalidAmountError);

      for (const error of errors) {
        try {
          const text = (
            (await error.getText()) ||
            (await error.getAttribute('textContent')) ||
            ''
          ).trim();

          if ((await error.isDisplayed()) && text) {
            return true;
          }
        } catch (_) {}
      }

      return false;
    }, config.timeout);

    return true;
  }

  async selectDestinationCountry(country) {
    const dropdown = await this.findFirstVisible(this.countryDropdownCandidates);
    await dropdown.click();
    const countryLiteral = xpathLiteral(country);

    const option = By.xpath(
      `//*[@role='option' and (contains(normalize-space(.),${countryLiteral}) or contains(normalize-space(.),'Haiti'))]`
    );

    const element = await this.driver.wait(
      until.elementLocated(option),
      config.timeout
    );
    await this.driver.wait(until.elementIsVisible(element), config.timeout);
    await this.clickElement(element);

    if (country === 'Haití' || country === 'Haiti') {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const htgOption = await this.findFirstVisible(this.htgCurrencyOptionCandidates);
        await this.clickElement(htgOption);

        await this.driver.sleep(1000);

        if (await this.isDestinationButtonCurrency('HTG')) {
          break;
        }
      }
    }

    await this.driver.wait(async () => {
      return await this.isDestinationButtonCurrency('HTG');
    }, config.timeout);
  }

  async getReceiveAmount() {
    return await this.getCurrentReceiveAmount();
  }

  async getCurrentReceiveAmount() {
    const input = await this.findFirstVisible(this.receiveAmountCandidates);
    return (await input.getAttribute('value')) || (await input.getText());
  }

  async enterSendAmount(amount) {
    const input = await this.findFirstVisible(this.sendAmountCandidates);
    await input.clear();
    await input.sendKeys(String(amount), Key.TAB);
  }

  async waitForConversion(previousValue) {
    let convertedAmount = '';

    await this.driver.wait(async () => {
      const current = await this.getCurrentReceiveAmount();
      convertedAmount = current;

      return current &&
        current.trim() !== '' &&
        current.trim() !== '0' &&
        current !== previousValue;
    }, config.timeout);

    return convertedAmount;
  }
}

module.exports = RiaHomePage;
