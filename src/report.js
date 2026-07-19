const chalk = require('chalk');
const fs = require('fs');

function riskColor(risk) {
  if (risk === 'critical') return chalk.red;
  if (risk === 'medium') return chalk.yellow;
  return chalk.green;
}

function printReport(result) {
  console.log('');
  console.log(chalk.bold(`Quantum Audit — ${result.project}`));
  console.log('─'.repeat(40));
  console.log(`Score: ${chalk.bold(result.score + '/100')}`);
  console.log(`Grade: ${chalk.bold(result.grade)}`);

  if (result.hybrid) {
    console.log('');
    console.log(chalk.cyan('⚡ Hybrid Mode: ' + result.hybridNote));
  }

  if (result.multiLayer) {
    console.log(chalk.cyan('🔒 ' + result.multiLayerNote));
  }

  if (result.threshold) {
    const passed = result.score >= result.threshold;
    console.log(`Threshold: ${result.threshold} — ${passed ? chalk.green('PASSED') : chalk.red('FAILED')}`);
  }

  console.log('');

  if (result.findings.length === 0) {
    console.log(chalk.green('✓ No quantum-vulnerable cryptography detected.'));
    return;
  }

  console.log(chalk.bold(`Findings (${result.criticalCount} critical, ${result.mediumCount} medium):`));
  console.log('');

  for (const f of result.findings) {
    const color = riskColor(f.risk);
    const location = f.line ? `${f.file}:${f.line}` : f.file;
    const hybrid = result.hybrid && f.risk === 'critical' ? chalk.cyan(' [hybrid -50%]') : '';
    console.log(`  ${color('[' + f.risk.toUpperCase() + ']')}${hybrid} ${f.algorithm}`);
    console.log(`    ${chalk.dim('→ ' + location)}`);
    if (f.migration) {
      console.log(`    ${chalk.cyan('↳ Migration: ' + f.migration)}`);
    }
    console.log('');
  }

  console.log(chalk.dim('─'.repeat(40)));
  console.log(chalk.dim('Critical findings rely on RSA/ECDSA, broken by Shor\'s algorithm.'));
  console.log(chalk.dim('NIST PQC standards: CRYSTALS-Kyber (KEM), CRYSTALS-Dilithium (signatures), SPHINCS+'));
}

function generateHTML(result) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>quantum-audit report — ${result.project}</title>
  <style>
    body { font-family: monospace; background: #0a0a0f; color: #e2e2f0; padding: 2rem; }
    h1 { color: #7b61ff; }
    .score { font-size: 2rem; font-weight: bold; }
    .critical { color: #ff4d6d; }
    .medium { color: #ffd166; }
    .safe { color: #06d6a0; }
    .hybrid { color: #00b4d8; background: rgba(0,180,216,0.1); padding: 0.5rem 1rem; border-radius: 4px; margin: 1rem 0; }
    .finding { background: #111118; border: 1px solid #1e1e2e; border-radius: 6px; padding: 1rem; margin: 0.5rem 0; }
    .migration { color: #00b4d8; font-size: 0.85rem; margin-top: 0.5rem; }
    .location { color: #6b6b8a; font-size: 0.8rem; }
  </style>
</head>
<body>
  <h1>quantum-audit — ${result.project}</h1>
  <div class="score">${result.score}/100</div>
  <div>${result.grade}</div>
  ${result.hybrid ? `<div class="hybrid">⚡ ${result.hybridNote}</div>` : ''}
  ${result.multiLayer ? `<div class="hybrid">🔒 ${result.multiLayerNote}</div>` : ''}
  ${result.threshold ? `<div>Threshold: ${result.threshold} — ${result.score >= result.threshold ? '<span class="safe">PASSED</span>' : '<span class="critical">FAILED</span>'}</div>` : ''}
  <hr style="border-color:#1e1e2e;margin:1.5rem 0"/>
  <h2>Findings (${result.criticalCount} critical, ${result.mediumCount} medium)</h2>
  ${result.findings.map(f => `
    <div class="finding">
      <span class="${f.risk}">[${f.risk.toUpperCase()}]</span> <strong>${f.algorithm}</strong>
      <div class="location">→ ${f.line ? f.file + ':' + f.line : f.file}</div>
      ${f.migration ? `<div class="migration">↳ ${f.migration}</div>` : ''}
    </div>
  `).join('')}
</body>
</html>`;
}

function generateCSV(result) {
  const rows = [
    ['project', 'score', 'grade', 'algorithm', 'risk', 'file', 'line', 'migration'],
    ...result.findings.map(f => [
      result.project,
      result.score,
      result.grade,
      f.algorithm,
      f.risk,
      f.file,
      f.line || '',
      f.migration || '',
    ]),
  ];
  return rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
}

module.exports = { printReport, generateHTML, generateCSV };
