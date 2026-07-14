---
title: "arel-raw-value-dispatch-raises-like-rails"
status: claimed
updated: 2026-07-14
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-14T19:51:09Z"
assignee: "arel-raw-value-dispatch-raises-like-rails"
blocked-by: null
closed-reason: null
---

## Context

Rails' Arel dispatches a **raw value** reaching `visit` on its Ruby class. Only
`Integer` renders — `visit_Integer` is a bare `collector << o.to_s`
(`vendor/rails/activerecord/lib/arel/visitors/to_sql.rb:824-826`). Every other
raw scalar aliases to `unsupported` and **raises `UnsupportedVisitError`**
(`to_sql.rb:828-845`):

```ruby
def unsupported(o, collector)
  raise UnsupportedVisitError.new(o)
end

alias :visit_BigDecimal :unsupported
alias :visit_Date       :unsupported
alias :visit_DateTime   :unsupported
alias :visit_FalseClass :unsupported
alias :visit_Float      :unsupported
alias :visit_Hash       :unsupported
alias :visit_NilClass   :unsupported
alias :visit_String     :unsupported
alias :visit_Symbol     :unsupported
alias :visit_Time       :unsupported
alias :visit_TrueClass  :unsupported
```

Trails' `visitNodeOrValue` (`packages/arel/src/visitors/to-sql.ts:2026-2064`) is
the port of that raw-value path — see PR #4871, which established the mapping and
documented this residue in place. It **renders** where Rails raises:

- `null`/`undefined` → `"NULL"` (Rails: `visit_NilClass` raises)
- `string` → `quote(v)` (Rails: `visit_String` raises)
- non-integral `number` e.g. `1.5` → bare `String(v)` (Rails: `visit_Float` raises)
- non-finite `number` (`Infinity`/`NaN`) → `quote(v)` (Rails: Float → raises)
- `boolean` → `quote(v)` (Rails: `visit_TrueClass`/`visit_FalseClass` raise)
- date-like → `quotedDate(v)` (Rails: `visit_Date`/`visit_Time` raise)

Two of these are _invented conditions_ rather than merely permissive dispatch:
the branch splits on `Number.isFinite`, where Rails' analogous split is
Integer-vs-Float (`Number.isInteger`); and the non-finite → `quote()` fallback
has no Rails counterpart at all.

Note the AR-facing path is unaffected: `predications`' `in()`/`eq()` wrap values
via `quotedNode` (`packages/arel/src/predications.ts:142-151`) into `Casted`
nodes, which correctly route through `quote()` (`to_sql.rb:87-90`). This story
concerns only raw values placed directly into nodes.

Converging is a caller-facing narrowing (it turns rendering into a raise), so it
needs a caller audit first — this is why it was documented rather than widened
into #4871 rather than being ratified as acceptable. Per the standing
converge-never-ratify rule, it is registered here to be converged, not accepted.

## Acceptance criteria

- [ ] Audit callers that place raw non-Integer scalars directly into nodes
      (`git grep` for direct `new Nodes.*` construction with literals; the
      `predications` path is out of scope — it wraps in `Casted`).
- [ ] Raw-value dispatch in `visitNodeOrValue` raises `UnsupportedVisitError`
      for the scalars Rails aliases to `unsupported` (`to_sql.rb:828-845`), OR
      each surviving branch is documented with the specific Rails anchor and the
      caller that requires it.
- [ ] The `Number.isFinite` split is either replaced by the Rails-shaped
      `Number.isInteger` (Integer renders, Float raises) or documented as an
      invented condition with the caller requiring it.
- [ ] Existing callers migrated to the `Casted`/`quotedNode` path where they
      relied on the tolerance.
- [ ] api:compare / test:compare delta non-negative.
