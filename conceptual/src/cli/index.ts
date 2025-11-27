#!/usr/bin/env node
import { Command } from 'commander';

import { analyzeRepo } from '../core/generateConcepts.js';

const program = new Command();

program
  .name('conceptgen')
  .description('Generate Concept Sheets from a code repository')
  .version('0.0.1');

program
  .command('analyze')
  .argument('[path]', 'Path to repository root', '.')
  .option('--out-dir <dir>', 'Output directory for concept sheets', 'docs/domain/concepts')
  .option('--clean', 'Remove existing concept markdown files before analysis', false)
  .option('--verbose', 'Print LLM prompts for debugging', false)
  .option('--max-discovery-iterations <number>', 'Maximum number of discovery iterations', '5')
  .option('--name <name>', 'Name of the project (defaults to repo folder name)')
  .option('--publish', 'Publish generated model to viewer', true)
  .option('--no-publish', 'Do not publish generated model to viewer')
  .action(async (path, options) => {
    try {
      await analyzeRepo({
        repoRoot: path,
        outDir: options.outDir,
        clean: options.clean,
        verbose: options.verbose,
        maxDiscoveryIterations: parseInt(options.maxDiscoveryIterations),
        projectName: options.name,
        publish: options.publish,
      });
      console.log(`\n✅ Concept sheets generated in ${options.outDir}\n`);
    } catch (err) {
      console.error('❌ Error:', err);
      process.exit(1);
    }
  });

program.parseAsync(process.argv);
