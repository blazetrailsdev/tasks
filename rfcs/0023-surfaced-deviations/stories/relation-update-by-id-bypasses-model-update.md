---
title: "Relation#update/#update! by-id form bypasses model.update"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Already done: relation.ts:5815 and :5832 route the by-id form through this.model.update / this.model.updateBang, matching relation.rb:620-636."
---

## Context

Surfaced by the RFC 0072 model-accessor sweep (PR #5322).

Rails `vendor/rails/activerecord/lib/active_record/relation.rb:620-636`
dispatches the by-id form to the model class, not through the relation:

```ruby
def update(id = :all, attributes) # :nodoc:
  if id == :all
    each { |record| record.update(attributes) }
  else
    model.update(id, attributes)
  end
end
```

`update!` (relation.rb:629-636) is identical with `model.update!`.

trails `packages/activerecord/src/relation.ts` `update` / `updateBang` instead
do `await this.find(id)` then `record.update(...)`. That is a different code
path: `Model.update` has its own semantics for array ids (it maps over them and
returns an array) and does not inherit the relation's scope the way `find` does.

Also note the sentinel differs: Rails uses `id = :all` as the default, trails
uses `undefined` plus an object-shape sniff.

Baseline entries carrying this finding:
`scripts/api-compare/call-mismatches-wide-exclude/activerecord/relation.json`,
`rubyName: update` and `update!`, `call: model`.

## Acceptance criteria

- `update` / `updateBang` route the by-id form through `model.update(id, attrs)`
  / `model.updateBang(id, attrs)`, mirroring relation.rb:620-636.
- Array-id behavior matches `Model.update`'s (returns an array of records).
- Tests mirror the Rails cases verbatim — check
  `vendor/rails/activerecord/test/cases/relations_test.rb` and
  `persistence_test.rb` before writing new ones.
- The `update` / `update!` `model` wide-baseline entries are removed.
