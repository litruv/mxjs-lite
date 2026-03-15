#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';

// Read the coverage report
const report = readFileSync('test/api-coverage-report.txt', 'utf8');

// Extract coverage data using regex
const totalMatch = report.match(/Total Endpoints Tested: (\d+)/);
const implementedMatch = report.match(/Fully Implemented: (\d+) \(([\d.]+)%\)/);

if (!totalMatch || !implementedMatch) {
  console.error('Could not parse coverage report');
  process.exit(1);
}

const total = totalMatch[1];
const implemented = implementedMatch[1];
const percentage = implementedMatch[2];

// Read README
let readme = readFileSync('README.md', 'utf8');

// Update badge
const oldBadge = /\[!\[API Coverage\]\(https:\/\/img\.shields\.io\/badge\/API%20coverage-[\d.]+%25%20\(\d+%2F\d+\)-orange\.svg\)\]\([^)]+\)/;
const newBadge = `[![API Coverage](https://img.shields.io/badge/API%20coverage-${percentage}%25%20(${implemented}%2F${total})-orange.svg)](test/api-coverage-report.txt)`;

readme = readme.replace(oldBadge, newBadge);

// Also update the testing section
const oldCoverage = /\*\*API coverage\*\*: [\d.]+% \(\d+\/\d+ Matrix endpoints\)/;
const newCoverage = `**API coverage**: ${percentage}% (${implemented}/${total} Matrix endpoints)`;

readme = readme.replace(oldCoverage, newCoverage);

// Write README
writeFileSync('README.md', readme, 'utf8');

console.log(`✅ Updated README badge: ${percentage}% (${implemented}/${total} endpoints)`);
