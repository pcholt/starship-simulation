import { readFileSync } from 'node:fs';

const MINIMUM_COVERAGE_PERCENT = 90;
const ENFORCED_METRICS = ['lines', 'statements', 'functions'];
const PACKAGES = ['engine', 'server', 'web'];
const METRICS = ['lines', 'statements', 'functions', 'branches'];

function readTotals(packageName) {
	const summaryPath = new URL(`../packages/${packageName}/coverage/coverage-summary.json`, import.meta.url);
	return JSON.parse(readFileSync(summaryPath, 'utf8')).total;
}

function percent(covered, total) {
	return total === 0 ? 100 : (covered / total) * 100;
}

const totalsByPackage = Object.fromEntries(PACKAGES.map((name) => [name, readTotals(name)]));

const overall = Object.fromEntries(
	METRICS.map((metric) => {
		const covered = PACKAGES.reduce((sum, name) => sum + totalsByPackage[name][metric].covered, 0);
		const total = PACKAGES.reduce((sum, name) => sum + totalsByPackage[name][metric].total, 0);
		return [metric, { covered, total, percent: percent(covered, total) }];
	})
);

console.log('\nCoverage by package (lines / statements / functions / branches)');
for (const name of PACKAGES) {
	const figures = METRICS.map((metric) => `${totalsByPackage[name][metric].pct.toFixed(1)}%`).join(' / ');
	console.log(`  ${name.padEnd(8)} ${figures}`);
}
console.log(`  ${'overall'.padEnd(8)} ${METRICS.map((metric) => `${overall[metric].percent.toFixed(1)}%`).join(' / ')}`);

const belowMinimum = ENFORCED_METRICS.filter((metric) => overall[metric].percent < MINIMUM_COVERAGE_PERCENT);
if (belowMinimum.length > 0) {
	for (const metric of belowMinimum) {
		console.error(`\nOverall ${metric} coverage ${overall[metric].percent.toFixed(1)}% is below the required ${MINIMUM_COVERAGE_PERCENT}%.`);
	}
	process.exit(1);
}
console.log(`\nOverall ${ENFORCED_METRICS.join(', ')} coverage meets the required ${MINIMUM_COVERAGE_PERCENT}%.`);
