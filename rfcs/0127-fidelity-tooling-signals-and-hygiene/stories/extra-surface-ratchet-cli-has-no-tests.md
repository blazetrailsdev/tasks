---
title: "lint-extra-surface-ratchet.ts has no test file: check ordering, tighten refusals and summary rendering are verified only by hand"
status: draft
updated: 2026-08-31
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/api-compare/lint-extra-surface-ratchet.ts` is the CI entry point for
the RFC 0117 extra-surface ratchet, and it is the only file in the
`scripts/api-compare/` ratchet family with **no `.test.ts` beside it**. Its
siblings all have one (`extra-surface-mark.test.ts`,
`call-mismatch-baseline.test.ts`, `call-args-baseline.test.ts`,
`unreviewed-ratchet.test.ts`).

The predicates it composes are well covered — `extra-surface-mark.test.ts` has
17 tests over `exceedances`, `staleMarks`, `tightened`, `taggedOnlyViolations`,
`unmarkedPackages` and `unmeasuredPackages`. What is untested is `main()`'s own
logic, which is where the gate's actual behaviour lives:

- the **ordering** of the four failure checks (unmeasured → unmarked →
  unreceipted → grew). PR #7283 removed a `strandedMarks` check whose position
  in that sequence was load-bearing, and nothing would have caught a
  reordering;
- the `--tighten` refusal, which since #7283 branches on WHICH of `grew` /
  `unreceipted` fired to print the right message — a package pinned at
  `novel === 0` has no mark to narrow, so the "mark is EXCEEDED" wording is
  wrong for it;
- the summary line, which renders `novel N/0 (pinned)` for a tagged-only
  package and `novel N/M` for a counted one;
- the exit codes (1 on any failure, 0 on stale-only).

Every one of these was verified BY HAND during #7283 by editing the committed
mark file, running the gate, and reverting — which is exactly the kind of
verification that does not survive the next refactor.

The blocker is a seam: `main()` reads `OUTPUT_DIR/{rails,ts}-api.json` and
`MARK_PATH` off disk and calls `process.exit`, so it cannot be driven from a
test as written. `tasks-dir-test-seam-for-read-path` (RFC 0025) is the same
shape of problem for a different reader and may set the pattern.

## Acceptance criteria

- `main()` takes its manifests and marks through an injectable seam (parameters
  or a small options object) rather than reading three fixed paths, with the
  CLI entry supplying the real ones. No behaviour change.
- A `lint-extra-surface-ratchet.test.ts` covers, at minimum: each of the four
  failure modes in isolation; that an unmeasured package is reported BEFORE an
  unmarked one and both before `unreceipted`/`grew`; both `--tighten` refusal
  messages; the pinned vs counted summary rendering; and the stale-only path
  exiting 0.
- The test asserts on the pin specifically: a tagged-only package with a
  widened mark row still fails, because `taggedOnlyViolations` does not read
  the row.
- No new public surface beyond the seam; `pnpm parity:api:extra:gate` behaviour
  is byte-identical before and after on the current tree.
