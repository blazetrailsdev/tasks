---
title: "converge-arel-array-booleans-to-unquoted-true"
status: ready
updated: 2026-07-14
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced during review of PR #4867, which converged date elements of an Arel PG
array literal onto the scalar path's `quoted_date` form. Booleans have the same
scalar-vs-array divergence, and #4867's `formatElement` hook (in
`packages/arel/src/quote-array.ts`) is the mechanism to fix it.

`quoteArrayLiteral` emits `v ? "TRUE" : "FALSE"` (`quote-array.ts`), i.e. the
`quoted_true` / `quoted_false` form. Rails routes array elements through
`encode_array` → `type_cast_array` → `type_cast`, and `type_cast` uses the
**unquoted** pair (`abstract/quoting.rb:94-107`):

```ruby
when true       then unquoted_true
when false      then unquoted_false
```

`quoted_true` is `"TRUE"` (`abstract/quoting.rb:166-168`); `unquoted_true` is
Ruby `true` (`abstract/quoting.rb:170-172`). So trails uses the `quoted_*` pair
where Rails uses the `unquoted_*` pair.

**Verified, to correct a claim made in the #4867 review:** PostgreSQL does _not_
override `unquoted_true` — `grep -rn "def unquoted_true" vendor/rails/activerecord/lib/`
matches only `abstract/quoting.rb:170`, `mysql/quoting.rb:72`, and
`sqlite3/quoting.rb:87`. So PG inherits Ruby `true` and `encode_array` emits
`'{true}'` (not `'{t}'`, as the review suggested). Against PG this makes the
current trails output cosmetically different but functionally accepted, since PG
parses boolean input case-insensitively — so this is a **fidelity/structural**
fix, not a live bug, and should be scoped and reviewed as such.

The divergence has teeth beyond PG: MySQL overrides `unquoted_true` to `1` and
SQLite to `"t"` (`mysql/quoting.rb:72-79`, `sqlite3/quoting.rb:87-98`), so any
caller that routes non-PG array/`type_cast` values through this helper cannot
reach the right literal while the `quoted_*` pair is hard-coded.

## Acceptance criteria

- [ ] Boolean array elements route through the `unquoted_true` / `unquoted_false`
      pair rather than the hard-coded `"TRUE"` / `"FALSE"`, matching
      `type_cast` (`abstract/quoting.rb:94-107`).
- [ ] Scalar and array paths agree for booleans, as PR #4867 established for dates.
- [ ] Unit coverage pinning the emitted boolean array literal against the Rails form.
- [ ] api:compare / test:compare delta non-negative.

## Notes

Depends on the `formatElement` hook from PR #4867, which is deliberately offered
every non-array element (numbers and booleans included) so this is reachable
without further plumbing.
