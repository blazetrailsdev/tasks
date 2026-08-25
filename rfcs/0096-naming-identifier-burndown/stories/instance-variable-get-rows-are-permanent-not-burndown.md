---
title: "instance_variable_get naming rows belong in the permanent taxonomy, not burndown"
status: done
updated: 2026-08-15
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6566
claim: "2026-08-15T14:45:06Z"
assignee: "wave-1e-relation-batches-finder-spawn-rows"
blocked-by: null
closed-reason: null
---

# `instance_variable_get` naming rows belong in the permanent taxonomy, not burndown

## Context

`wave-4-naming-ar-model` (PR #6560) shipped 6 of its 12 rows. One of the six left
standing is classified `burndown` but can never converge:

`persistence.ts` / `becomes` / `reverse_merge!` — Rails identifier
`instanceVariableGet`, trails identifier `_attributes`.

`vendor/rails/activerecord/lib/active_record/persistence.rb:491`

```ruby
@attributes.reverse_merge!(becoming.instance_variable_get(:@attributes))
```

`instance_variable_get` is Ruby reflection reaching another object's ivar. TS has
no counterpart and needs none — trails reads the field directly
(`becoming._attributes`), which is the _only_ shape the language offers. There is
no converged form to reach, so the row is not burndown work: it is a permanent
class, and leaving it in the burndown set inflates the count
`naming-gate-flip` has to drive to zero.

`scripts/api-compare/naming-taxonomy.ts` already carries permanent classes for
exactly this situation (37 of the 108 in-scope rows at last measurement).

## Converged shape

Add a permanent class to `naming-taxonomy.ts` matching Ruby reflection accessors
(`instance_variable_get` / `instance_variable_set`) whose TS counterpart is a
direct field read or write, with the reason recorded on the class. Then re-run
`pnpm parity:api:calls:args:report` and confirm the in-scope `burndown` count
drops by the rows it reclassifies.

## Acceptance criteria

- [ ] `instance_variable_get`/`instance_variable_set` rows are matched by a named
      permanent class in `scripts/api-compare/naming-taxonomy.ts` with a reason.
- [ ] The classification is derived from the whole in-scope set, not just the
      `persistence.ts` row — sweep for every instance so the class is complete.
- [ ] `pnpm parity:api:calls:args:report` shows the burndown count down by
      exactly the reclassified rows and the permanent count up by the same.
- [ ] No baseline row added, widened or reseeded; `naming` stays report-only.
