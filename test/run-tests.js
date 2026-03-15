#!/usr/bin/env node

/**
 * Test runner that executes vitest and updates badge regardless of test results
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

/**
 * Runs a command and returns its exit code
 * @param {string} command - Command to run
 * @param {string[]} args - Command arguments
 * @returns {Promise<number>} Exit code
 */
function runCommand(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      stdio: 'inherit',
      shell: true
    });

    child.on('close', (code) => {
      resolve(code ?? 0);
    });

    child.on('error', (err) => {
      console.error(`Failed to run ${command}:`, err);
      resolve(1);
    });
  });
}

async function main() {
  console.log('Running API coverage tests...\n');
  
  const vitestCode = await runCommand('vitest', ['run', 'test/api-coverage.test.js']);
  
  console.log('\nUpdating coverage badge...\n');
  
  const badgeCode = await runCommand('node', ['test/update-badge.js']);
  
  process.exit(vitestCode !== 0 ? vitestCode : badgeCode);
}

main();
