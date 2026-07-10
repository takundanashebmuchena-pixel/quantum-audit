const fs = require('fs');
const path = require('path');
const knownLibs = require('./detectors/known-libs');
const { scanSourceFile } = require('./detectors/ast-scanner');
const { score } = require('./scorer');

const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'coverage']);

function getAllDependencies(projectDir) {
  const pkgPath = path.join(projectDir, 'package.json');
  if (!fs.existsSync(pkgPath)) return {};
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  return { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
}

function scanDependencies(projectDir) {
  const deps = getAllDependencies(projectDir);
  const findings = [];
  for (const name of Object.keys(deps)) {
    const known = knownLibs[name];
    if (known) {
      findings.push({
        algorithm: known.algorithm,
        risk: known.risk,
        weight: known.weight,
        file: 'package.json',
        line: null,
        source: name,
      });
    }
  }
  return findings;
}

function walkSourceFiles(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) walkSourceFiles(fullPath, fileList);
    else if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) fileList.push(fullPath);
  }
  return fileList;
}

function scanSource(projectDir) {
  const files = walkSourceFiles(projectDir);
  let findings = [];
  for (const file of files) findings = findings.concat(scanSourceFile(file));
  return findings;
}

function runAudit(projectDir) {
  const depFindings = scanDependencies(projectDir);
  const sourceFindings = scanSource(projectDir);
  const allFindings = [...depFindings, ...sourceFindings];
  const result = score(allFindings);
  return { project: path.basename(path.resolve(projectDir)), ...result, findings: allFindings };
}

module.exports = { runAudit, scanDependencies, scanSource };
