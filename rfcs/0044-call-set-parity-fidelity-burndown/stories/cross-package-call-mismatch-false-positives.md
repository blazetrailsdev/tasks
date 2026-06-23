---
title: "Triage cross-package call-mismatch baseline entries (SIGNIFICANT_CALLS name-collisions)"
status: ready
updated: 2026-06-23
rfc: "0044-call-set-parity-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The call-mismatches ratchet baseline (`scripts/api-compare/call-mismatches-exclude.json`,
landed by call-mismatches-ratcheting-baseline / PR #4009) seeded 39 entries.
27 are activerecord and covered by the existing 0044 burndown clusters
(autosave-association-save-destroy, dirty-tracking-changes-applied,
touch-and-pessimistic-locking, transaction-wrapping, update-delegates-to-save).

The remaining 12 span six non-AR packages and are NOT covered by any cluster:

- abstractcontroller callbacks.ts `process_action` → `run_callbacks`
- actioncontroller base.ts `redirect_to` → `update`
- actioncontroller test-case.ts `process` / `process_controller_response` → `update`
- actiondispatch middleware/static.ts `serve` → `update`
- activesupport current-attributes.ts `reset` → `run_callbacks`
- activesupport hash-with-indifferent-access.ts `merge` → `update`
- rack headers.ts `replace` → `update`
- rack mock-request.ts `env_for` → `update`
- trailties application.ts `config_for` → `update`
- trailties source-annotation-extractor.ts `find` / `find_in` → `update`

These look like allowlist name-collisions, not real omissions: `SIGNIFICANT_CALLS`
in compare.ts (the `update` / `run_callbacks` entries) is AR-persistence-scoped
but matched package-agnostically, so `Hash#update`, `Headers#replace`-internal
`update`, `Static#serve` option `update`, etc. flag as false positives. Each row
currently carries the generic DEFAULT_REASON, pending this triage.

## Acceptance criteria

- Triage each of the 12 non-AR baseline entries: confirm false-positive vs real
  omission against the Rails source.
- For confirmed false positives, prevent the flag at the source — e.g. scope
  `SIGNIFICANT_CALLS` matching to activerecord (or per-package allowlists) in
  compare.ts — so the rows drop out of the artifact, then remove them from
  call-mismatches-exclude.json (the only-shrink check enforces the removal).
- For any genuine omission, either implement the call or replace DEFAULT_REASON
  with a real one-line equivalence note.
- Net: zero non-AR entries left carrying DEFAULT_REASON.
