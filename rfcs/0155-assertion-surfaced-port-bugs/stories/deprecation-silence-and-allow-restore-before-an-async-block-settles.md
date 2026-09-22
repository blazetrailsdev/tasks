---
title: "deprecation-silence-and-allow-restore-before-an-async-block-settles"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Deprecation#silence`
(`vendor/rails/activesupport/lib/active_support/deprecation/behaviors.rb`, the
`begin_silence` / `yield` / `ensure end_silence` shape ported at
`packages/activesupport/src/deprecation.ts:285-294`) restores the counter in a
`finally`. In TS that `finally` runs when the block RETURNS, and an `async`
block returns a pending promise — so `endSilence()` fires before the awaited
body has run, and everything inside it is unsilenced.

`deprecation_test.rb:690-706` (`test_silence_only_affects_the_current_thread`)
is where it shows: the converged port awaits `assert_not_deprecated` inside
`silence`, and the last one sees a warning.

`allow` (`deprecation.ts:301-313`, via `ThreadLocalVar#bind`) has the same
shape and the same exposure. This is the repo's known
`set; yield; ensure restore` trap — the restore has to be deferred to promise
SETTLE.

## Parked test

`packages/activesupport/src/deprecation.test.ts` › `silence only affects the
current thread`, `it.skip` with the converged body and a `BLOCKED:
deprecation-silence-and-allow-restore-before-an-async-block-settles` line.

## Acceptance criteria

- [ ] `silence` and `allow` defer their restore to the settle of a
      promise-returning block, keeping the synchronous path unchanged.
- [ ] The parked test runs unskipped and green with its converged body
      unchanged.
