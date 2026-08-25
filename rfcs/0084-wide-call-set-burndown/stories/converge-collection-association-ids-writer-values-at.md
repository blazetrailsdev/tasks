---
title: "Converge CollectionAssociation#ids_writer to Hash#values_at"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6409
claim: "2026-08-12T12:26:11Z"
assignee: "call-args-ar-extra-argument-rest-2"
blocked-by: null
closed-reason: null
---

## Context

Left over from `converge-collection-association-load-target-and-ids-writer`
(PR #6396), which re-ported `CollectionAssociation#ids_writer` from the Ruby and
retired five of its six call-set baseline rows. One row survives in
`scripts/api-compare/call-mismatches-exclude/activerecord/associations/collection-association.json`:

- `ids_writer` / `values_at`

Rails (`vendor/rails/activerecord/lib/active_record/associations/collection_association.rb:67-76`)
ends the record resolution with

```ruby
end.values_at(*ids).compact
```

i.e. `Hash#values_at` over the `index_by` result, then `Array#compact`. The
port spells that as
`ids.map((id) => indexed[indexKey(id)]).filter((record) => record != null)`
(`packages/activerecord/src/associations/collection-association.ts`, `idsWriter`),
which is semantically identical but makes no `values_at` call, so the call-set
extractor still flags the row.

ActiveSupport in trails has `valuesAt` only as `ActiveRecord::Base#values_at`
(`packages/activerecord/src/persistence.ts:873` — reads _attributes_ off a
record), not the Ruby `Hash#values_at` / `Array#values_at` core-ext. Converging
means porting the Hash core-ext into `@blazetrails/activesupport` (Ruby's
`Hash#values_at` is core Ruby, not ActiveSupport, so check whether a
`hash-utils.ts` home is the right one under the repo's naming rules) and calling
it here.

Note the adjacent constraint: the port keys its index by an explicit string form
(`indexKey`) because Ruby Hash keys compare by value and a composite primary key
is an array — any `valuesAt` port has to take the same keys, not the raw ids.

## Acceptance criteria

- [ ] `ids_writer` reaches a `valuesAt` over the `index_by` result rather than a
      hand-rolled `map`.
- [ ] The `ids_writer` / `values_at` row is deleted by hand from
      `call-mismatches-exclude/activerecord/associations/collection-association.json`
      (only-shrink; no `--write` reseed of the whole tree).
- [ ] No new `order:` or `args` row added for the converged call.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green; the AR
      association suites pass on all three adapter lanes.
