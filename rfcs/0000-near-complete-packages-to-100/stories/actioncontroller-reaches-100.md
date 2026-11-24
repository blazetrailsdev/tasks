---
title: "actioncontroller: reach 100% on parity"
status: ready
rfc: "0000-near-complete-packages-to-100"
cluster: rails-core
packages: [actionpack]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Measured 2026-11-24 at trails `4330f807e1`: `actioncontroller` is 14 tests short of
100%. 6 of those are skips without a `PERMANENT-SKIP:` line (list them with
`pnpm parity:test -- --package actioncontroller` and grep the TS files for
`it.skip`). The rest are missing. Paths are under `vendor/rails/v8.0.5.2/`:

- `actionpack/test/controller/integration_test.rb` (actioncontroller):
  - encoding as html
- `actionpack/test/controller/live_stream_test.rb` (actioncontroller):
  - connected to stack not inherited
  - live streaming doesnt exclude by default
  - abort terminates a reader blocked on the buffer
  - close then abort still terminates the reader
  - close with a full buffer does not wait for a reader
  - close and abort finish when a single slot buffer is full
  - write after abort does not block on the terminator

Apply the triage rule in this RFC's README (§ "Triage rule"). Every item ends
ported, permanent with a citation, listed for an operator ruling, or filed as a
blocking story. Before calling an item permanent, try to disprove its
receipt.

## Acceptance criteria

- [ ] `pnpm parity:test` reports 100.0 for `actioncontroller`.
- [ ] Every remaining `it.skip` in the package sits under a `PERMANENT-SKIP:`
      line citing a CLAUDE.md section or a dated operator ruling.
- [ ] Items needing a ruling are listed in the PR body with their Rails
      `file:line`, and are not receipted until the operator rules.
- [ ] Work past the LOC ceiling is filed as new stories in this RFC, each
      with a `deps` edge from this one.

## Verification

```sh
pnpm parity:test -- --package actioncontroller
```
