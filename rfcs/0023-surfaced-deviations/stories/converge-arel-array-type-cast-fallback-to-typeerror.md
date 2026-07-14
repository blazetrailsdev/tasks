---
title: "Converge quoteArrayLiteral's type_cast fallback arms onto Rails' TypeError raise"
status: draft
updated: 2026-07-14
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
closed-reason: null
---

## Context

Surfaced while implementing `converge-arel-array-string-elements-to-content-based-quoting`
(PR #4872), which split `quoteArrayLiteral` into Rails' two stages. The
`type_cast`-equivalent stage now exists as `typeCastArrayElement`
(`packages/arel/src/quote-array.ts:50-75`), which made a second divergence
legible: its **fallback arms have no Rails counterpart**.

Rails' `type_cast` (`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/quoting.rb:94-107`)
is a closed set of arms ending in a raise:

```ruby
when Symbol, ActiveSupport::Multibyte::Chars, Type::Binary::Data then value.to_s
when true       then unquoted_true
when false      then unquoted_false
when BigDecimal then value.to_s("F")
when nil, Numeric, String then value
when Type::Time::Value then quoted_time(value)
when Date, Time then quoted_date(value)
else raise TypeError, "can't cast #{value.class.name}"   # :105
```

trails instead falls through to, in order:

1. a duck-typed `toISOString` arm returning **bare ISO-8601** — no Rails path
   emits ISO-8601; `when Date, Time` goes through `quoted_date`, and this arm
   is in practice unreachable from the only caller
   (`packages/arel/src/visitors/postgresql.ts:134` passes `formatArrayDate`,
   which intercepts every `toISOString` object first and returns `quotedDate`);
2. `JSON.stringify(value, bigintReplacer)` for any other object — so a POJO
   silently encodes as `{"{\"id\":\"42\"}"}` where Rails raises TypeError;
3. `String(value)` for anything else (functions, symbols).

So trails silently encodes values Rails refuses. This is a fidelity gap, not a
live bug — no in-repo caller reaches arms 2 or 3.

## Acceptance criteria

- [ ] `typeCastArrayElement`'s arms mirror `type_cast`'s closed set; unmapped
      values raise a TypeError matching Rails' message shape rather than being
      JSON- or String-encoded.
- [ ] The bare-ISO-8601 arm is removed or routed through the `quotedDate`
      equivalent, so no path emits a format Rails never produces.
- [ ] `quote-array.test.ts`'s "handles bigint values inside objects" and
      "handles objects with toISOString" pin the current fallback behaviour and
      must be replaced, not worked around.
- [ ] api:compare / test:compare delta non-negative.

## Dependencies / notes

- Sequence **after** `arel-quote-delegates-to-connection-like-rails` (#4868,
  in-progress): if Arel stops formatting values and delegates to the
  connection, this whole path may move or disappear — check whether the story
  is still live before starting.
- Related, already tracked: `converge-arel-array-booleans-to-unquoted-true`
  (#4869) owns the `TRUE`/`FALSE` -> `unquoted_true` arm. Don't touch it here.
- Rails' PG `quote` only encodes an `OID::Array::Data`
  (`postgresql/quoting.rb:117`) and sends a bare `::Array` to `super`
  (TypeError). trails reaches `quoteArrayLiteral` with a bare JS array, which
  is why there's no subtype/delimiter to thread — relevant if the raise is
  ported literally.
