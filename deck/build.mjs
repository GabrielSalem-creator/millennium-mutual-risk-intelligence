import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
const dir = new URL('.', import.meta.url);
const shell = readFileSync(new URL('shell.html', dir), 'utf8');
const frags = readdirSync(dir).filter((f) => /^s\d+.*\.html$/.test(f)).sort().map((f) => readFileSync(new URL(f, dir), 'utf8')).join('\n');
writeFileSync(new URL('../presentation.html', dir), shell.replace('<!--SLIDES-->', frags));
console.log('built presentation.html from', readdirSync(dir).filter((f) => /^s\d+.*\.html$/.test(f)).join(', '), (frags.match(/class="slide/g) || []).length, 'slides');
