---
title: "flattened_args port drops hash direction values from disallow_raw_sql!"
status: closed
updated: 2026-08-18
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Already converged: flattenedOrderKeysForRawSqlCheck is gone; query-methods.ts:2210 now has flattenedArgs as Rails' recursive flat_map over toA(e) (query_methods.rb:2077-2079), and preprocessOrderArgs:2534 feeds its full result — Hash keys AND direction values — to disallowRawSqlBang."
---

## Context

Surfaced while converging `order!`/`reorder!` onto `preprocessOrderArgs` (PR #5937).

`preprocess_order_args` feeds `disallow_raw_sql!` the result of
`flattened_args`, which flattens a Hash via `to_a`:

```ruby
def flattened_args(args)
  args.flat_map { |e| (e.is_a?(Hash) || e.is_a?(Array)) ? flattened_args(e.to_a) : e }
end
```

(`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:2077-2079`)

`Hash#to_a` yields `[[key, value], ...]`, so **both** the column key and the
direction value reach `disallow_raw_sql!`. trails'
`flattenedOrderKeysForRawSqlCheck`
(`packages/activerecord/src/relation/query-methods.ts`) pushes only keys —
the direction value is never checked against the column-name-with-order matcher.

Benign today because `validateOrderArgs` independently restricts directions to
asc/desc (and those match the matcher anyway), so no unsafe value can slip
through. But the two guards are not equivalent to Rails': trails relies on
`validate_order_args` where Rails is defended by both, and the helper's name and
shape encode the wrong rule.

Note the helper is also _narrower_ than Rails' by design in one respect: it
skips Arel nodes, which `disallow_raw_sql!` would skip anyway. That part is
fine; only the dropped direction values are the divergence.

## Acceptance criteria

- [ ] The raw-SQL pre-check flattens hash/Map args the way Ruby's
      `Hash#to_a` + `flattened_args` does, so direction values are included.
- [ ] The helper is named/shaped after Rails' `flattened_args` rather than
      "keys for raw sql check".
- [ ] `order("invalid; DROP")` and hash forms with a bogus direction still
      raise the same errors as today.
- [ ] No regression in `unsafe-raw-sql.test.ts` or the order suites.
