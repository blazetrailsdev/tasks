---
title: "has-inverse-returns-the-inverse-name"
status: draft
updated: 2026-09-03
rfc: "0113-branch-and-guard-parity"
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
closed-reason: null
---

## Context

`vendor/rails/activerecord/lib/active_record/reflection.rb:674-676`:

```ruby
def has_inverse?
  inverse_name
end
```

`has_inverse?` is a value-returning predicate: it answers the inverse NAME, not
a boolean. trails (`packages/activerecord/src/reflection.ts:743-745`) returns
`!!this.inverseName()`, which is the "value-returning predicate ported as a
boolean" class CLAUDE.md lists as a standing Ruby-idiom trap.

Truthiness is preserved today, so nothing is observably wrong — but the value is
lost, and a caller that wants the name has to call `inverseName()` a second
time. Surfaced by #7435, which made `inverseName()` return the stored
`inverse_of` (`false` included, `reflection.rb:749-754`) and audited its
readers.

## Acceptance criteria

- `hasInverse()` returns what `inverseName()` returns — `string | false | null`
  — matching `reflection.rb:674-676`.
- Every caller is audited and discriminates with Ruby truthiness
  (`x != null && x !== false`), not a bare falsy test.
- `pnpm parity:api` arity/params unchanged; `parity:api:calls` no new rows.
