---
title: "HashWithIndifferentAccess#delete returns the removed value, not a boolean"
status: done
updated: 2026-08-17
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6629
claim: "2026-08-17T02:42:54Z"
assignee: "converge-hwia-delete-returns-the-removed-value"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while porting `transform_keys!` in PR #6624.

Rails' `HashWithIndifferentAccess#delete`
(`activesupport/lib/active_support/hash_with_indifferent_access.rb:303-305`) is:

```ruby
def delete(key)
  super(convert_key(key))
end
```

`Hash#delete` returns the **deleted value** (`nil` when the key was absent), which
is what lets `transform_keys!` be written as one line per arm
(`:348-355`):

```ruby
keys.each { |key| self[yield(key)] = delete(key) }
```

trails (`packages/activesupport/src/hash-with-indifferent-access.ts`, `delete`)
returns `Map#delete`'s boolean instead:

```ts
delete(key: string): boolean {
  return this.data.delete(this.convertKey(key));
}
```

so every Rails body that consumes the returned value has to be re-expressed as a
`get` + `delete` pair. #6624's `transformKeysBang` carries exactly that
divergence in all three of its arms — three lines where Rails has one — because
converging `delete` is a return-type change with its own call-site sweep.

## Converged shape

`delete(key)` returns `V | undefined` — the removed value, `undefined` for an
absent key — matching `Hash#delete` through `convert_key`. Then collapse
`transformKeysBang`'s three arms back to Rails' single `this.set(<newKey>,
this.delete(key))` line each. Every existing caller that reads the boolean has
to be checked: `undefined` is falsy but so is a stored `null`/`false`/`0`, so a
`if (h.delete(k))` site is not a mechanical swap (CLAUDE.md, "Truthiness").

## Acceptance criteria

- [ ] `delete` returns the removed value per hash_with_indifferent_access.rb:303-305.
- [ ] `transformKeysBang`'s three arms are one line each, matching :348-355.
- [ ] Every call site that consumed the boolean is audited, not just retyped.
- [ ] `pnpm parity:api:calls` / `:args` clean.
