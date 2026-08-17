---
title: "readonly? and locked? return their values, not booleans"
status: done
updated: 2026-08-17
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 6624
claim: "2026-08-17T01:02:54Z"
assignee: "port-hwia-bang-forms-and-to-options"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while moving the flag members in PR #6616. Rails' two Relation
flag predicates return the underlying _value_, not a boolean; trails coerces
both, which is the "Predicates" idiom trap in CLAUDE.md ("A Ruby predicate
returns a value, not necessarily a boolean; a value-returning predicate
ported as a `boolean` breaks every call site that used the value").

`vendor/rails/activerecord/lib/active_record/relation.rb:1278-1280`:

```ruby
def readonly?
  readonly_value
end
```

`vendor/rails/activerecord/lib/active_record/relation.rb:75`:

```ruby
alias :locked? :lock_value
```

So `readonly?` answers `nil` / `true` / `false` (the stored
`readonly_value`), and `locked?` answers the lock clause **string** —
`"FOR UPDATE"` — not `true`.

trails (`packages/activerecord/src/relation.ts`, both left as-is by #6616
because they are pre-existing and outside a move story):

```ts
get isReadonly(): boolean {
  return this.readonlyValue ?? false;      // Rails: readonly_value, may be nil
}

get isLocked(): boolean {
  return this.lockValue !== null;          // Rails: the lock string itself
}
```

`isLocked` is the sharper of the two: a caller wanting the lock clause has to
reach past the predicate to `lockValue`, where Rails hands it over directly
through the alias.

## Acceptance criteria

- `isReadonly` returns `readonly_value` unchanged (`relation.rb:1278-1280`),
  including a stored `null`, rather than coercing through `?? false`.
- `isLocked` is the `lock_value` alias (`relation.rb:75`) and returns the lock
  clause, not a boolean.
- Return types widen to match; every call site that relied on the coerced
  boolean is checked, since Ruby truthiness and JS truthiness differ for `""`
  and `0` (CLAUDE.md, "Truthiness").
- `relation/` and `locking/` suites pass; `pnpm parity:api` /
  `parity:api:calls` / `:args` clean.
