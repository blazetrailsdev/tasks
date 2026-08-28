---
title: "PG quote_default_expression has no super arm and an expanded array branch"
status: draft
updated: 2026-08-28
rfc: "0077-quoting-binds-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# PG quote_default_expression has no `super` arm and an expanded array branch

## Context

Surfaced while landing #7152
(`abstract-quote-default-expression-has-non-rails-undefined-and-proc-arms`),
which removed the `undefined -> ""`, SqlLiteral and TypeError arms from this
body. Converging those put the rest of the body in front of me; three
divergences from Rails survive.

Rails, `vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/quoting.rb:156-167`:

```ruby
def quote_default_expression(value, column) # :nodoc:
  if value.is_a?(Proc)
    value.call
  elsif column.type == :uuid && value.is_a?(String) && value.include?("()")
    value # Does not quote function default values for UUID columns
  elsif column.respond_to?(:array?)
    type = lookup_cast_type_from_column(column)
    quote(type.serialize(value))
  else
    super
  end
end
```

`packages/activerecord/src/connection-adapters/postgresql/quoting.ts:127-157`
diverges in three ways:

1. **No `else super` arm (rb:165).** A column with no `array` property falls
   out of the `if (column != null && "array" in column)` block with
   `serialized = value` untouched and reaches `quote.call(this, serialized)`.
   Rails' `super` is `abstract/quoting.rb:161-162` —
   `lookup_cast_type(column.sql_type).serialize(value)` then `quote` — so a
   non-array column's default is NOT serialized through its cast type here
   where Rails serializes it. This is the live bug of the three.
2. **The array branch is expanded well past rb:161-163.** Rails is two lines:
   `lookup_cast_type_from_column(column)` then `quote(type.serialize(value))`.
   trails adds an `ArrayData` check, an `OidArray(subtype)` re-serialize
   fallback, a separate `column.array === true` passthrough arm and a
   `castType?.serialize` guard, none of which Rails has.
3. **Signature carries a fourth parameter.** Rails takes `(value, column)`;
   trails takes `(value, column, castTypeLookup?)` and is `async` to await it.
   `lookup_cast_type_from_column` is a self-send on the adapter in Rails
   (`abstract/quoting.rb:139-141`), so the lookup should come off the receiver
   rather than an injected collaborator.

Note `"array" in column` is also not `column.respond_to?(:array?)`: a JS object
literal lacking the key fails the check where a Rails `Column` always responds.

## Converged shape

Four branches matching rb:156-167 — Proc, the uuid `()` passthrough, the array
branch as the bare `quote(type.serialize(value))` of rb:162-163, and an `else`
that delegates to the abstract body. Drop the `castTypeLookup` parameter and
self-send `lookupCastTypeFromColumn` instead; keep the method async only if the
receiver's lookup genuinely is.

## Acceptance criteria

- [ ] The `else` arm delegates to the abstract `quoteDefaultExpression` rather
      than falling through to a bare `quote(value)`.
- [ ] The array branch is `quote(type.serialize(value))`, with the ArrayData /
      OidArray / passthrough sub-arms removed or traced to a Rails line.
- [ ] The signature is `(value, column)`; the cast-type lookup is a self-send.
- [ ] parity:api / parity:test delta non-negative; all three lanes green.
