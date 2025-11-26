import fs from 'node:fs';
import { FileInfo } from './scanRepo.js';

export interface FileSnippet {
  relativePath: string;
  snippet: string;
}

export function extractSnippets(files: FileInfo[], maxFiles = 30, maxCharsPerFile = 2000): FileSnippet[] {
  const selected = files
    .sort((a, b) => a.size - b.size)
    .slice(0, maxFiles);

  return selected.map((file) => {
    const raw = fs.readFileSync(file.path, 'utf8');
    const snippet = raw.slice(0, maxCharsPerFile);
    return {
      relativePath: file.relativePath,
      snippet,
    };
  });
}
