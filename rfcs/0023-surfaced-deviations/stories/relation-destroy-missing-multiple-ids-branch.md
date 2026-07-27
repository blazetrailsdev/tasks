---
title: "Relation#destroy is missing the multiple-ids / composite-PK branch"
status: ready
updated: 2026-07-27
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the RFC 0072 model-accessor sweep (PR #5322).

Rails `vendor/rails/activerecord/lib/active_record/relation.rb:1083-1092`:

```ruby
def destroy(id)
  multiple_ids = if model.composite_primary_key?
    id.first.is_a?(Array)
  else
    id.is_a?(Array)
  end

  if multiple_ids
    find(id).each(&:destroy)
  else
    find(id).destroy
  end
end
```

trails `packages/activerecord/src/relation.ts` `destroy` has no multiple-id
branch at all — it does `find(id)` then `record.destroy()`, so
`Todo.destroy([1, 2, 3])` destroys whatever single object `find` returns rather
than each record. The composite-primary-key discrimination (`id.first.is_a?(Array)`
vs `id.is_a?(Array)`) is also absent, which matters because a CPK id is itself
an array and must not be mistaken for a list of ids.

Baseline entry carrying this finding:
`scripts/api-compare/call-mismatches-wide-exclude/activerecord/relation.json`,
`rubyName: destroy`, `call: model`.

## Acceptance criteria

- `destroy` branches on `model.compositePrimaryKey` exactly as relation.rb:1084
  does, and destroys each record for the multiple-id case.
- Covers both the single-PK array form and the composite-PK form.
- Tests mirror the Rails cases verbatim (check
  `vendor/rails/activerecord/test/cases/` first).
- The `destroy` / `model` wide-baseline entry is removed.
