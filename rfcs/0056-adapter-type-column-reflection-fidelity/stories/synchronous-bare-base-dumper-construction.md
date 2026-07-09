---
title: "Make bare-base SchemaDumper construct the columnSpec emitter synchronously (no adapter-layer load race)"
status: in-progress
updated: 2026-07-09
rfc: "0056-adapter-type-column-reflection-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: 213
pr: 4825
claim: "2026-07-09T10:49:36Z"
assignee: "synchronous-bare-base-dumper-construction"
blocked-by: null
closed-reason: null
---

## Context

PR #4777 unified the base `SchemaDumper.emitTable` onto the single
`columnSpec`/`prepareColumnOptions` dispatch, which (per api:compare) must live
on the `ConnectionAdapters::SchemaDumper` subclass
(`packages/activerecord/src/connection-adapters/abstract/schema-dumper.ts`). The
base (`packages/activerecord/src/schema-dumper.ts`) therefore redirects
construction to that subclass via a registered class slot
(`connectionAdaptersDumper`) set at the subclass module's load.

Because the subclass `extends` the base, the base cannot statically import it
(ESM temporal dead zone — the same cycle already broken for `schema-introspection`
via dynamic import). So the base's synchronous `create` cannot self-load the
subclass: it redirects when the subclass is already loaded, otherwise throws a
clear "no column_spec on the base" error (mirroring Rails, where `SchemaDumper#table`
calls the unqualified `column_spec` private to `ConnectionAdapters::SchemaDumper`
— `schema_dumper.rb:199`, `abstract/schema_dumper.rb:13`). The codebase guarantees
registration in practice (index + every dump entrypoint + `schema-dumping-helper`
load the subclass), but a lone deep import of the internal base module without the
adapter layer would throw. A Codex reviewer flagged this across several rounds.

## Acceptance criteria

- Constructing/dumping through the bare `schema-dumper.ts` `SchemaDumper` for a
  non-adapter source (in-memory MigrationContext / plain SchemaSource) works
  **synchronously without depending on some other module having loaded the
  adapter layer** — no timing-dependent throw, no sync→Promise change.
- api:compare stays green: `column_spec`/`schema_default`/`schema_expression`
  remain mapped in `connection-adapters/abstract/schema-dumper.ts`; base
  `schema_dumper.rb` methods remain mapped in `schema-dumper.ts`.
- Evaluate the two viable approaches and pick one: (a) flatten the
  base/subclass/dialect hierarchy onto the repo's `this`-typed function mixin
  pattern (CLAUDE.md "Module mixins") so the single emitter lives on one class
  with no cyclic `extends`; or (b) split the base class into its own module so
  `schema-dumper.ts` can statically import the subclass and register it
  synchronously, updating the api:compare file mapping accordingly.
- No dump-output change across PG/MySQL/SQLite and the in-memory/mock paths.
