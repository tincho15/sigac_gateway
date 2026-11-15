// DTOs de respuesta: definen explicitamente que campos se exponen al cliente

function toResetPasswordResponse({ email, password }) {
  return { email, password };
}

module.exports = { toResetPasswordResponse };
