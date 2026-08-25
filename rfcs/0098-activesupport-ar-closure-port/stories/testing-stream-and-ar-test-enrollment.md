---
title: "testing-stream-and-ar-test-enrollment"
status: closed
updated: 2026-08-13
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Superseded: its scope stays with the still-open parent testing-helpers-for-ar-test-parity after PR #6454 shipped only part of that slot."
---

## Context

Left out of #6454 (RFC 0098 slot H).

1. `testing/stream.rb` (0/3: `silence_stream`, `capture`, `quietly`) rebinds
   `$stdout`/`$stderr`. trails' hard rules ban `process.*` and `node:*` imports
   in package source, so this needs the `process-adapter.ts` seam
   (`packages/activesupport/src/process-adapter.ts`) or a reasoned SKIP_GROUPS
   entry in `scripts/parity/conventions.ts`.
2. `testing/time_helpers.rb` is 13/15 after #6454: `SimpleStubs#initialize` is
   matched, `TimeHelpers#after_teardown` is exported, but re-measure — the two
   remaining rows should be confirmed or closed.
3. Story acceptance criterion not yet met: enroll at least one currently-skipped
   ActiveRecord test that needs `assert_called` or `travel_to` and prove the
   helpers work end to end. Grep `vendor/rails/activerecord/test` for
   `travel_to` (6 files) / `assert_called` (30 files) and pick one whose trails
   counterpart is a PERMANENT-SKIP stub.

Helpers to use: `packages/activesupport/src/testing/time-helpers.ts`,
`testing/method-call-assertions.ts`, `testing/assertions.ts`.

## Acceptance criteria

- `testing/stream.rb` at 0 missing or a reasoned SKIP row.
- One AR test file enrolled and passing on the new helpers.
