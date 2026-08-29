---
title: "Parameter-name drift: the postgresql/sqlite3 Column constructors' anonymous-splat misalignment"
status: ready
updated: 2026-08-29
rfc: "0128-parameter-name-drift-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`param-drift-activerecord-concrete-adapters` (PR #7191) cleared every
parameter-name row in `connection_adapters/{postgresql,mysql,sqlite3}*` except
six, which are a positional misalignment rather than a rename and so were left
alone. Its sibling
`param-drift-positional-misalignment-is-a-dropped-parameter` is already `done`,
so these six are now unowned.

`API_COMPARE_FORCE=1 pnpm parity:api --package activerecord --params` still
reports:

```text
  connection-adapters/postgresql/column.ts:constructor  @1  ruby `serial`      ts `defaultValue`
  connection-adapters/postgresql/column.ts:constructor  @2  ruby `identity`    ts `sqlTypeMetadata`
  connection-adapters/postgresql/column.ts:constructor  @3  ruby `generated`   ts `null_`
  connection-adapters/sqlite3/column.ts:constructor  @1  ruby `autoIncrement`  ts `defaultValue`
  connection-adapters/sqlite3/column.ts:constructor  @2  ruby `rowid`          ts `sqlTypeMetadata`
  connection-adapters/sqlite3/column.ts:constructor  @3  ruby `generatedType`  ts `null_`
```

These are not renames. Rails spells both constructors with an **anonymous
splat** that forwards to `super`, so its own named parameters are only the
kwargs:

- `activerecord/lib/active_record/connection_adapters/postgresql/column.rb:9`
  — `def initialize(*, serial: nil, identity: nil, generated: nil, **)`
- `activerecord/lib/active_record/connection_adapters/sqlite3/column.rb:9`
  — `def initialize(*, auto_increment: nil, rowid: false, generated_type: nil, **)`

The TS constructors spell the whole forwarded list (`name`, `defaultValue`,
`sqlTypeMetadata`, `null_`, …) followed by the kwargs, so the comparer lines
Rails' `serial:` up against TS's `defaultValue` and every later position is
shifted by the same amount. Each reported pair is an artefact of that shift; no
individual position is independently wrong.

## Acceptance criteria

- The six rows above no longer appear in
  `API_COMPARE_FORCE=1 pnpm parity:api --package activerecord --params`.
- Whatever shape resolves it is justified against the two Rails `file:line`
  above — either the TS constructors converge on Rails' forwarding shape, or
  the comparer learns to align an anonymous splat, whichever the RFC's
  "three shapes" analysis says this is.
- No behaviour change and no test renamed; `parity:api` methods and arity
  figures unmoved; `parity:api:calls` and `parity:api:calls:args` no new row.
- No exclude register is added — there is none for parameter names, and a
  position that genuinely cannot carry the Rails name is a `pnpm tasks block`
  naming the language shortcoming.
