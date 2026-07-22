---
title: "groupedAggregate group_key/val aliases are invented; converge onto ColumnAliasTracker names"
status: draft
updated: 2026-07-22
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #5074 converged the _aggregate_ alias in
`packages/activerecord/src/relation/calculations.ts:groupedAggregate` onto
Rails' `column_alias_for("#{operation} #{column_name}")` (`sum_credit_limit`,
`count_all`; calculations.rb:537), but two invented aliases remain:

- The **group key** is projected as `AS group_key`
  (calculations.ts:~484 `new Nodes.As(groupNode, new Nodes.SqlLiteral("group_key"))`),
  where Rails aliases each group field via
  `ColumnAliasTracker#alias_for(field.to_s.downcase)` — e.g. `firm_id`,
  `companies_firm_id` — and zips `group_aliases`/`group_fields`
  (vendor/rails/activerecord/lib/active_record/relation/calculations.rb:528-548).
  Rails' tracker also dedupes collisions (`_2` suffix); trails has a ported
  `ColumnAliasTracker` class (calculations.ts:~1260) that groupedAggregate
  never uses.
- `singleAggregate` (calculations.ts:~426) projects `AS "val"`; Rails'
  `execute_simple_calculation` uses no invented alias
  (calculations.rb:465-505).
- `wrapBigintAgg` (calculations.ts:~307) hardcodes both invented names.

Any test asserting grouped-calculation SQL or reading raw result columns sees
non-Rails aliases; `having`-clause select_values merging
(calculations.rb:541 `select_values += self.select_values unless
having_clause.empty?`) is also unported.

## Acceptance criteria

- [ ] groupedAggregate projects group fields with `ColumnAliasTracker`-derived
      aliases (Rails names), not `group_key`; result-row reads updated.
- [ ] Multi-lane green; no test:compare regression.
