---
title: "whereAssociated takes an array; Rails' where.associated takes splat args"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Already done: relation/query-methods.ts:47 declares whereAssociated(...associationNames: string[]) and :85 splats through, matching query_methods.rb:88's associated(*associations); the trailing skipJoinFor param is gone too."
---

## Context

Rails' `where.associated` takes **splat args**
(`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:88`):

```ruby
def associated(*associations)
  associations.each do |association|
```

so `Book.where.associated(:author)` and `.associated(:a, :b)` both work.

trails declares it as taking an **array** —
`packages/activerecord/src/relation/query-methods.ts:46`:

```ts
whereAssociated(associationNames: string[], skipJoinFor?: ReadonlySet<string>): R;
```

This surfaced via parity fixture `ar-37`, a faithful translation of
`Book.where.associated(:author)`:

```ts
export default Book.all().whereAssociated("author");
```

The bare string is consumed as an iterable of characters, so the first
"association name" is `"a"` and it fails with:

> An association named `:a` does not exist on the model `Book`.

That is a silently-wrong-shaped API: passing a string never errors at the type
boundary in the way a caller expects, it just mis-parses. `ar-37` is one of two
fixtures still failing in the `query-parity-trails` job (see #5264, which fixed
the runners themselves and `ar-01`).

The second parameter `skipJoinFor` has no Rails counterpart — check whether it
is an internal-only threading arg that should move off the public signature
while the arity is being changed.

## Acceptance criteria

- `whereAssociated` accepts variadic association names, matching Rails'
  `associated(*associations)`.
- Existing array-passing callers updated.
- Parity fixture `ar-37` dumps successfully on the trails side.
- `skipJoinFor`'s status documented (kept as internal threading, or relocated).
