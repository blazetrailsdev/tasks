---
title: "Fold ar-config.ts's last two seats into the ActiveRecord module"
status: in-progress
updated: 2026-09-15
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps:
  - move-ar-umbrella-seats-batch-3
deps-rfc: []
est-loc: 150
priority: null
pr: trails#7795
claim: "2026-09-15T15:22:27Z"
assignee: "fold-ar-config-into-active-record-module"
blocked-by: null
closed-reason: null
---

## Context

Step 5 of six. `packages/activerecord/src/ar-config.ts` is a trails invention with no Rails counterpart: an
`ActiveRecord` object standing in for the real `ActiveRecord` module's singleton config. RFC 0081 built it by
moving seats _into_ it; `converge-ar-config-module-seats-onto-their-rails-files` (trails#7723, done) emptied
it of 27 of them under the flattening rule, leaving two seats plus one helper:

- `indexNestedAttributeErrors` — `active_record.rb:321`, `singleton_class.attr_accessor :index_nested_attribute_errors`
- `schemaCacheIgnoredTables` — `active_record.rb:197`
- `isSchemaCacheIgnoredTable` — `def self.schema_cache_ignored_table?` (`active_record.rb:205-209`), currently
  carrying `@noRailsEquivalent CONVERGEABLE inline-ruby-bodies-extracted-as-named-helpers`

The object itself carries `@noRailsEquivalent CONVERGEABLE relocate-ar-config-seats-onto-base`. That story
pointed the seats at `Base`, which is the flattening this campaign is undoing — it is closed as superseded by
this one, which sends them to the real `ActiveRecord` module instead.

Readers: `associations/nested-error.ts:65`, `connection-adapters/schema-cache.ts:442` (via
`isSchemaCacheIgnoredTable`), and the tests `autosave-association.test.ts`, `nested-error.test.ts`,
`connection-adapters/schema-cache.test.ts` (13 sites in all).

The schema-cache read sits on a standalone adapter's path, so it must be shown safe for the `sqlite-drivers`
lane (see CLAUDE.md § "Call-time constant resolution" and its guarded-read list) before it becomes an
unguarded module read.

`AsyncExecutor` and its `post` are a separate question — both already carry `@noRailsEquivalent PERMANENT`,
and they are out of scope here. If `ar-config.ts` would otherwise be empty, say where they land; do not
convert them as a drive-by.

## Acceptance criteria

- `indexNestedAttributeErrors` and `schemaCacheIgnoredTables` are accessor pairs on the `ActiveRecord` module
  in `packages/activerecord/src/active-record.ts`, at their `active_record.rb` positions.
- `isSchemaCacheIgnoredTable` moves there as the port of `schema_cache_ignored_table?` and its
  `inline-ruby-bodies-extracted-as-named-helpers` receipt is deleted — it now has a Rails counterpart.
- Its body uses `any(...)` from `@blazetrails/activesupport` enumerable-utils, mirroring Ruby's
  `any?` (`active_record.rb:205-209`). A hand-rolled `for` loop reds `pnpm parity:api:calls` on `any?`, and a
  baseline row is not the fix.
- The `ActiveRecord` object in `ar-config.ts` and its `relocate-ar-config-seats-onto-base` receipt are
  deleted, not delegated. All 13 readers repoint.
- `relocate-ar-config-seats-onto-base` is closed as superseded.
- `pnpm parity:api:extra --package activerecord` shows no extra for `ar-config.ts`'s `ActiveRecord`;
  `extra:gate` green with no STALE tag; `pnpm parity:api:calls`, `:calls:args`, `:params` clean.
