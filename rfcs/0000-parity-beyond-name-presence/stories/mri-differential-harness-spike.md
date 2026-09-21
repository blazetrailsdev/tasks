---
title: "Spike: a pure-function differential harness that runs a Ruby expression under real Rails and the TS twin, and diffs"
status: draft
updated: 2026-09-20
rfc: "0000-parity-beyond-name-presence"
cluster: "mri-differential"
packages: []
deps: []
deps-rfc: []
est-loc: 320
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/parity/pipeline/` already runs Rails and trails side by side over 206 fixtures and diffs the results (`run.ts:1-24`), but compares only `to_sql` text (`canonical/query-types.ts:7-8`) and schema dumps. `ruby` is on PATH and `vendor/rails/` is populated in every worktree, so activesupport and activemodel load with `ruby -I vendor/rails/activesupport/lib -I vendor/rails/activemodel/lib`, with no bundler, no database and no Rails boot.

Two 0155 stories already verified their claim this way, by hand: `decimal-cast-answers-one-for-a-boolean` ("Verified with MRI: `true.to_s.to_d == 0`") and `duration-divide-by-integer-keeps-float-parts` ("confirmed against MRI"). The audit estimates 18 to 22 of the 180 are reachable this way, all in pure code: `Duration`, `TimeWithZone`, `ActiveModel::Type::*`, `Errors`, HWIA, `to_sentence`, validators' messages.

Prior art: none executes MRI. RFC 0086's README says codegen is "not a correctness oracle; semantic verification stays with the tests", which is a scope statement about codegen. `vendor-ruby-mri-source` and `ruby-compat-mri-citation-lint` cite MRI and never run it.

Not tractable, and out of scope for the whole cluster: anything needing a connection, fixtures or a booted app.

## Acceptance criteria

- A third pipeline type where a fixture is a Ruby expression file and a TS expression file, and each side prints a canonical JSON record: `class` (Ruby class path), `inspect`, `raisedClass`, `message`.
- The TS record's `class` and `inspect` come from ruby-compat's class-path and inspect helpers, so a rendering divergence shows as a diff.
- Time, zone and locale are frozen on both sides, the way `PARITY_FROZEN_AT` does for the query type.
- Ten fixtures reproduce ten named 0155 stories as red diffs, including `decimal-cast-answers-one-for-a-boolean`, `duration-divide-by-integer-keeps-float-parts`, `to-sentence-does-not-stringify-elements-or-nil-connectors` and `activemodel-error-type-default-swallows-explicit-nil`.
- A known-gaps file holds those ten, mirroring `canonical/query-known-gaps.json`, so the run is green and each gap is a named row.
- Not wired into CI in this story. The PR body gives wall-clock cost per fixture.
