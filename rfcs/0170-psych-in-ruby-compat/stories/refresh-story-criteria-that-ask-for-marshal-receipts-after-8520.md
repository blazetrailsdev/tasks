---
title: "Three draft stories still ask for Marshal receipts and arms that trails#8520 already landed"
status: draft
updated: 2026-10-05
rfc: "0170-psych-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8520 merged `ruby-compat-has-no-marshal-for-schema-cache-and-debug`:
`SchemaCache._loadFrom` / `#dumpTo` call `Marshal.load` / `Marshal.dump`
(`packages/activerecord/src/connection-adapters/schema-cache.ts`,
`schema_cache.rb:232-233,408-409`) and `DebugHelper#debug` calls
`Marshal.dump(object)` (`packages/actionview/src/helpers/debug-helper.ts`,
`debug_helper.rb:29`). Three draft stories still describe the old state:

- `schema-cache-dump-and-load-through-psych` (RFC 0170) has the criterion "A
  `.dump` filename keeps today's behaviour, and the `Marshal.load` /
  `Marshal.dump` calls carry `@missingRailsCall … — CONVERGEABLE
ruby-compat-has-no-marshal-for-schema-cache-and-debug`", and "Each of the nine
  classes is registered under its Ruby constant name" — both are done.
- `debug-helper-through-object-to-yaml` (RFC 0170) has "`Marshal.dump` carries
  `@missingRailsCall … — CONVERGEABLE ruby-compat-has-no-marshal-for-schema-cache-and-debug`".
- `schema-cache-load-from-ports-the-marshal-and-yaml-load-arms` (RFC 0174) lists
  "The `.dump` (Marshal) arm is absent" and "The `@missingRailsCall load`
  receipt is deleted"; both are done. Its YAML-arm and `try` / `catch` items
  remain. The YAML arm now reads bytes through `File.binread` and
  `forceEncoding(file, Encoding.UTF_8)`.

A receipt pointing at a done story is what these criteria would now produce.

## Acceptance criteria

- [ ] The three story files are edited (markdown PR in the tasks repo) so each
      criterion describes work that is still open, with the #8520 state stated
      in Context.
- [ ] No story asks for a receipt naming
      `ruby-compat-has-no-marshal-for-schema-cache-and-debug`.

## Verification

`grep -rn "ruby-compat-has-no-marshal-for-schema-cache-and-debug" rfcs/*/stories/*.md` in the tasks repo lists only the story itself and historical Context mentions.
