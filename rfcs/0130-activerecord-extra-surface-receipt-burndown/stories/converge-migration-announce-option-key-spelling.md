---
title: "converge-migration-announce-option-key-spelling"
status: draft
updated: 2026-09-12
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Migration#sayWithTime` announces a schema statement through `formatArguments`, the port of
`format_arguments` (`vendor/rails/activerecord/lib/active_record/migration.rb:1154-1163`), which
renders each argument with `inspect` — so an options Hash prints with Ruby symbol keys:

````text
-- remove_column("widgets", "name", {:if_exists=>true})
```text

trails prints the **camelCase TypeScript key** instead:

```text
-- removeColumn("widgets", "name", {:ifExists=>true})
```text

The `{:` / `=>` Ruby Hash rendering is already there (`rbInspect`); only the key spelling
diverges. trails' options objects carry camelCase keys because that is the TS surface, and
nothing translates them back to the snake_case Rails would have inspected.

Surfaced while adding announce coverage in trails#7729 (`migration.trails.test.ts`, "does not
announce the positional placeholder an options-only overload expands"). That test currently
pins the camelCase output, so it is the test to update when this converges.

The method name itself is already correct — `removeColumn` is the trails spelling of
`remove_column` per `docs/ruby-ts-conventions.md`, and `parity:api` matches on it — so this is
narrowly about Hash KEYS inside an inspected options argument.

## Converged shape

Render option keys snake_cased when inspecting an options Hash for the announce line, so
`format_arguments`' output matches Rails'. The narrow fix is in `Migration#formatArguments`
(`packages/activerecord/src/migration.ts`), which already filters internal options via
`isInternalOption` — the same pass can spell the surviving keys the way Ruby's Symbol keys
read.

Check `rbInspect`'s Hash branch first (`packages/ruby-compat/src/`): if the `{:key=>value}`
rendering lives there, the snake_casing may belong beside it rather than in `formatArguments`,
in which case every inspected options Hash in the repo gains it at once — verify that is
wanted before moving it there, since `inspect` output is asserted in other suites.

## Acceptance criteria

- [ ] `formatArguments` renders an options Hash with snake_cased keys, matching `format_arguments` (`migration.rb:1154-1163`) — `-- removeColumn("widgets", "name", {:if_exists=>true})`.
- [ ] The announce assertions in `migration.trails.test.ts` are updated from the camelCase spelling to the Rails one.
- [ ] No other `rbInspect` assertion in the repo regresses — confirm whether the change belongs in `formatArguments` or in `rbInspect`'s Hash branch before choosing.
````
