---
title: "Pair a Ruby alias entry against its TS alias binding so build_having_clause stops scoring declaration-only"
status: in-progress
updated: 2026-09-03
rfc: "0131-activemodel-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: 5
pr: 7446
claim: "2026-09-03T15:51:19Z"
assignee: "converge-future-result-event-buffer-instrument"
blocked-by: null
closed-reason: null
---

## Context

`relation.rb` sits at 370/401 after #7410 credited its 55 `VALUE_METHODS`
accessors. Of the 31 rows still missing, `build_having_clause` is one nothing in
the backlog covers, and it is a distinct extractor shape from the two #7410
fixed — not a generator, an **alias**.

Rails aliases the method onto `build_where_clause`:

```ruby
alias :build_having_clause :build_where_clause
```

(`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:1654`;
the target is `def build_where_clause(opts, rest = [])` at `:1613`, and the one
call site is `self.having_clause += build_having_clause(opts, rest)` at `:1202`.)

`extract-ruby-api.rb` credits an alias as its own entry, carrying
`notes: "alias"` and — when the target resolves — the target's params
(`aliasResolved`, `scripts/parity/types.ts:196-215`).

trails ports it faithfully, as the TS spelling of a Ruby alias: a second binding
to the same function in the exported mixin object,

```ts
export const QueryMethodsProtectedInstanceMethods = {
  buildSubquery,
  buildWhereClause,
  buildHavingClause: buildWhereClause,
  ...
```

(`packages/activerecord/src/relation/query-methods.ts:1888-1891`).

But a bare-identifier object-literal member is recorded `bodyless: true` by
design (RFC 0126 — `MethodInfo.bodyless`, `scripts/parity/types.ts:160-172`),
because such a member records no `calls` / `callArgs` and pairing a Ruby body
with it would silently retire every call-parity finding for the method. So the
only declaration compare can see for `buildHavingClause` is bodyless, and
`declarationOnlyInFile` (`scripts/api-compare/compare.ts:1498`) scores the
faithful alias as `[declaration-only]` against `relation.rb`.

The two facts are both right on their own; what is missing is that the Ruby side
already knows this entry is an alias. A `notes: "alias"` Ruby entry has no body
of its own to pair against, so the call-parity concern that motivates
`bodyless` does not arise for it, and the TS alias binding is the correct
counterpart rather than a declaration awaiting a body.

## Converged shape

Pair a Ruby `notes: "alias"` entry against a TS object-literal member that is a
bare reference to a function the same file declares, and score it as ported —
without disturbing the `bodyless` marker itself, which the call gates depend on
for every non-alias member. The TS source does not change: `buildHavingClause:
buildWhereClause` is already the alias Rails writes.

Check the same pairing against the other Ruby aliases in the package before
widening it — `alias :without :excluding` (`query_methods.rb:1585`) is the
sibling case, though `excluding` / `without` additionally carry the invented
`excludingWithCallee` factory tracked by
`excluding-inlines-ids-and-invents-composite-pk-raise` (RFC 0113), so converge
that story's shape first rather than racing it here.

## Acceptance criteria

- A Ruby entry carrying `notes: "alias"` pairs against a TS bare-reference
  object-literal member declared in the mixin's own file, and scores as ported
  rather than `[declaration-only]`.
- `MethodInfo.bodyless` keeps its meaning and its emission for every non-alias
  member; `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green
  with no baseline row added and no mark raised.
- A test in `scripts/api-compare/` pins both directions: an alias-backed pair
  credits, and a bodyless member with NO Ruby alias behind it still scores
  declaration-only.
- activerecord `relation.rb` rises by the `build_having_clause` row; effect on
  every other package reported in the PR body, marks move only via `:tighten`.

## Definition of done

Giving `buildHavingClause` a hand-written body of its own does not close this
story — that would deviate from `query_methods.rb:1654`, which is an alias, not
a second definition. The port is already correct; the pairing is what is missing.
