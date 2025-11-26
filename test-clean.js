// Quick test to verify clean functionality
import fs from 'node:fs';
import path from 'node:path';

const outDir = 'docs/domain/concepts';
const absOut = path.resolve(outDir);

// Create a test file
fs.writeFileSync(path.join(absOut, 'test-clean.md'), '# Test File');

// Count files before
const filesBefore = fs.readdirSync(absOut).filter(f => f.endsWith('.md'));
console.log(`Files before clean: ${filesBefore.length}`);

// Simulate clean logic
const existingFiles = fs.readdirSync(absOut)
  .filter(file => file.endsWith('.md'))
  .map(file => path.join(absOut, file));

for (const file of existingFiles) {
  fs.unlinkSync(file);
}

const filesAfter = fs.readdirSync(absOut).filter(f => f.endsWith('.md'));
console.log(`Files after clean: ${filesAfter.length}`);
