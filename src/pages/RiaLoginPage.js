const { By, until } = require('selenium-webdriver');
const config = require('../utils/config');

class RiaLoginPage {
  constructor(driver) {
    this.driver = driver;

    this.allowAllCookiesButton = By.css(
      'button[analytics-name="consent-manager-allow-all-cookies"]'
    );

    this.cookieDialog = By.css(
      'div.ria-gdpr-consent-manager-dialog'
    );

    this.emailCandidates = [
      By.css('input[autocomplete="username"]'),
      By.css('input[type="email"]'),
      By.xpath("//label[contains(normalize-space(.),'Teléfono o correo electrónico')]/following::input[1]")
    ];

    this.passwordCandidates = [
      By.css('input[type="password"]'),
      By.css('input[autocomplete="current-password"]'),
      By.xpath("//label[normalize-space(.)='Contraseña']/following::input[1]")
    ];

    this.loginButtonCandidates = [
      By.css('button[type="submit"]'),
      By.xpath("//button[normalize-space(.)='Iniciar sesión']"),
      By.xpath("//button[normalize-space(.)='Inicia sesión']")
    ];

    this.startTransferButton = By.xpath(
      "//button[normalize-space(.)='Iniciar una transferencia'] | //a[normalize-space(.)='Iniciar una transferencia']"
    );


    // OTP / clave dinámica.
    // Estos selectores están centralizados para poder ajustarlos si Ria usa otro texto.
    this.sendOtpButtonCandidates = [
      By.xpath("//button[contains(normalize-space(.),'Enviar') and (contains(normalize-space(.),'clave') or contains(normalize-space(.),'código'))]"),
      By.xpath("//button[contains(normalize-space(.),'Solicitar') and (contains(normalize-space(.),'clave') or contains(normalize-space(.),'código'))]"),
      By.css('button[type="submit"]')
    ];

    this.otpInputCandidates = [
      By.css('input[autocomplete="one-time-code"]'),
      By.css('input[inputmode="numeric"]'),
      By.css('input[type="tel"]'),
      By.css('input[type="text"]')
    ];

    this.rememberDeviceNoButton = By.css(
      'button[analytics-name="remember-my-device-modal-no"]'
    );

    this.validateOtpButtonCandidates = [
      By.xpath("//button[normalize-space(.)='Listo']"),
      By.xpath("//button[contains(normalize-space(.),'Validar')]"),
      By.xpath("//button[contains(normalize-space(.),'Verificar')]"),
      By.xpath("//button[contains(normalize-space(.),'Continuar')]")
    ];


    this.registerCandidates = [
      By.xpath("//*[self::button or self::a][normalize-space(.)='Registrarse']"),
      By.xpath("//*[self::button or self::a][normalize-space(.)='Regístrate']"),
      By.xpath("//*[self::button or self::a][normalize-space(.)='Register']"),
      By.xpath("//*[self::button or self::a][normalize-space(.)='Sign up']")
    ];
  }

  async findFirstVisible(candidates, timeout = config.timeout) {
    let lastError;
    for (const locator of candidates) {
      try {
        const element = await this.driver.wait(
          until.elementLocated(locator),
          Math.min(timeout, 10000)
        );
        await this.driver.wait(
          until.elementIsVisible(element),
          Math.min(timeout, 10000)
        );
        return element;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error('No se encontró ningún elemento candidato.');
  }

  async waitForLoginPage() {
    await this.driver.wait(async () => {
      const url = await this.driver.getCurrentUrl();
      return url.includes('secure.riamoneytransfer.com/login');
    }, config.timeout);
  }

  async acceptAllCookies() {
    await this.waitForLoginPage();

    const button = await this.driver.wait(
      until.elementLocated(this.allowAllCookiesButton),
      30000
    );

    await this.driver.wait(
      until.elementIsVisible(button),
      30000
    );

    await this.driver.wait(
      until.elementIsEnabled(button),
      30000
    );

    const tagName = (await button.getTagName()).toLowerCase();
    const analyticsName = await button.getAttribute('analytics-name');

    if (tagName !== 'button') {
      throw new Error(`El selector de cookies devolvió <${tagName}>.`);
    }

    if (analyticsName !== 'consent-manager-allow-all-cookies') {
      throw new Error(
        `Elemento de cookies incorrecto: analytics-name=${analyticsName}`
      );
    }

    await this.driver.executeScript(
      "arguments[0].scrollIntoView({block:'center',inline:'center'});",
      button
    );

    await this.driver.sleep(500);

    try {
      await this.driver.actions()
        .move({ origin: button })
        .click()
        .perform();
    } catch (_) {
      await this.driver.executeScript(
        "arguments[0].click();",
        button
      );
    }

    await this.driver.wait(async () => {
      const dialogs = await this.driver.findElements(this.cookieDialog);

      if (dialogs.length === 0) {
        return true;
      }

      try {
        return !(await dialogs[0].isDisplayed());
      } catch (_) {
        return true;
      }
    }, 20000);

    await this.driver.sleep(1000);
  }

  async isEmailFieldPresent() {
    const element = await this.findFirstVisible(this.emailCandidates);
    return await element.isDisplayed();
  }

  async isPasswordFieldPresent() {
    const element = await this.findFirstVisible(this.passwordCandidates);
    return await element.isDisplayed();
  }

  async isRegisterPresent() {
    const element = await this.findFirstVisible(this.registerCandidates);
    return await element.isDisplayed();
  }

  async clickRegister() {
    const element = await this.findFirstVisible(this.registerCandidates);

    await this.driver.executeScript(
      "arguments[0].scrollIntoView({block:'center'});",
      element
    );

    try {
      await element.click();
    } catch (_) {
      await this.driver.executeScript(
        "arguments[0].click();",
        element
      );
    }
  }

  async waitForCountrySelectionPage() {
    await this.driver.wait(async () => {
      const url = (await this.driver.getCurrentUrl()).toLowerCase();

      if (
        url.includes('country-selection') ||
        url.includes('/country') ||
        url.includes('select-country') ||
        url.includes('country-of-residence')
      ) {
        return true;
      }

      const countryElements = await this.driver.findElements(
        By.xpath(
          "//*[contains(normalize-space(.),'Selecciona tu país') " +
          "or contains(normalize-space(.),'Selecciona el país') " +
          "or contains(normalize-space(.),'selección de país') " +
          "or contains(normalize-space(.),'Select your country') " +
          "or contains(normalize-space(.),'Choose your country')]"
        )
      );

      for (const element of countryElements) {
        try {
          if (await element.isDisplayed()) {
            return true;
          }
        } catch (_) {}
      }

      return false;
    }, config.timeout);

    return await this.driver.getCurrentUrl();
  }

  async enterEmail() {
    if (!config.email) {
      throw new Error('RIA_EMAIL no está configurado.');
    }
    const email = await this.findFirstVisible(this.emailCandidates);
    await email.clear();
    await email.sendKeys(config.email);
  }

  async enterPassword() {
    if (!config.password) {
      throw new Error('RIA_PASSWORD no está configurado.');
    }
    const password = await this.findFirstVisible(this.passwordCandidates);
    await password.clear();
    await password.sendKeys(config.password);
  }

  async clickLogin() {
    const button = await this.findFirstVisible(this.loginButtonCandidates);
    await this.driver.executeScript(
      "arguments[0].scrollIntoView({block:'center'});",
      button
    );

    try {
      await button.click();
    } catch (_) {
      await this.driver.executeScript(
        "arguments[0].click();",
        button
      );
    }
  }

  async waitForOtpPage() {
    await this.driver.wait(async () => {
      const url = (await this.driver.getCurrentUrl()).toLowerCase();
      return url.includes('/otp/login');
    }, config.timeout);

    return await this.driver.getCurrentUrl();
  }

  async waitForOtpInput() {
    await this.waitForOtpPage();

    await this.driver.wait(async () => {
      const inputs = await this.getVisibleOtpInputs();
      return inputs.length > 0;
    }, config.timeout);

    const inputs = await this.getVisibleOtpInputs();

    if (inputs.length > 0) {
      return inputs;
    }

    throw new Error('No se encontraron los campos visibles de la clave dinámica.');
  }

  async getVisibleOtpInputs() {
    for (const locator of this.otpInputCandidates) {
      try {
        const elements = await this.driver.findElements(locator);
        const visible = [];

        for (const element of elements) {
          try {
            if (await element.isDisplayed()) {
              visible.push(element);
            }
          } catch (_) {}
        }

        if (visible.length > 0) {
          return visible;
        }
      } catch (_) {}
    }

    return [];
  }

  async waitForManualOtpEntry() {
    await this.waitForOtpInput();
    const deadline = Date.now() + config.otpTimeout;
    const timeoutMinutes = Math.round(config.otpTimeout / 60000);

    console.log(
      `[RIA] Esperando el OTP hasta ${timeoutMinutes} minuto(s). ` +
      'Cuando llegue el SMS, ingresa manualmente los 6 dígitos.'
    );

    while (Date.now() < deadline) {
      try {
        const inputs = await this.getVisibleOtpInputs();
        const values = [];

        for (const input of inputs) {
          values.push((await input.getAttribute('value')) || '');
        }

        const totalDigits = values.join('').replace(/\D/g, '');

        if (totalDigits.length >= 6) {
          console.log('[RIA] Se detectaron los 6 dígitos del OTP. Continuando...');
          return;
        }
      } catch (_) {
        // El DOM puede refrescarse durante la espera; se reintenta.
      }

      await this.driver.sleep(1000);
    }

    throw new Error(
      `No se detectaron los 6 digitos del OTP dentro de ${timeoutMinutes} minuto(s).`
    );
  }

  async validateOtp() {
    const button = await this.findFirstVisible(
      this.validateOtpButtonCandidates,
      config.timeout
    );

    await this.driver.wait(
      until.elementIsEnabled(button),
      config.timeout
    );

    await this.driver.executeScript(
      "arguments[0].scrollIntoView({block:'center'});",
      button
    );

    await this.driver.sleep(300);

    try {
      await button.click();
    } catch (_) {
      await this.driver.executeScript(
        "arguments[0].click();",
        button
      );
    }
  }

  async completeOtpFlow() {
    await this.waitForOtpPage();
    await this.waitForManualOtpEntry();
    await this.validateOtp();
  }



  async waitForRememberDeviceModal() {
    const button = await this.driver.wait(
      until.elementLocated(this.rememberDeviceNoButton),
      30000
    );

    await this.driver.wait(
      until.elementIsVisible(button),
      30000
    );

    return button;
  }

  async declineRememberDevice() {
    const button = await this.waitForRememberDeviceModal();

    await this.driver.executeScript(
      "arguments[0].scrollIntoView({block:'center'});",
      button
    );

    await this.driver.sleep(500);

    try {
      await button.click();
    } catch (_) {
      await this.driver.executeScript(
        "arguments[0].click();",
        button
      );
    }

    await this.driver.wait(async () => {
      const elements = await this.driver.findElements(
        this.rememberDeviceNoButton
      );

      if (elements.length === 0) {
        return true;
      }

      try {
        return !(await elements[0].isDisplayed());
      } catch (_) {
        return true;
      }
    }, 30000);

    await this.driver.sleep(500);
  }

  async waitForAuthenticatedArea() {
    await this.driver.wait(async () => {
      const url = (await this.driver.getCurrentUrl()).toLowerCase();
      return url.includes('/activity') || url.includes('/send-money');
    }, config.timeout);
    return await this.driver.getCurrentUrl();
  }

  async clickStartTransfer() {
    const button = await this.driver.wait(
      until.elementLocated(this.startTransferButton),
      config.timeout
    );

    await this.driver.wait(
      until.elementIsVisible(button),
      config.timeout
    );

    await this.driver.wait(
      until.elementIsEnabled(button),
      config.timeout
    );

    await this.driver.executeScript(
      "arguments[0].scrollIntoView({block:'center', inline:'center'});",
      button
    );

    await this.driver.sleep(500);

    try {
      await button.click();
    } catch (_) {
      await this.driver.executeScript(
        "arguments[0].click();",
        button
      );
    }
  }

  async waitForSendMoneyPage() {
    await this.driver.wait(async () => {
      const url = await this.driver.getCurrentUrl();
      return url.includes('/send-money');
    }, config.timeout);
    return await this.driver.getCurrentUrl();
  }
}

module.exports = RiaLoginPage;
