---
title: "Arel SelectManager#joinSources is a getter; Rails' join_sources is a method"
status: ready
updated: 2026-07-27
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Arel::SelectManager#join_sources` is a **method** in Rails
(`vendor/rails/activerecord/lib/arel/select_manager.rb:244-246`):

```ruby
def join_sources
  @ctx.source.right
end
```

trails ported it as a **getter** — `packages/arel/src/select-manager.ts:436`:

```ts
get joinSources(): Join[] {
  return [...this.core.source.right] as Join[];
}
```

This surfaced via parity fixture `ar-153`, which is a faithful translation of
the Ruby and calls `.joinSources()`:

```ts
const joinSrc = Book.arelTable.join(Author.arelTable).on(...).joinSources();
```

It fails with `Book.arelTable.join(...).on(...).joinSources is not a function`
— the getter returns an array, and calling the array throws. `ar-153` is one of
two fixtures still failing in the `query-parity-trails` job (see #5264, which
fixed the runners themselves and `ar-01`).

Note the getter also copies (`[...]`) where Rails returns the live array; worth
checking whether any caller depends on the copy before changing the shape.

## Acceptance criteria

- `SelectManager#joinSources` is a method, matching Rails' `join_sources`.
- All existing callers updated (grep `joinSources` across packages/ and scripts/).
- Parity fixture `ar-153` dumps successfully on the trails side.
- Decide and document whether the defensive copy is kept or dropped to match
  Rails' live-array return.
