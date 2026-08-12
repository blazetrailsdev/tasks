---
title: "Converge Enumerable#in_order_of to Rails' group_by/values_at + sort_by shape"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: 6413
claim: "2026-08-12T13:46:05Z"
assignee: "call-args-ar-host-param-connection-adapters-rest"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #6409, which ported Ruby's `Hash#values_at` as `valuesAt`
(`packages/activesupport/src/hash-utils.ts`) for
`CollectionAssociation#ids_writer`. Adding that TS name made the call-set
extractor score a PRE-EXISTING divergence in `inOrderOf`, so the PR had to add
a baseline row (`scripts/api-compare/call-mismatches-exclude/activesupport/enumerable-utils.json`,
`in_order_of` / `values_at`).

Rails (`activesupport/lib/active_support/core_ext/enumerable.rb:197-203`):

```ruby
def in_order_of(key, series, filter: true)
  if filter
    group_by(&key).values_at(*series).flatten(1).compact
  else
    sort_by { |v| series.index(v.public_send(key)) || series.size }.compact
  end
end
```

trails `inOrderOf` (`packages/activesupport/src/enumerable-utils.ts:187`)
seeds a `Map` from `series`, buckets the collection into it, then walks the
series — same ordering and filter semantics, but it makes no `group_by` and no
`values_at` call, and it hand-rolls the `filter: false` arm instead of
`sort_by`.

The blocker the PR recorded: Ruby Hash keys compare by VALUE, and `series`
holds arbitrary attribute values (Integer, String, nil), so the string-keyed
`valuesAt` core-ext added for `ids_writer` cannot express it. That is a reason
the CURRENT spelling exists, not a reason to keep it — the convergence
question is whether `groupBy` + a value-keyed `valuesAt` (Map-based, or the
existing `Map` seeded and read through a `valuesAt` overload) reproduces
Rails' three-call shape.

## Converged shape

`inOrderOf` reaches `groupBy(collection, fn)` then a `valuesAt` over that
result for the `filter: true` arm, and `sortBy` with
`series.indexOf(...) ?? series.length` for the `filter: false` arm, matching
enumerable.rb:199 and :201 term for term.

## Acceptance criteria

1. `inOrderOf` makes the calls Rails makes, verified against
   `enumerable.rb:197-203`.
2. The `in_order_of` / `values_at` row is DELETED by hand from
   `call-mismatches-exclude/activesupport/enumerable-utils.json`
   (only-shrink; never `--write`).
3. No new `args` row for the converged call; `parity:api:calls` and
   `parity:api:calls:args` green.
4. `enumerable-extended.test.ts` / `core-ext/enumerable.test.ts` stay green,
   including the `filter: false` and nil-key cases.
