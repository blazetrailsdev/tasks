---
title: "solid-cable TrimJobTest 'trims a limited number of messages' deletes nothing on loaded PG runners"
status: in-progress
updated: 2026-11-22
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#10550
claim: "2026-11-22T03:22:33Z"
assignee: "solid-cable-trim-job-limited-trim-flakes-on-pg"
blocked-by: null
closed-reason: null
---

## Context

`packages/solid-cable/test/trim-job.test.ts:22-28` (`TrimJobTest > trims a limited number of messages`) failed on the AR PostgreSQL shard 1 lane twice on PR trails#10282 (run 44214245164, job 134500194762, and again after rebase), a PR that does not touch solid-cable:

    Assertion: `Message.count()` didn't change by -2, but by 0. Expected: 2 Actual: 4
    ❯ assertDifference packages/activesupport/lib/testing/assertions.ts:423
    ❯ withCableConfig packages/solid-cable/test/support/config-stubs.ts:55

The trim did not delete anything. Likely a timing dependency, e.g. rows not yet older than the trim threshold, or the trim batch size or config stub not applied when the job runs. Compare it against the vendored solid_cable `test/jobs/trim_job_test.rb`.

## Acceptance criteria

- Identify why the trim deletes 0 rows on loaded PG runners, and fix the test or the code so it cannot fail that way (no timeout bump, no skip).
- Test name unchanged.
