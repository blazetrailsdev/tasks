---
title: "normalizes-query-and-in-place-type-decoration"
status: ready
updated: 2026-06-26
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced while converging `normalized-attribute.test.ts` onto the canonical
schema (RFC 0019, PR for `normalized-attribute-test-cluster`). trails implements
`normalizes` imperatively at the model write path
(`packages/activemodel/src/model.ts` `_applyNormalization` /
`normalizeAttribute`) but **never decorates the attribute's cast type**. The
`NormalizedValueType` wrapper that Rails uses
(`packages/activerecord/src/normalization.ts`) exists but is **dead code** — it
is not wired into the attribute pipeline, so the query/predicate path and
changed-in-place save path do not normalize.

Rails wires `normalizes` by wrapping the attribute type with
`NormalizedValueType` (`vendor/rails/activerecord/lib/active_record/normalization.rb`),
so `where` / `find_by` serialize query values through the normalizer, and
`normalize_changed_in_place_attributes` re-normalizes mutated values before
save/validation.

Four Rails tests in `normalized_attribute_test.rb` are currently `it.skip`'d in
the ported `normalized-attribute.test.ts` pending this convergence:

- `finds record by normalized value` — `find_by(manufactured_at: time.to_s)`
  must normalize the query value (noon) to match the stored row.
- `uses the same query when finding record by nil and normalized nil values` —
  `where(name: "")` must normalize `""` → nil → `IS NULL`, matching
  `where(name: nil)`.
- `normalizes changed-in-place value before validation` — `valid?` must
  re-normalize changed-in-place attributes before validation runs.
- `minimizes number of times normalization is applied` — the changed-in-place
  portion (`name.replace("0")` then `save`) must re-normalize on save.

## Acceptance criteria

- [ ] Wire `NormalizedValueType` (or equivalent) into the attribute type so
      `where`/`find_by` serialize query values through the normalizer.
- [ ] Re-normalize changed-in-place attributes before save/validation
      (`normalizeChangedInPlaceAttributes` already exists; wire it into the
      save callback chain).
- [ ] Un-skip the four tests in
      `packages/activerecord/src/normalized-attribute.test.ts`; all pass.
- [ ] No regressions in the existing instance-level normalization tests.
