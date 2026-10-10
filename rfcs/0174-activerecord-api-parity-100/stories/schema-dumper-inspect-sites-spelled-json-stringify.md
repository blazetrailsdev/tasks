---
title: "activerecord: SchemaDumper renders .inspect sites with rbInspect"
status: ready
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/schema-dumper.ts` spells Ruby's `.inspect` as
`JSON.stringify` at 28 sites. trails PR 8536 converged one,
`formatOptions`, onto `rbInspect`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/schema_dumper.rb:355`,
`"#{key}: #{value.inspect}"`). The reviewer flagged the neighbour that was left:
`formatIndexParts`'s non-hash arm returns `JSON.stringify(options)` where Rails
has `options.inspect` (`schema_dumper.rb:358-364`). The rest are in
`indexParts` (`:264-281`), `foreignKeys` (`:316-345`), `checkParts`
(`:305-314`), `indexes` (`:232-244`) and `table` (`:160-230`).

The dumper emits TypeScript, so the two differ where a value is not a string
or number: `rbInspect(null)` is `nil`, which is not a TypeScript literal, and
`JSON.stringify` drops `undefined` and throws on a bigint. Each site needs its
value domain checked before it moves.

## Acceptance criteria

- [ ] Every `.inspect` in the Rails bodies above is `rbInspect` in the port, or the site carries a receipt naming why its value cannot be rendered that way.
- [ ] The dumped schema is byte-identical for every existing schema-dumper test on all three adapters.
