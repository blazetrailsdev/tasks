---
title: "ruby-compat has no Marshal: schema cache .dump arm and DebugHelper#debug's Marshal.dump probe"
status: draft
updated: 2026-09-29
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: ["ruby-compat", "activerecord"]
deps: ["schema-cache-dump-and-load-through-psych", "debug-helper-through-object-to-yaml"]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while authoring RFC 0000-psych-in-ruby-compat, whose Non-goals leave
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

`packages/activesupport/src/cache/coder.ts` carries a Marshal stand-in for
cache entries, not a Marshal port. Check it before starting, and converge it
here if it is a partial copy.

Both RFC 0000 stories above carry `@missingRailsCall Marshal… — CONVERGEABLE
ruby-compat-has-no-marshal-for-schema-cache-and-debug` pointing here.

## Acceptance criteria

- [ ] `packages/ruby-compat/src/marshal.ts` exports a `Marshal` namespace with
      `dump` / `load` for the types a schema cache holds: nil, true/false,
      Integer, String, Symbol (a `":name"` string), Array, Hash, and user
      objects through `marshal_dump` / `marshal_load` (`TYPE_USRMARSHAL`).
      It raises `TypeError` "no \_dump_data is defined for class …" for
      anything else, which is the arm `debug`'s probe relies on. It has
      citations and README rows.
- [ ] Bytes match MRI 4.8 format for those types. The test fixtures are
      produced by the `ruby` on PATH.
- [ ] Both `@missingRailsCall … CONVERGEABLE` tags above are removed and their
      calls are made.

## Verification

`pnpm vitest run packages/ruby-compat/src/marshal*.test.ts packages/activerecord/src/connection-adapters/schema-cache.test.ts packages/actionview/src/helpers/debug-helper.test.ts`.
