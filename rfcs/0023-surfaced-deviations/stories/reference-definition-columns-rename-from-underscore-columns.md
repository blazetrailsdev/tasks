---
title: "ReferenceDefinition#_columns should be named columns like Rails"
status: draft
updated: 2026-07-28
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ReferenceDefinition`'s private column list is named `_columns` in trails
(`packages/activerecord/src/connection-adapters/abstract/schema-definitions.ts`,
called from `add`, `addTo` and `columnNames`), where Rails names it `columns`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_definitions.rb:281-287`):

```ruby
def columns
  result = [[column_name, type, options]]
  if polymorphic
    result.unshift(["#{name}_type", :string, polymorphic_options])
  end
  result
end
```

Because the names differ, the wide call-mismatch ratchet cannot match the call
and permanently carries two baseline entries:

- `activerecord  connection-adapters/abstract/schema-definitions.ts  add  columns`
- `activerecord  connection-adapters/abstract/schema-definitions.ts  add_to  columns`

(both in
`scripts/api-compare/call-mismatches-wide-exclude/activerecord/connection-adapters/abstract/schema-definitions.json`,
reason `Baseline (RFC 0047)`).

These were deliberately left in place when #5485 trimmed the seven _converged_
entries around `ReferenceDefinition#add` — they encode a real naming
divergence, not noise, so suppressing them further would be wrong. Renaming
converges them instead.

The underscore was presumably chosen to avoid colliding with
`TableDefinition#columns`, but the two are different classes;
`ReferenceDefinition` has no `columns` member of its own.

Per `feedback_fidelity_of_names_is_the_primary_goal`, the Rails name wins.

## Acceptance criteria

- [ ] `ReferenceDefinition#_columns` renamed to `columns`, matching
      `schema_definitions.rb:281-287`; all three call sites (`add`, `addTo`,
      `columnNames`) updated.
- [ ] The two `columns` entries are removed from
      `call-mismatches-wide-exclude/activerecord/connection-adapters/abstract/schema-definitions.json`
      and `lint-call-mismatches-wide.ts` reports OK (the ratchet only shrinks,
      so a converged entry left in the baseline is itself a CI failure).
- [ ] `api:compare --package activerecord` and
      `test:compare --package activerecord` deltas are non-negative;
      `test:compare --gates --check` exits 0.
- [ ] `schema-definitions.trails.test.ts` (`ReferenceDefinition#add`) and
      `connection-adapters/abstract/` stay green.
