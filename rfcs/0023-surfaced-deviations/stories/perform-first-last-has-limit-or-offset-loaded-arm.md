---
title: "performFirst/performLast: read records cache on has_limit_or_offset? (not only _loaded)"
status: claimed
updated: 2026-07-06
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-07-06T10:46:21Z"
assignee: "perform-first-last-has-limit-or-offset-loaded-arm"
blocked-by: null
---

## Context

`performLast` (and `performFirst`) in
`packages/activerecord/src/relation/finder-methods.ts` only read from the
loaded records cache when `_loaded` is true. Rails' `last`/`first` read from
records when `loaded? || has_limit_or_offset?`
(`vendor/rails/.../finder_methods.rb:203`), so an UNLOADED relation that
carries a `limit`/`offset` value should also take the `find_last`/`find_nth`
records path rather than issuing a fresh reverse-order / ordered query.

Surfaced during PR #3875 (unskip-named-scoping-misc-model-scopes). Pre-existing
— not a regression of that PR — but a real divergence from Rails.

## Acceptance criteria

- [ ] `performFirst`/`performLast` take the loaded-records path when the
      relation has a limit or offset value (mirror `has_limit_or_offset?`),
      not only when `_loaded`.
- [ ] Query counts match Rails for `first`/`last` on a limited/offset relation.
- [ ] No regression in existing finder/relation tests.
