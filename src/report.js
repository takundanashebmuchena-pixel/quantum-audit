const chalk = require('chalk');

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
  console.log('');

  if (result.findings.length === 0) {
    console.log(chalk.green('No quantum-vulnerable cryptography detected.'));
    return;
  }

  console.log(chalk.bold('Findings:'));
  for (const f of result.findings) {
    const color = riskColor(f.risk);
    const location = f.line ? `${f.file}:${f.line}` : f.file;
    console.log(`  ${color('[' + f.risk.toUpperCase() + ']')} ${f.algorithm} — ${location}`);
  }

  console.log('');
  console.log(chalk.dim('Critical findings rely on RSA/ECDSA, broken by Shor\'s algorithm.'));
  console.log(chalk.dim('Consider migrating to CRYSTALS-Kyber or CRYSTALS-Dilithium.'));
}

module.exports = { printReport };
