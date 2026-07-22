/**
 * i18n-pilot GitHub Action: threshold gate
 *
 * Reads the JSON report and decides whether to fail the job based on:
 *   - fail-on:  error | warning | never
 *   - threshold: minimum count of qualifying issues that will fail the job
 *
 * Invoked from action.yml via actions/github-script@v7.
 */

const fs = require('fs');
const path = require('path');

/**
 * Given a bySeverity map and a fail-on level, return the count of
 * issues that meet or exceed the level's severity.
 *
 *   fail-on=error   → count(error)
 *   fail-on=warning → count(error) + count(warning)
 *   fail-on=never   → 0 (never fail)
 */
function countGatedIssues(bySeverity, failOn) {
  const s = bySeverity || {};
  if (failOn === 'never') return 0;
  if (failOn === 'error') return s.error || 0;
  if (failOn === 'warning') return (s.error || 0) + (s.warning || 0);
  throw new Error(`invalid fail-on value: ${failOn}`);
}

/**
 * Decide the outcome.
 *   passed=true         → all good
 *   passed=false        → threshold exceeded, job should fail
 *
 * threshold=0 means "any qualifying issue fails the job".
 * threshold=N means "up to N qualifying issues are allowed".
 */
function evaluate({ bySeverity, failOn, threshold }) {
  const count = countGatedIssues(bySeverity, failOn);
  const passed = count <= threshold;
  return { passed, count, threshold, failOn };
}

async function runGate({ core, jsonPath, failOn, threshold }) {
  const abs = path.resolve(jsonPath);
  if (!fs.existsSync(abs)) {
    core.warning(`Gate: JSON report not found at ${abs}; skipping gate check.`);
    return;
  }

  let report;
  try {
    report = JSON.parse(fs.readFileSync(abs, 'utf8'));
  } catch (err) {
    core.warning(`Gate: failed to parse JSON report: ${err.message}; skipping gate check.`);
    return;
  }

  const bySeverity = report.summary?.bySeverity || {};
  const t = parseInt(threshold, 10);
  if (Number.isNaN(t) || t < 0) {
    core.setFailed(`Invalid threshold: ${threshold} (must be a non-negative integer)`);
    return;
  }

  const outcome = evaluate({ bySeverity, failOn, threshold: t });

  const emoji = outcome.passed ? '✅' : '❌';
  const msg = `${emoji} i18n-pilot gate: ${outcome.count} qualifying issue(s) at fail-on=${outcome.failOn}, threshold=${outcome.threshold}`;

  if (outcome.passed) {
    core.info(msg);
  } else {
    core.setFailed(`${msg}. Fix the issues or raise the threshold.`);
  }
}

module.exports = runGate;
module.exports.evaluate = evaluate;
module.exports.countGatedIssues = countGatedIssues;
