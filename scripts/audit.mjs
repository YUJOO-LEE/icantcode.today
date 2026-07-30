import { spawnSync } from 'node:child_process';

import { evaluateAuditReports } from './audit-policy.mjs';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function runAudit(args) {
  const result = spawnSync(npmCommand, ['audit', ...args, '--json'], {
    encoding: 'utf8',
  });

  if (result.error) throw result.error;

  try {
    return JSON.parse(result.stdout);
  } catch {
    const details = result.stderr.trim() || result.stdout.trim() || 'no output';
    throw new Error(`npm audit did not return JSON: ${details}`);
  }
}

try {
  const productionReport = runAudit(['--omit=dev', '--audit-level=high']);
  const fullReport = runAudit(['--audit-level=high']);
  const result = evaluateAuditReports(productionReport, fullReport);

  if (result.allowedAdvisories.length === 0) {
    console.log('npm audit passed with no high or critical vulnerabilities.');
  } else {
    console.warn(
      `npm audit passed with approved dev-only advisory ${result.allowedAdvisories.join(', ')}.`,
    );
    console.warn(
      `Affected development dependency records: ${result.allowedVulnerabilities.join(', ')}.`,
    );
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
