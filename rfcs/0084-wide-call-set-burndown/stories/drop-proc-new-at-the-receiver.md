---
title: "drop-proc-new-at-the-receiver"
status: done
updated: 2026-08-11
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6374
claim: "2026-08-11T19:33:34Z"
assignee: "audit-constructor-idiom-cluster-reasons"
blocked-by: null
closed-reason: null
---

## Context

`Proc.new { ... }` ports to an arrow function, which names no callee at all, so
the Ruby `new` the extractor records can never be satisfied by any TS body. PR
PR #6372 migrated two such rows to `@missingRailsCall` tags
(`postgresql-adapter.ts` `changeColumnForAlter` / `changeColumnNullForAlter`,
against `postgresql/schema_statements.rb:1054` and `:1062`), which is a
permanent exception per site rather than a rule.

`NO_JS_CALL_FORM` (`scripts/api-compare/compare.ts:237-246`) is the register for
"no TS body could ever satisfy this call", but it matches on the bare call NAME
and the name here is `new` — far too broad. `Foo.new` is a real call that the TS
side already satisfies (`extract-ts-api.ts:2919-2921` records `constructor` for
every `new X()`, and `rubyMethodToTs("new")` is `["constructor"]`), so a
name-level entry would silence a converged population.

The receiver is the discriminator, and the Ruby extractor already has it in
hand at the recording site: `walk_for_calls`
(`scripts/api-compare/extract-ruby-api.rb:2305-2334`) passes `node[1]` to
`inert_receiver?` (`:2294-2301`) to demote `xs.map` to a weak call. A
`Proc.new` site is a `:call` whose receiver is `[:var_ref, [:@const, "Proc"]]`.

## Acceptance criteria

- `walk_for_calls` drops `new` at a site whose receiver constant is `Proc`
  (`proc`/`lambda` too, if a vendored occurrence exists — check before adding).
  Per-SITE, like the `inert_receiver?` verdict: a body with both `Proc.new` and
  `Foo.new` still records the second.
- No name-level `NO_JS_CALL_FORM` entry for `new`.
- Unit test in `extract-ruby-api.test.ts` covering both halves (a `Proc.new`
  site dropped, a `Foo.new` site in the same body kept).
- The two `@missingRailsCall` tags PR #6372 minted on
  `packages/activerecord/src/connection-adapters/postgresql-adapter.ts` are
  DELETED — the rule replaces them, and a tag left behind reds
  `parity:api:calls` as STALE.
- `parity:api:calls` row count strictly shrinks; `parity:api:reasons` and
  `parity:api:detached` stay green.
