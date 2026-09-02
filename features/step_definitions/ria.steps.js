const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');

Given('que el usuario navega a la página principal de Ria Money Transfer', async function () {
  await this.homePage.open();
});

When('ingresa {string} en el importe', async function (value) {
  await this.homePage.enterInvalidAmount(value);
});

Then('se muestra el mensaje de importe inválido', async function () {
  assert.ok(await this.homePage.isInvalidAmountMessageVisible());
});

When('selecciona {string} como país destino', async function (country) {
  this.initialReceiveAmount = await this.homePage.getReceiveAmount().catch(() => '');
  await this.homePage.selectDestinationCountry(country);
});

When('actualiza el importe a {string}', async function (amount) {
  await this.homePage.enterSendAmount(amount);
  this.convertedAmount = await this.homePage.waitForConversion(
    this.initialReceiveAmount
  );
});

Then('se actualiza el monto convertido', async function () {
  assert.ok(
    this.convertedAmount &&
    this.convertedAmount.trim() !== '' &&
    this.convertedAmount.trim() !== '0'
  );
});

When('presiona Start your transfer', async function () {
  await this.homePage.clickStartTransfer();
});

Then('llega a la página segura de login', async function () {
  await this.loginPage.waitForLoginPage();
});

Then('presiona exactamente Permitir todas las cookies', async function () {
  await this.loginPage.acceptAllCookies();
});

When('ingresa el correo configurado', async function () {
  await this.loginPage.enterEmail();
});

When('ingresa la contraseña configurada', async function () {
  await this.loginPage.enterPassword();
});

When('presiona Iniciar sesión', async function () {
  await this.loginPage.clickLogin();
});

Then('accede al área autenticada de Ria', async function () {
  const url = await this.loginPage.waitForAuthenticatedArea();
  assert.ok(url.includes('/activity') || url.includes('/send-money'));
});

When('hace clic en Iniciar una transferencia', async function () {
  await this.loginPage.clickStartTransfer();
});

Then('llega a la pantalla Enviar dinero', async function () {
  const url = await this.loginPage.waitForSendMoneyPage();
  assert.ok(url.includes('/send-money'));
});


Then('la moneda de origen es CLP', async function () {
  const currency = await this.homePage.getOriginCurrency();
  assert.ok(currency.includes('CLP'), `Se esperaba moneda origen CLP y se obtuvo: ${currency}`);
});

Then('la moneda destino es HTG', async function () {
  const currency = await this.homePage.getDestinationCurrency();
  assert.ok(currency.includes('HTG'), `Se esperaba moneda destino HTG y se obtuvo: ${currency}`);
});

Then('se actualiza el monto convertido con un valor válido', async function () {
  assert.ok(
    await this.homePage.isConvertedAmountValid(),
    'El monto convertido no es numérico, está vacío o es cero.'
  );
});

Then('el botón Registrarse está presente', async function () {
  assert.ok(await this.loginPage.isRegisterPresent());
});

Then('el campo teléfono o correo electrónico está presente', async function () {
  assert.ok(await this.loginPage.isEmailFieldPresent());
});

Then('el campo contraseña está presente', async function () {
  assert.ok(await this.loginPage.isPasswordFieldPresent());
});

When('hace clic en Registrarse', async function () {
  await this.loginPage.clickRegister();
});

Then('es redirigido a la página de selección de país', async function () {
  const url = await this.loginPage.waitForCountrySelectionPage();
  assert.ok(
    url,
    `No se detectó redirección al flujo de selección de país. URL actual: ${url}`
  );
});


Then('espera el OTP enviado automáticamente y el usuario ingresa manualmente los 6 dígitos', async function () {
  await this.loginPage.waitForManualOtpEntry();
});

When('valida la clave dinámica', async function () {
  await this.loginPage.validateOtp();
});


Then('aparece la pregunta para recordar este dispositivo', async function () {
  await this.loginPage.waitForRememberDeviceModal();
});

Then('selecciona No para no recordar este dispositivo', async function () {
  await this.loginPage.declineRememberDevice();
});


Given('que el usuario completa el login y llega a la pantalla Enviar dinero', async function () {
  await this.homePage.open();
  await this.homePage.clickStartTransfer();

  await this.loginPage.waitForLoginPage();
  await this.loginPage.acceptAllCookies();
  await this.loginPage.enterEmail();
  await this.loginPage.enterPassword();
  await this.loginPage.clickLogin();

  await this.loginPage.waitForManualOtpEntry();
  await this.loginPage.validateOtp();

  await this.loginPage.waitForRememberDeviceModal();
  await this.loginPage.declineRememberDevice();

  await this.loginPage.waitForAuthenticatedArea();
  await this.loginPage.clickStartTransfer();
  await this.loginPage.waitForSendMoneyPage();
  await this.sendMoneyPage.waitForPage();
});

When('selecciona Haití en Estás enviando a', async function () {
  await this.sendMoneyPage.selectDestinationCountry('Haití');
});

When('ingresa {string} como monto a enviar en la pantalla Enviar dinero', async function (value) {
  await this.sendMoneyPage.enterSendAmount(value);
});

Then('se muestra el mensaje {string}', async function (expectedMessage) {
  const actualMessage = await this.sendMoneyPage.getInvalidAmountMessage();

  assert.ok(
    actualMessage.includes(expectedMessage),
    `Mensaje esperado: "${expectedMessage}". Mensaje obtenido: "${actualMessage}"`
  );
});


Then('el monto enviado queda configurado en {string} CLP', async function (expectedAmount) {
  const actualAmount = await this.sendMoneyPage.getSendAmountValue();

  assert.strictEqual(
    actualAmount,
    expectedAmount,
    `Monto esperado: ${expectedAmount} CLP. Monto obtenido: ${actualAmount} CLP`
  );
});


Then('la moneda destino en Enviar dinero es HTG', async function () {
  assert.ok(
    await this.sendMoneyPage.isDestinationCurrencyHTG(),
    'Se esperaba que la moneda destino fuera HTG después de seleccionar Haití.'
  );
});

Then('se actualiza el monto convertido en la pantalla Enviar dinero', async function () {
  assert.ok(
    await this.sendMoneyPage.isConvertedAmountValid(),
    'El monto convertido está vacío, es cero o no es válido.'
  );

  const summary = await this.sendMoneyPage.logTransferSummary();

  assert.ok(
    summary.sendAmountCLP && summary.sendAmountCLP !== '0',
    'No fue posible obtener el monto enviado en CLP.'
  );

  assert.ok(
    summary.receiveAmountHTG && summary.receiveAmountHTG.trim() !== '' && summary.receiveAmountHTG.trim() !== '0',
    'No fue posible obtener el monto recibido en HTG.'
  );

  this.transferSummary = summary;
});


Then('la moneda de envío en Enviar dinero es CLP', async function () {
  assert.ok(
    await this.sendMoneyPage.isSendCurrencyCLP(),
    'Se esperaba que la moneda de envío fuera CLP.'
  );
});


When('ingresa el monto configurado de 25.000 CLP en la pantalla Enviar dinero', async function () {
  const config = require('../../src/utils/config');
  assert.strictEqual(
    config.sendAmountCLP,
    25000,
    'El monto configurado debe ser exactamente 25.000 CLP.'
  );
  await this.sendMoneyPage.enterSendAmount(config.sendAmountCLP);
});


When('ingresa el monto configurado de $25000 CLP en la pantalla Enviar dinero', async function () {
  const config = require('../../src/utils/config');

  assert.strictEqual(
    config.sendAmountCLP,
    25000,
    'El monto configurado debe ser exactamente $25000 CLP.'
  );

  await this.sendMoneyPage.enterSendAmount(config.sendAmountCLP);
});


When('selecciona HTG como moneda de recepción', async function () {
  await this.sendMoneyPage.selectReceiveCurrency('HTG');
});
