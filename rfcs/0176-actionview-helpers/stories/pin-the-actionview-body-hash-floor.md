---
title: "pin-the-actionview-body-hash-floor"
status: in-progress
updated: 2026-10-21
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#9167
claim: "2026-10-21T12:41:51Z"
assignee: "tse-undefined-local-raises-template-error"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api` (forced run, 2026-10-20) reports actionview pins at
**449/1209 — 760 unpinned**, the largest unpinned count of any package in the
run (`scripts/api-compare/body-pins.json` holds 440 actionview rows out of
10995). An unpinned body means a Rails-side edit to that method does not
surface locally or in CI: the package is at 95.8% API parity with roughly
two-thirds of its bodies unwatched, so the figure overstates how much of
actionview is actually tracked against v8.0.2.

This matters now rather than later: RFC 0191 is the Rails 8.0.5.1 upgrade, and
`retake-the-body-pin-floor-at-the-last-8-0-2-commit` /
`bump-ledger-scopes-the-test-ratchets-off-changed-rails-tests` both read the
pin floor. 760 unpinned actionview bodies land in that upgrade as invisible
drift.

## Acceptance criteria

- actionview's unpinned count is driven to 0, or to a stated floor with the
  remaining names and the reason they cannot pin.
- `scripts/api-compare/body-pins.json` grows by the pinned rows, each at
  `ref: "v8.0.2"`, and `pnpm parity:api` reports the new figure.
- No pin is taken on a body that diverges from Rails — a pin records "this TS
  body tracks this Ruby body", so a divergence is converged or receipted
  first, never pinned over.
- Mechanical and bulky: state in the PR body how many rows were added and that
  the diff is generated, per the lockfile/fixture exemption in
  CLAUDE.md § Conventions.
