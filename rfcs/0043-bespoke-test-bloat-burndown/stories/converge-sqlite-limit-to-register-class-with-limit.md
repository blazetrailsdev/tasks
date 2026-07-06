---
title: "converge-sqlite-limit-to-register-class-with-limit"
status: ready
updated: 2026-07-06
rfc: "0043-bespoke-test-bloat-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`thread-column-limit-into-cast-type` (PR #4668) made sqlite's
`lookupCastTypeFromColumn` re-thread `column.limit` onto the cast type via a
generic post-construction reflective rebuild
(`new (base.constructor as ...)({ limit, precision, scale })` in
`sqlite3-adapter.ts`). This is safe for every `Type` currently reachable
through sqlite's `initializeTypeMap` (all take only `limit`/`precision`/`scale`),
but it diverges from Rails' actual mechanism and carries an unsound TS cast.

Rails threads the limit at lookup time: `register_class_with_limit`
(`abstract_adapter.rb:919-924`) registers type-map factories that parse the
matched `sql_type` string (with the `(N)` still attached) via `extract_limit`.
There is no separate reconstruct-after-the-fact step. See `quoting.rb:125`
(`lookup_cast_type_from_column` calls `lookup_cast_type(sql_type)`).

trails can't do this directly today because sqlite's `fetchTypeMetadata`
(`sqlite3-adapter.ts` around lines 1136-1148) deliberately strips the `(N)` off
the stored `sqlType` (the paren-stripped base resolves the DSL type name), and
the sqlite type-map factories (`initializeTypeMap`, e.g. the `char` factory
around line 3047) register `StringType` singletons that never call
`extractLimit`. So no raw `varchar(255)` string reaches a limit-bearing factory.

## Acceptance criteria

- Converge sqlite limit-threading onto Rails' `register_class_with_limit`
  mechanism: sqlite type-map factories for limit-bearing families
  (`char`, `binary`, `text`, `int`, `float`) parse the limit from the matched
  `sql_type` string, and the raw un-stripped `sql_type` reaches
  `lookupCastType` — removing the generic reflective reconstruction in
  `lookupCastTypeFromColumn`.
- Preserve DSL type-name resolution that currently depends on the stripped
  `sqlType`.
- No regression in `attributes.test.ts` immutable_strings_by_default retains
  limit information (`typeForAttribute("inferred_string").limit === 255`) or in
  api:compare / test:compare delta.

Hard rules: no `node:*` / `process.*`; async fs only; no new runtime deps;
500 LOC ceiling; single PR from main; test names match Rails verbatim.
