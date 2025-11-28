// src/core/scanRepo.ts

import fs from "node:fs";

import path from "node:path";

import ignore from "ignore";



export interface FileInfo {

  path: string;

  relativePath: string;

  size: number;

}



export interface ScanResult {

  files: FileInfo[];

}



// Extensions will be passed in



export async function scanRepo(
  repoRoot: string,
  extensions: string[] = [".ts", ".tsx", ".js", ".jsx"],
  srcDir = "src"
): Promise<ScanResult> {

  const root = path.resolve(repoRoot);

  // --- Load .gitignore if present ---
  const gitignorePath = path.join(root, ".gitignore");
  const ig = ignore();
  if (fs.existsSync(gitignorePath)) {
    const giContent = fs.readFileSync(gitignorePath, "utf8");
    ig.add(giContent.split("\n"));
  }

  const files: FileInfo[] = [];

  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(root, fullPath);

      // Skip ignored paths
      if (ig.ignores(relativePath)) continue;

      if (entry.isDirectory()) {
        walk(fullPath);
      } else {
        const ext = path.extname(entry.name);
        if (!extensions.includes(ext)) continue;

        const stat = fs.statSync(fullPath);

        files.push({
          path: fullPath,
          relativePath,
          size: stat.size,
        });
      }
    }
  }

  const startDir = fs.existsSync(path.join(root, srcDir))
    ? path.join(root, srcDir)
    : root;

  walk(startDir);

  return { files };
}
