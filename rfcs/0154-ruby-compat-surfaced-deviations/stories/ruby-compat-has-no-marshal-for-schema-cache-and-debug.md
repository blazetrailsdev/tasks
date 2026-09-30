---
title: "Wire Marshal into the schema cache .dump arm and DebugHelper#debug's probe (TYPE_USRMARSHAL, singleton-method errors)"
status: draft
updated: 2026-09-30
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: ["ruby-compat", "activerecord"]
deps:
  [
    "ruby-compat-marshal-core-types",
    "schema-cache-dump-and-load-through-psych",
    "debug-helper-through-object-to-yaml",
  ]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while authoring the psych-in-ruby-compat RFC, whose Non-goals leave
Marshal out. Two Rails call sites need Ruby's `Marshal`
(`vendor/ruby/v3.3.11/marshal.c:2555` `rb_define_module("Marshal")`, dump
`:1207` `marshal_dump`, load `:2434` `marshal_load`), and trails has no port:

- `SchemaCache._load_from` / `#dump_to`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/schema_cache.rb:232-233,408-409`)
  take the `Marshal` arm when the filename includes `.dump`. That is Rails'
  only non-YAML schema-cache format. `SchemaCache#marshal_dump` /
  `#marshal_load` (`:416-425`) are already ported
  (`packages/activerecord/src/connection-adapters/schema-cache.ts`), so the
  missing piece is the byte format, not the protocol.
- `DebugHelper#debug`
  (`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/debug_helper.rb:29`)
  calls `Marshal.dump(object)` first, as a probe that raises for
  singleton-method objects and so routes them to the `inspect` fallback.

Core types are `ruby-compat-marshal-core-types`. This story adds the
user-marshal and singleton arms and makes the two calls.
`packages/activesupport/src/cache/coder.ts` carries a Marshal stand-in for
cache entries, not a Marshal port. Check it before starting, and converge it
here if it is a partial copy.

Both RFC 0000 stories above carry `@missingRailsCall Marshal… — CONVERGEABLE
ruby-compat-has-no-marshal-for-schema-cache-and-debug` pointing here.

## Acceptance criteria

- [ ] `Marshal` (from `ruby-compat-marshal-core-types`) gains `TYPE_USRMARSHAL`
      (`marshal.c` `w_object`'s `marshal_dump` arm; `r_object`'s
      `marshal_load` arm). `SchemaCache` round-trips through its ported
      `marshalDump` / `marshalLoad`, and a `.dump` file written by Rails
      (checked in under `test-helpers/support`) loads.
- [ ] `Marshal.dump` raises `TypeError` "singleton can't be dumped" for an
      object with singleton methods (`rbObjSingletonClass`, CLAUDE.md), which
      is the arm `debug`'s probe relies on (`debug_helper.rb:29-35`).
- [ ] `SchemaCache._loadFrom` / `#dumpTo` take the `.dump` arm, and `debug`
      calls `Marshal.dump(object)`. Both `@missingRailsCall … CONVERGEABLE`
      receipts pointing here are removed.

## Verification

`pnpm vitest run packages/ruby-compat/src/marshal*.test.ts packages/activerecord/src/connection-adapters/schema-cache.test.ts packages/actionview/src/helpers/debug-helper.test.ts`.
