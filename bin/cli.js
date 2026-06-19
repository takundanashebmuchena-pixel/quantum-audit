#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const riskDb = require('../data/risk-db.json');

function getAllDependencies(dir) {
  const pkgPath = path.join(dir, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    console.error('No package.json found in this directory.');
    process.exit(1);
  }
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const deps = {
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {})
  };

  const nodeModulesPath = path.join(dir, 'node_modules');
  const allFound = new Set(Object.keys(deps));

  if (fs.existsSync(nodeModulesPath)) {
    const entries = fs.readdirSync(nodeModulesPath);
    entries.forEach(entry => allFound.add(entry));
  }

  return Array.from(allFound);
}

function auditProject(dir) {
  const allDeps = getAllDependencies(dir);
  const flagged = [];

  allDeps.forEach(dep => {
    if (riskDb[dep]) {
      flagged.push({ package: dep, ...riskDb[dep] });
    }
  });

  return flagged;
}

function scoreResult(flagged) {
  const highCount = flagged.filter(f => f.severity === 'high').length;
  const medCount = flagged.filter(f => f.severity === 'medium').length;
  const penalty = highCount * 15 + medCount * 5;
  const score = Math.max(0, 100 - penalty);
  return score;
}

function printReport(flagged, score) {
  console.log('\n=== Quantum-Audit Report ===\n');

  if (flagged.length === 0) {
    console.log('No known quantum-vulnerable packages detected.');
  } else {
    flagged.forEach(f => {
      console.log(`[${f.severity.toUpperCase()}] ${f.package} — ${f.reason}`);
    });
  }

  console.log(`\nQuantum-Readiness Score: ${score}/100\n`);
}

const targetDir = process.cwd();
const flagged = auditProject(targetDir);
const score = scoreResult(flagged);
printReport(flagged, score);

const jsonReport = {
  score,
  flagged,
  scannedAt: new Date().toISOString()
};
fs.writeFileSync(path.join(targetDir, 'quantum-audit-report.json'), JSON.stringify(jsonReport, null, 2));
console.log('Full report saved to quantum-audit-report.json');
