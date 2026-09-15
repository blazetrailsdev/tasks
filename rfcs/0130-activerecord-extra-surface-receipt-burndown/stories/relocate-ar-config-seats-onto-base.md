---
title: "relocate-ar-config-seats-onto-base"
status: closed
updated: 2026-09-15
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "superseded by fold-ar-config-into-active-record-module"
---

## Context

`packages/activerecord/src/ar-config.ts` exports `ActiveRecord`, a trails object holding two
`ActiveRecord` singleton config seats: `indexNestedAttributeErrors`
(`vendor/rails/activerecord/lib/active_record.rb`, `singleton_class.attr_accessor :index_nested_attribute_errors`)
and `schemaCacheIgnoredTables` (`active_record.rb:196-209`, plus `schema_cache_ignored_table?` at `:205`,
ported as `isSchemaCacheIgnoredTable`). CLAUDE.md "Call-time constant resolution" ratifies these seats as
`static` accessor pairs on `Base` (the api manifest flattens `active_record.rb`'s singleton config onto
`base.rb`), and `writingRole` / `readingRole` already moved there in
`receipt-moved-base-flattened-module-seats`. The object carries a `@noRailsEquivalent CONVERGEABLE` receipt
pointing here.

Readers: `associations/nested-error.ts:65`, `connection-adapters/schema-cache.ts:442` (via
`isSchemaCacheIgnoredTable`), tests `autosave-association.test.ts`, `nested-error.test.ts`,
`connection-adapters/schema-cache.test.ts`. The schema-cache read sits on a standalone adapter's path, so a
`_Base` read there must first be shown safe for the `sqlite-drivers` lane (see CLAUDE.md's guarded-read list).

## Acceptance criteria

- `indexNestedAttributeErrors` and `schemaCacheIgnoredTables` are `static` accessor pairs on `Base`; readers
  use `_Base!.<seat>` (or the documented guarded form where the adapter lane reaches it).
- The `ActiveRecord` object in `ar-config.ts` and its receipt are deleted.
- `pnpm parity:api:extra --package activerecord` shows no extra for `ar-config.ts`'s `ActiveRecord`.
