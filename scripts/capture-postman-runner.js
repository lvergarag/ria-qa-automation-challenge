const fs = require('fs');
const path = require('path');
const newman = require('newman');
const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

const rootDir = path.resolve(__dirname, '..');
const screenshotsDir = path.join(rootDir, 'screenshots');
const collectionPath = path.join(rootDir, 'postman', 'Ria_QA_Challenge.postman_collection.json');
const outputTextPath = path.join(screenshotsDir, 'postman-collection-runner-result.txt');
const outputJsonPath = path.join(screenshotsDir, 'postman-collection-runner-result.json');
const outputHtmlPath = path.join(screenshotsDir, 'postman-collection-runner-result.html');
const outputPngPath = path.join(screenshotsDir, 'postman-collection-runner-result.png');

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function runCollection() {
  return new Promise((resolve, reject) => {
    newman.run({
      collection: collectionPath,
      reporters: 'cli',
      reporter: {
        cli: {
          noBanner: true,
          noColor: true
        }
      }
    })
      .on('done', (error, summary) => {
        if (error) {
          reject(error);
          return;
        }

        resolve({
          output: buildTextSummary(summary),
          summary
        });
      });
  });
}

function buildTextSummary(summary) {
  const stats = summary.run.stats;
  const failures = summary.run.failures || [];
  const executions = summary.run.executions || [];
  const lines = [
    'Ria QA Challenge - QA Engineer Test 6',
    '',
    `Requests: ${stats.requests.total} executed, ${stats.requests.failed} failed`,
    `Assertions: ${stats.assertions.total} executed, ${stats.assertions.failed} failed`,
    `Test scripts: ${stats.testScripts.total} executed, ${stats.testScripts.failed} failed`,
    ''
  ];

  for (const execution of executions) {
    lines.push(`${execution.item.name}`);
    lines.push(`Status: ${execution.response?.code || 'N/A'}`);

    for (const assertion of execution.assertions || []) {
      lines.push(`${assertion.error ? 'FAIL' : 'PASS'} - ${assertion.assertion}`);
    }

    lines.push('');
  }

  if (failures.length > 0) {
    lines.push('Failures:');

    for (const failure of failures) {
      lines.push(`FAIL - ${failure.source?.name || failure.error?.name || 'Unknown'}: ${failure.error?.message || 'No message'}`);
    }
  } else {
    lines.push('Failures: 0');
  }

  return lines.join('\n');
}

function buildHtml({ output, summary }) {
  const stats = summary.run.stats;
  const failures = summary.run.failures || [];
  const executions = summary.run.executions || [];
  const status = failures.length === 0 ? 'PASS' : 'FAIL';

  const rows = executions.map((execution) => {
    const name = execution.item.name;
    const code = execution.response?.code || 'N/A';
    const assertions = execution.assertions || [];
    const assertionsText = assertions
      .map((assertion) => `${assertion.error ? 'FAIL' : 'PASS'} - ${assertion.assertion}`)
      .join('<br>');

    return `
      <tr>
        <td>${escapeHtml(name)}</td>
        <td>${escapeHtml(code)}</td>
        <td>${assertionsText}</td>
      </tr>
    `;
  }).join('');

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Postman Collection Runner Evidence</title>
  <style>
    body {
      margin: 0;
      background: #f4f6f8;
      color: #17202a;
      font-family: Arial, Helvetica, sans-serif;
    }
    main {
      max-width: 1120px;
      margin: 0 auto;
      padding: 32px;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
      border-bottom: 4px solid #ff6c37;
      padding-bottom: 18px;
    }
    h1 {
      margin: 0 0 8px;
      font-size: 30px;
    }
    .subtitle {
      margin: 0;
      color: #4f5f6f;
      font-size: 15px;
    }
    .badge {
      min-width: 104px;
      border-radius: 6px;
      background: ${status === 'PASS' ? '#0e8f54' : '#b42318'};
      color: #fff;
      font-size: 24px;
      font-weight: 700;
      line-height: 1;
      padding: 14px 18px;
      text-align: center;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin: 24px 0;
    }
    .metric {
      background: #fff;
      border: 1px solid #d8dee4;
      border-radius: 8px;
      padding: 16px;
    }
    .metric strong {
      display: block;
      font-size: 26px;
      margin-bottom: 4px;
    }
    .metric span {
      color: #5f6b7a;
      font-size: 13px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background: #fff;
      border: 1px solid #d8dee4;
      border-radius: 8px;
      overflow: hidden;
    }
    th,
    td {
      border-bottom: 1px solid #e5e9ef;
      padding: 12px;
      text-align: left;
      vertical-align: top;
      font-size: 14px;
    }
    th {
      background: #263238;
      color: #fff;
      font-size: 13px;
      text-transform: uppercase;
    }
    pre {
      white-space: pre-wrap;
      background: #101820;
      color: #f2f5f8;
      border-radius: 8px;
      padding: 16px;
      font-size: 12px;
      line-height: 1.4;
      max-height: 380px;
      overflow: hidden;
    }
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <h1>Postman Collection Runner</h1>
        <p class="subtitle">Ria QA Challenge - QA Engineer Test 6</p>
      </div>
      <div class="badge">${status}</div>
    </header>

    <section class="grid">
      <div class="metric"><strong>${stats.requests.total}</strong><span>Requests</span></div>
      <div class="metric"><strong>${stats.requests.failed}</strong><span>Requests fallidas</span></div>
      <div class="metric"><strong>${stats.assertions.total}</strong><span>Assertions</span></div>
      <div class="metric"><strong>${stats.assertions.failed}</strong><span>Assertions fallidas</span></div>
    </section>

    <table>
      <thead>
        <tr>
          <th>Request</th>
          <th>Status</th>
          <th>Assertions</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <h2>Salida Newman</h2>
    <pre>${escapeHtml(output)}</pre>
  </main>
</body>
</html>`;
}

async function captureHtml() {
  const options = new chrome.Options()
    .addArguments('--headless=new')
    .addArguments('--window-size=1280,1000');

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  try {
    await driver.get(`file:///${outputHtmlPath.replace(/\\/g, '/')}`);
    const image = await driver.takeScreenshot();
    fs.writeFileSync(outputPngPath, image, 'base64');
  } finally {
    await driver.quit();
  }
}

async function main() {
  fs.mkdirSync(screenshotsDir, { recursive: true });

  const result = await runCollection();
  fs.writeFileSync(outputTextPath, result.output, 'utf8');
  fs.writeFileSync(outputJsonPath, JSON.stringify(result.summary, null, 2), 'utf8');
  fs.writeFileSync(outputHtmlPath, buildHtml(result), 'utf8');
  await captureHtml();

  const failures = result.summary.run.failures || [];
  console.log(`Postman evidence written to ${outputPngPath}`);

  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
