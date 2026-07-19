function score(findings, deps = {}) {
  const knownLibs = require('./detectors/known-libs');

  const pqcLibs = Object.keys(deps).filter(dep => knownLibs[dep] && knownLibs[dep].pqc === true);
  const hasPQC = pqcLibs.length > 0;
  const multiLayerBonus = pqcLibs.length >= 2 ? 10 : 0;

  let total = 100;
  const seen = new Set();
  const hybridFindings = [];
  const criticalFindings = [];
  const mediumFindings = [];

  for (const f of findings) {
    const key = `${f.algorithm}:${f.file || ''}:${f.line || ''}`;
    if (seen.has(key)) continue;
    seen.add(key);

    if (hasPQC && f.risk === 'critical') {
      total -= Math.floor(f.weight * 0.5);
      hybridFindings.push(f);
    } else {
      total -= f.weight;
      if (f.risk === 'critical') criticalFindings.push(f);
      if (f.risk === 'medium') mediumFindings.push(f);
    }
  }

  total = Math.min(100, total + multiLayerBonus);
  total = Math.max(0, total);

  let grade;
  if (total >= 90) grade = 'A — Quantum Ready';
  else if (total >= 70) grade = 'B — Low Exposure';
  else if (total >= 40) grade = 'C — Moderate Exposure';
  else if (total >= 15) grade = 'D — High Exposure';
  else grade = 'F — Critical Exposure';

  return {
    score: total,
    grade,
    hybrid: hasPQC,
    hybridNote: hasPQC
      ? `Post-quantum library detected (${pqcLibs.join(', ')}) — hybrid transition in progress. Critical penalties reduced by 50%.`
      : null,
    multiLayer: pqcLibs.length >= 2,
    multiLayerNote: pqcLibs.length >= 2
      ? `Multi-layer PQC detected (${pqcLibs.join(' + ')}) — +10 bonus applied.`
      : null,
    criticalCount: criticalFindings.length + hybridFindings.length,
    mediumCount: mediumFindings.length,
  };
}

module.exports = { score };
