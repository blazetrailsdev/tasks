---
title: "activerecord: Association#marshal_dump / marshal_load round-trip every instance variable"
status: draft
updated: 2026-10-01
rfc: "0174-activerecord-api-parity-100"
cluster: receipts
packages: ["activerecord"]
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

Surfaced by the `activerecord-audit-permanent-receipts-associations` audit: the receipt below was `PERMANENT`, no CLAUDE.md section ratifies it, and it is re-tagged `CONVERGEABLE` onto this story.

`Association#marshal_dump` maps over the object's own instance variables
(`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/association.rb:206-209`):

```ruby
def marshal_dump
  ivars = (instance_variables - [:@reflection, :@through_reflection]).map { |name| [name, instance_variable_get(name)] }
  [@reflection.name, ivars]
end
```

and `marshal_load` (`:211-218`) writes each pair back with `instance_variable_set`.

`packages/activerecord/src/associations/association.ts` `marshalDump` hand-lists two fields
(`loaded`, `target`) and carries `@missingRailsCall map`; `marshalLoad` restores those two. Every
other ivar a subclass holds (`@stale_state`, `@association_ids`, `@replaced_or_added_targets`,
`@through_records`, …) is dropped on a round trip. ruby-compat already ports the reflection Rails uses:
`rbObjInstanceVariables` / `rbObjIvarGet` / `rbObjIvarSet` (`packages/ruby-compat/README.md`).

`activerecord-converge-missing-control-flow-arms-associations` lists `marshalLoad`'s missing loop; this
story owns the pair, so that row closes with it.

## Acceptance criteria

- [ ] `marshalDump` maps `rbObjInstanceVariables(this)` minus `@reflection` / `@through_reflection` to `[name, value]` pairs, as `association.rb:207` does.
- [ ] `marshalLoad` sets each pair back and re-resolves `@reflection` from the owner's class, as `:211-218` does.
- [ ] The `@missingRailsCall map` receipt is deleted; `pnpm parity:api:calls` green with no new row.
- [ ] The marshal round-trip tests for associations pass.

## Verification

```bash
pnpm parity:api:calls && pnpm vitest run packages/activerecord/src/marshal-serialization.test.ts
```
