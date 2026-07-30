export const ALLOWED_DEV_ADVISORIES = new Set([
  'https://github.com/advisories/GHSA-mh99-v99m-4gvg',
]);

const BLOCKING_SEVERITIES = new Set(['high', 'critical']);

function assertAuditReport(report) {
  if (
    !report
    || typeof report !== 'object'
    || Array.isArray(report)
    || !report.vulnerabilities
    || typeof report.vulnerabilities !== 'object'
    || Array.isArray(report.vulnerabilities)
  ) {
    throw new Error('invalid npm audit report');
  }
}

function blockingVulnerabilityNames(report) {
  return Object.entries(report.vulnerabilities)
    .filter(([, vulnerability]) => (
      vulnerability
      && typeof vulnerability === 'object'
      && BLOCKING_SEVERITIES.has(vulnerability.severity)
    ))
    .map(([name]) => name)
    .sort();
}

function resolveAdvisories(vulnerabilities, name, visiting = new Set()) {
  if (visiting.has(name)) {
    throw new Error(`cannot resolve advisory chain for ${name}: cycle detected`);
  }

  const vulnerability = vulnerabilities[name];
  if (!vulnerability || !Array.isArray(vulnerability.via)) {
    throw new Error(`cannot resolve advisory chain for ${name}`);
  }

  const nextVisiting = new Set(visiting);
  nextVisiting.add(name);
  const advisories = [];

  for (const via of vulnerability.via) {
    if (typeof via === 'string') {
      advisories.push(...resolveAdvisories(vulnerabilities, via, nextVisiting));
      continue;
    }

    if (!via || typeof via !== 'object' || typeof via.url !== 'string') {
      throw new Error(`cannot resolve advisory chain for ${name}`);
    }

    if (BLOCKING_SEVERITIES.has(via.severity)) {
      advisories.push(via.url);
    }
  }

  if (advisories.length === 0) {
    throw new Error(`cannot resolve advisory chain for ${name}`);
  }

  return advisories;
}

export function evaluateAuditReports(
  productionReport,
  fullReport,
  approvedDevAdvisories = ALLOWED_DEV_ADVISORIES,
) {
  assertAuditReport(productionReport);
  assertAuditReport(fullReport);

  const productionVulnerabilities = blockingVulnerabilityNames(productionReport);
  if (productionVulnerabilities.length > 0) {
    throw new Error(
      `production dependencies contain high or critical vulnerabilities: ${productionVulnerabilities.join(', ')}`,
    );
  }

  const allowedAdvisories = new Set();
  const allowedVulnerabilities = blockingVulnerabilityNames(fullReport);

  for (const name of allowedVulnerabilities) {
    const advisoryUrls = resolveAdvisories(fullReport.vulnerabilities, name);
    for (const advisoryUrl of advisoryUrls) {
      if (!approvedDevAdvisories.has(advisoryUrl)) {
        throw new Error(
          `unapproved high or critical advisory for ${name}: ${advisoryUrl}`,
        );
      }
      allowedAdvisories.add(advisoryUrl);
    }
  }

  const unusedApprovals = [...approvedDevAdvisories]
    .filter((advisoryUrl) => !allowedAdvisories.has(advisoryUrl))
    .sort();
  if (unusedApprovals.length > 0) {
    throw new Error(
      `approved dev advisory is not present in the audit report: ${unusedApprovals.join(', ')}`,
    );
  }

  return {
    allowedAdvisories: [...allowedAdvisories].sort(),
    allowedVulnerabilities,
  };
}
