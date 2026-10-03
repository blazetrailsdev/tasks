---
title: "activerecord: CommandRecorder's invert_ overrides mirror Rails' bodies (extract_options!, in-place mutation, args.size guards)"
status: draft
updated: 2026-10-03
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging the inverse table in trails#8445. The hand-written `invert_…` overrides in
`packages/activerecord/src/migration/command-recorder.ts` now end in Rails' `super`, but several
bodies still differ from `vendor/rails/v8.0.2/activerecord/lib/active_record/migration/command_recorder.rb`:

- `invertRemoveColumn` guards on `typeof args[2] !== "string"`; Rails guards on `args.size <= 2` (`:223-226`).
- `invertAddForeignKey`, `invertAddCheckConstraint`, `invertRemoveCheckConstraint` copy `args` and the
  options hash; Rails mutates `args.last` in place (`:279-282`, `:319-325`, `:327-334`).
- `invertRemoveIndex`, `invertRemoveForeignKey`, `invertRemoveUniqueConstraint`, `invertDropEnum`,
  `invertDropVirtualTable`, `invertAddUniqueConstraint` open-code option extraction; Rails calls
  `args.extract_options!` / `args.dup.extract_options!` (`:245-262`, `:284-296`, `:341-353`, `:355-359`, `:384-388`).
- `invertRenameTable` and `invertRenameColumn` splat a `...rest` Rails does not have (`:215-221`, `:240-243`).
- `invertRenameEnumValue` builds a new hash; Rails swaps `options[:to]` / `options[:from]` in place (`:372-382`).
- `invertChangeColumnNull` copies `args`; Rails assigns `args[2] = !args[2]` (`:274-277`).

## Acceptance criteria

- [ ] Each body above mirrors the Rails method line for line: same guards, same locals (`options`, `table`, `columns`, `to_table`, `reversed_args`), `extractOptionsBang` where Rails calls `extract_options!`, in-place mutation where Rails mutates.
- [ ] `packages/activerecord/src/migration/command-recorder.test.ts` stays green; `pnpm parity:api:calls` and `:calls:args` green with any now-stale baseline row deleted.
