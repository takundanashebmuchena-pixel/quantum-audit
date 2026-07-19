#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const { runAudit } = require('../src/scanner');
const { printReport, generateHTML, generateCSV } = require('../src/report');

const args = process.argv.slice(2);

const targetDir = args.find(a => !a.startsWith('--')) || '.';
const jsonOutput = args.includes('--json');
const htmlOutput = args.includes('--html');
const csvOutput = args.includes('--csv');

let threshold = 0;
const thresholdArg = args.find(a => a.startsWith('--threshold'));
if (thresholdArg) {
  if (thresholdArg.includes('=')) {
    threshold = parseInt(thresholdArg.split('=')[1], 10);
  } else {
    const nextArg = args[args.indexOf(thresholdArg) + 1];
    if (nextArg && !nextArg.startsWith('--')) threshold = parseInt(nextArg, 10);
  }
}

let ignoreList = [];
const ignoreArg = args.find(a => a.startsWith('--ignore'));
if (ignoreArg) {
  const ignoreVal = ignoreArg.includes('=')
    ? ignoreArg.split('=')[1]
    : args[args.indexOf(ignoreArg) + 1];
  if (ignoreVal) ignoreList = ignoreVal.split(',').map(s => s.trim());
}

const result = runAudit(path.resolve(targetDir), { threshold });

if (ignoreList.length > 0) {
  result.findings = result.findings.filter(f => {
    return !ignoreList.some(ig =>
      f.source === ig || f.algorithm.toLowerCase().includes(ig.toLowerCase())
    );
  });
}

if (jsonOutput) {
  console.log(JSON.stringify(result, null, 2));
} else if (htmlOutput) {
  const html = generateHTML(result);
  const outFile = 'quantum-audit-report.html';
  fs.writeFileSync(outFile, html);
  console.log(`HTML report written to ${outFile}`);
} else if (csvOutput) {
  const csv = generateCSV(result);
  const outFile = 'quantum-audit-report.csv';
  fs.writeFileSync(outFile, csv);
  console.log(`CSV report written to ${outFile}`);
} else {
  printReport(result);
}

const hasCritical = result.findings.some(f => f.risk === 'critical');
const belowThreshold = threshold > 0 && result.score < threshold;

if (hasCritical || belowThreshold) {
  process.exit(1);
} else {
  process.exit(0);
}
