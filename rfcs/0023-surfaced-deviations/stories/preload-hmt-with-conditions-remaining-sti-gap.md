---
title: "preload-hmt-with-conditions-remaining-sti-gap"
status: done
updated: 2026-08-12
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6399
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/associations.test.ts:596` marks
`it.fails("preload for hmt with conditions")` with
`// TODO(store-full-sti-class-name): remove it.fails when that story fixes the gap.`
That story landed (RFC 0030, #3874) and the test still fails, so the comment
promises a fix from a story that can no longer deliver one.

Rails' counterpart is
`vendor/rails/activerecord/test/cases/associations/eager_test.rb` preload of a
has_many :through with conditions; the residual is the STI class name trails
stores/reads for the join rows (`store_full_sti_class` behaviour,
`vendor/rails/activerecord/lib/active_record/inheritance.rb:70`).

## Acceptance criteria

- Diagnose the remaining gap behind `preload for hmt with conditions` and fix it
  in production code, dropping the `it.fails`.
- The comment naming `store-full-sti-class-name` is removed with it.
