function xpathLiteral(value) {
  const text = String(value);

  if (!text.includes("'")) {
    return `'${text}'`;
  }

  if (!text.includes('"')) {
    return `"${text}"`;
  }

  const singleQuoteLiteral = `"'"`;
  return `concat(${text.split("'").map((part) => `'${part}'`).join(`, ${singleQuoteLiteral}, `)})`;
}

module.exports = {
  xpathLiteral
};
