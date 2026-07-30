import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ALLOWED_DEV_ADVISORIES,
  evaluateAuditReports,
} from './audit-policy.mjs';

const allowedAdvisory = {
  source: 1124334,
  name: 'brace-expansion',
  dependency: 'brace-expansion',
  title: 'brace-expansion memory exhaustion',
  url: 'https://github.com/advisories/GHSA-mh99-v99m-4gvg',
  severity: 'high',
  range: '<=5.0.7',
};

function report(vulnerabilities = {}) {
  return {
    auditReportVersion: 2,
    vulnerabilities,
    metadata: {
      vulnerabilities: {
        info: 0,
        low: 0,
        moderate: 0,
        high: Object.values(vulnerabilities).filter(
          (entry) => entry.severity === 'high',
        ).length,
        critical: Object.values(vulnerabilities).filter(
          (entry) => entry.severity === 'critical',
        ).length,
        total: Object.keys(vulnerabilities).length,
      },
    },
  };
}

test('allows a clean production report and a clean full report', () => {
  assert.deepEqual(evaluateAuditReports(report(), report(), new Set()), {
    allowedAdvisories: [],
    allowedVulnerabilities: [],
  });
});

test('rejects an unused approved advisory so stale exceptions are removed', () => {
  assert.throws(
    () => evaluateAuditReports(report(), report()),
    /approved dev advisory is not present in the audit report/,
  );
});

test('allows only the approved dev advisory and its transitive effects', () => {
  const fullReport = report({
    'brace-expansion': {
      name: 'brace-expansion',
      severity: 'high',
      via: [allowedAdvisory],
      effects: ['minimatch'],
      nodes: ['node_modules/eslint/node_modules/brace-expansion'],
    },
    minimatch: {
      name: 'minimatch',
      severity: 'high',
      via: ['brace-expansion'],
      effects: ['eslint'],
      nodes: ['node_modules/eslint/node_modules/minimatch'],
    },
    eslint: {
      name: 'eslint',
      severity: 'high',
      via: ['minimatch'],
      effects: [],
      nodes: ['node_modules/eslint'],
    },
  });

  assert.deepEqual(evaluateAuditReports(report(), fullReport), {
    allowedAdvisories: [...ALLOWED_DEV_ADVISORIES],
    allowedVulnerabilities: ['brace-expansion', 'eslint', 'minimatch'],
  });
});

test('rejects the approved advisory when it reaches production dependencies', () => {
  const productionReport = report({
    'brace-expansion': {
      name: 'brace-expansion',
      severity: 'high',
      via: [allowedAdvisory],
      effects: [],
      nodes: ['node_modules/brace-expansion'],
    },
  });

  assert.throws(
    () => evaluateAuditReports(productionReport, productionReport),
    /production dependencies contain high or critical vulnerabilities/,
  );
});

test('rejects any unapproved high or critical advisory', () => {
  const fullReport = report({
    postcss: {
      name: 'postcss',
      severity: 'high',
      via: [
        {
          source: 999999,
          name: 'postcss',
          dependency: 'postcss',
          title: 'unexpected advisory',
          url: 'https://github.com/advisories/GHSA-xxxx-yyyy-zzzz',
          severity: 'high',
          range: '<=1.0.0',
        },
      ],
      effects: [],
      nodes: ['node_modules/postcss'],
    },
  });

  assert.throws(
    () => evaluateAuditReports(report(), fullReport),
    /unapproved high or critical advisory/,
  );
});

test('rejects an unresolved vulnerability chain', () => {
  const fullReport = report({
    eslint: {
      name: 'eslint',
      severity: 'high',
      via: ['missing-vulnerability'],
      effects: [],
      nodes: ['node_modules/eslint'],
    },
  });

  assert.throws(
    () => evaluateAuditReports(report(), fullReport),
    /cannot resolve advisory chain/,
  );
});

test('rejects malformed audit output', () => {
  assert.throws(
    () => evaluateAuditReports(report(), { auditReportVersion: 2 }),
    /invalid npm audit report/,
  );
});
