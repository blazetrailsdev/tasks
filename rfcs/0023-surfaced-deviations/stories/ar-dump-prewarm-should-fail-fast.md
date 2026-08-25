---
title: "ar_dump schema pre-warm should fail fast, not warn"
status: draft
updated: 2026-08-15
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# `ar_dump`'s schema pre-warm swallows failures into a warning

## Context

`scripts/parity/pipeline/query/node/ar_dump.ts:173-181` wraps each model's
`loadSchema()` in a try/catch that writes
`parity ar_dump: warning: schema pre-warm failed for <Model>: <message>` to
stderr and continues. The comment above it (:161-164) states the invariant the
warm-up exists to hold: a cold `columnsHash()` silently drops table
qualification, "Locked by the ar-12 test in ar_dump.test.ts".

In PR #6561 that is exactly what happened — `loadSchema()` threw
`No crypto adapter configured`, the warning scrolled past in CI's log, and the
only visible symptom was `ar-12` asserting
`ORDER BY "users"."created_at"` against `ORDER BY "created_at"`. Two reviewers
and the author all initially attributed it to an unrelated `main` commit,
because the failure surfaced hundreds of lines away from its cause. The runner
already knows the pre-warm is load-bearing; it should not continue past a
failure.

## Converged shape

A failed pre-warm exits non-zero with the model name and the underlying error,
the way `assertPackagesBuilt` already fails fast for the other precondition.
If some fixture legitimately has an unloadable export, it opts out explicitly
rather than every fixture degrading silently.

## Acceptance criteria

- [ ] A throwing `loadSchema()` fails the dump with a message naming the model
      and the cause, instead of a stderr warning.
- [ ] `ar_dump.test.ts` covers the failure path (a fixture whose model cannot
      load produces a non-zero exit and the model name in stderr).
- [ ] All existing fixtures still dump clean.
