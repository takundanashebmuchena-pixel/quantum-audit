function score(findings) {
  let total = 100;
  const seen = new Set();

  for (const f of findings) {
    const key = `${f.algorithm}:${f.file || ''}:${f.line || ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    total -= f.weight;
  }

  total = Math.max(0, Math.min(100, total));

  let grade;
  if (total >= 90) grade = 'A — Quantum Ready';
  else if (total >= 70) grade = 'B — Low Exposure';
  else if (total >= 40) grade = 'C — Moderate Exposure';
  else if (total >= 15) grade = 'D — High Exposure';
  else grade = 'F — Critical Exposure';

  return { score: total, grade };
}

module.exports = { score };
