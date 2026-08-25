---
title: "SQLite quote's bare-ArrayBuffer arm has no Rails counterpart"
status: done
updated: 2026-08-09
rfc: "0077-quoting-binds-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: 6294
claim: "2026-08-09T19:29:15Z"
assignee: "fold-bind-for-pg-into-type-cast"
blocked-by: null
closed-reason: null
---

## Context

Noticed while removing the String/Symbol arms from SQLite's `quote` in #6288
(`dialect-quotestring-returns-literal-not-escape-only`).

Rails' `SQLite3::Quoting#quote`
(`activerecord/lib/active_record/connection_adapters/sqlite3/quoting.rb:52-59`)
has exactly one arm:

```ruby
def quote(value) # :nodoc:
  case value
  when Numeric
    if value.finite?
      super
    else
      "'#{value}'"
    end
  else
    super
  end
end
```

After #6288, trails' `sqlite3/quoting.ts` `quote` matches that except for one
extra arm:

```ts
if (value instanceof ArrayBuffer) return dispatchQuotedBinary(this, value);
```

A **bare** `ArrayBuffer` has no Rails counterpart — Rails only ever reaches
`quote` with a `Type::Binary::Data` (rb:83 in the abstract), and nothing inside
trails produces one either. Byte _views_ need no arm: they fall through to the
abstract `ArrayBuffer.isView` branch, which self-dispatches back to SQLite's
`quotedBinary` — which is exactly why PG's equivalent branch was already
deleted. The arm survives only as a boundary affordance for a JS caller handing
a bare buffer to `quoteDefaultExpression` (`t.binary(col, { default })`), and its
sole exerciser is the trails test "quotes a binary default through SQLite's
quotedBinary".

## Converged shape

Delete the arm so SQLite's `quote` is the rb:52-59 body plus the inherited
`super`. Decide the boundary case deliberately rather than by a silent extra
arm: either normalize a bare `ArrayBuffer` to a view where it enters
(`quoteDefaultExpression`), or let it reach the abstract raise
(`can't quote ArrayBuffer`, `abstract/quoting.rb:87`) as any other unquotable
object does. Update the one trails test accordingly.

## Acceptance criteria

- [ ] `sqlite3/quoting.ts` `quote` has no `ArrayBuffer` arm.
- [ ] Byte views still reach SQLite's `quotedBinary` through the abstract
      `isView` branch (unchanged behaviour).
- [ ] The bare-`ArrayBuffer` boundary has an explicit, cited disposition.
- [ ] parity:api / parity:test delta non-negative; SQLite suite green.
