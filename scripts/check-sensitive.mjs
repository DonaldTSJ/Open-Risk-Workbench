import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';

const root = process.cwd();
const allowed = new Set(['.js', '.mjs', '.json', '.md', '.html', '.css', '.yml', '.yaml', '.txt']);
const ignored = new Set(['.git', 'node_modules', 'coverage', 'dist']);
const forbidden = [
  ['fei', 'shu.cn'].join(''),
  ['hst', 'ong'].join(''),
  ['app', '_token'].join(''),
  ['CN', String.raw`\d{4}`].join(''),
  ['Valuable', ' Capital'].join('')
].map((value) => new RegExp(value, 'iu'));
const secretPatterns = [
  /sk-[a-z0-9_-]{16,}/iu,
  /(?:api[_-]?key|secret|password)\s*[:=]\s*["'][^"']{8,}["']/iu
];

async function walk(directory) {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await walk(path));
    else if (allowed.has(extname(entry.name))) output.push(path);
  }
  return output;
}

const findings = [];
for (const path of await walk(root)) {
  if (path.endsWith('check-sensitive.mjs')) continue;
  const content = await readFile(path, 'utf8');
  for (const pattern of [...forbidden, ...secretPatterns]) {
    if (pattern.test(content)) findings.push(`${relative(root, path)} matched ${pattern}`);
  }
}

if (findings.length) {
  console.error(findings.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Sensitive-data scan passed.');
}
