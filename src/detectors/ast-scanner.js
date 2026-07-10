const fs = require('fs');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

function scanSourceFile(filePath) {
  const findings = [];
  let code;
  try { code = fs.readFileSync(filePath, 'utf8'); } catch { return findings; }

  let ast;
  try {
    ast = parser.parse(code, {
      sourceType: 'unambiguous',
      plugins: ['jsx', 'typescript'],
    });
  } catch { return findings; }

  traverse(ast, {
    CallExpression(path) {
      const callee = path.node.callee;
      const line = path.node.loc ? path.node.loc.start.line : null;

      if (callee.type === 'MemberExpression' && callee.property.name === 'createSign') {
        const arg = path.node.arguments[0];
        if (arg && arg.type === 'StringLiteral') {
          if (/RSA/i.test(arg.value))
            findings.push({ algorithm: 'RSA (crypto.createSign)', risk: 'critical', weight: 35, file: filePath, line });
          else if (/DSA/i.test(arg.value))
            findings.push({ algorithm: 'DSA (crypto.createSign)', risk: 'critical', weight: 35, file: filePath, line });
        }
      }

      if (callee.type === 'MemberExpression' && /generateKeyPair/.test(callee.property.name || '')) {
        const arg = path.node.arguments[0];
        if (arg && arg.type === 'StringLiteral') {
          if (arg.value === 'rsa')
            findings.push({ algorithm: 'RSA (generateKeyPair)', risk: 'critical', weight: 35, file: filePath, line });
          else if (arg.value === 'ec')
            findings.push({ algorithm: 'ECDSA (generateKeyPair)', risk: 'critical', weight: 40, file: filePath, line });
        }
      }

      if (callee.type === 'MemberExpression' && callee.property.name === 'createHash') {
        const arg = path.node.arguments[0];
        if (arg && arg.type === 'StringLiteral' && /^sha256$/i.test(arg.value))
          findings.push({ algorithm: 'SHA-256 (crypto.createHash)', risk: 'medium', weight: 8, file: filePath, line });
      }
    },
  });

  return findings;
}

module.exports = { scanSourceFile };
