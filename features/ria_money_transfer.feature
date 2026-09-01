# language: es
Característica: Ria Money Transfer - QA Engineer Test 6
  Como QA Engineer
  Quiero validar la calculadora, el acceso seguro y el registro
  Para demostrar los criterios de aceptación del reto

  @calculadora @negativo
  Escenario: E2E-01 Validar mensaje al ingresar caracteres alfabéticos
    Dado que el usuario navega a la página principal de Ria Money Transfer
    Cuando ingresa "abc" en el importe
    Entonces se muestra el mensaje de importe inválido

  @calculadora
  Escenario: E2E-02 Seleccionar Haití y validar conversión CLP a HTG
    Dado que el usuario navega a la página principal de Ria Money Transfer
    Entonces la moneda de origen es CLP
    Cuando selecciona "Haití" como país destino
    Y actualiza el importe a "25000"
    Entonces la moneda destino es HTG
    Y se actualiza el monto convertido con un valor válido

  @registro
  Escenario: E2E-03 Validar elementos requeridos en la página segura
    Dado que el usuario navega a la página principal de Ria Money Transfer
    Cuando presiona Start your transfer
    Entonces llega a la página segura de login
    Y presiona exactamente Permitir todas las cookies
    Entonces el botón Registrarse está presente
    Y el campo teléfono o correo electrónico está presente
    Y el campo contraseña está presente

  @registro
  Escenario: E2E-04 Registrarse redirige a selección de país
    Dado que el usuario navega a la página principal de Ria Money Transfer
    Cuando presiona Start your transfer
    Entonces llega a la página segura de login
    Y presiona exactamente Permitir todas las cookies
    Cuando hace clic en Registrarse
    Entonces es redirigido a la página de selección de país

  @login @adicional
  Escenario: E2E-05 Login seguro adicional
    Dado que el usuario navega a la página principal de Ria Money Transfer
    Cuando presiona Start your transfer
    Entonces llega a la página segura de login
    Y presiona exactamente Permitir todas las cookies
    Cuando ingresa el correo configurado
    Y ingresa la contraseña configurada
    Y presiona Iniciar sesión
    Entonces accede al área autenticada de Ria


  @otp @transferencia @adicional
  Escenario: E2E-06 Solicitar y validar clave dinámica
    Dado que el usuario navega a la página principal de Ria Money Transfer
    Cuando presiona Start your transfer
    Entonces llega a la página segura de login
    Y presiona exactamente Permitir todas las cookies
    Cuando ingresa el correo configurado
    Y ingresa la contraseña configurada
    Y presiona Iniciar sesión
    Entonces espera el OTP enviado automáticamente y el usuario ingresa manualmente los 6 dígitos
    Cuando valida la clave dinámica
    Entonces aparece la pregunta para recordar este dispositivo
    Y selecciona No para no recordar este dispositivo
    Entonces accede al área autenticada de Ria
    Cuando hace clic en Iniciar una transferencia
    Entonces llega a la pantalla Enviar dinero


  @sendmoney @transferencia
  Escenario: E2E-07 Seleccionar Haití y enviar $25000 CLP a HTG
    Dado que el usuario completa el login y llega a la pantalla Enviar dinero
    Cuando selecciona Haití en Estás enviando a
    Cuando ingresa el monto configurado de $25000 CLP en la pantalla Enviar dinero
    Entonces el monto enviado queda configurado en "25000" CLP
    Y la moneda de envío en Enviar dinero es CLP
    Cuando selecciona HTG como moneda de recepción
    Entonces la moneda destino en Enviar dinero es HTG
    Y se actualiza el monto convertido en la pantalla Enviar dinero
