---
title: "Resolve attribute aliases in timestamp/cache-key reads (Rails timestamp.rb parity)"
status: ready
updated: 2026-06-17
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`vendor/rails/activerecord/lib/active_record/timestamp.rb` resolves timestamp
attribute aliases before reading: `timestamp_attributes_for_create/update`
map `["created_at"/"updated_at", ...]` through `attribute_aliases[name] || name`
(timestamp.rb:92-97), and `max_updated_column_timestamp` reads them via
`self[attr]` (alias-aware, timestamp.rb:163-167). `cache_version`
(integration.rb:97-115) reads `updated_at` via the alias-aware reader.

trails deviates: `timestamp.ts` `timestampAttributesForCreateInModel` /
`timestampAttributesForUpdateInModel` filter hardcoded `CREATED_ATTRS` /
`UPDATED_ATTRS` against `columnNames()` WITHOUT alias resolution, and
`integration.ts` `maxUpdatedColumnTimestamp` (~88-100) iterates the hardcoded
`["updated_at","updated_on"]` reading via `_readAttribute` (NOT alias-aware).
Verified: for the canonical `Developer` model (table `developers` has
`legacy_updated_at` + `aliasAttribute("updated_at","legacy_updated_at")`),
`maxUpdatedColumnTimestamp` returns null → `cacheKey()` is `developers/1`, but
Rails yields `developers/1-<ts>`. `hasAttribute("updated_at")` IS alias-aware
and `readAttribute("updated_at")` resolves, but `_readAttribute` does not.

## Acceptance criteria

- [ ] `timestampAttributesForCreate/UpdateInModel` resolve `created_at`/
      `updated_at`/`*_on` through `_attributeAliases` to the real column names
      before intersecting with `columnNames()`, matching Rails timestamp.rb:92-97.
- [ ] `maxUpdatedColumnTimestamp` reads via the alias-aware reader (Rails
      `self[attr]`), so aliased timestamp models (e.g. `Developer` →
      `legacy_updated_at`) produce `model/id-<ts>` cache keys.
- [ ] `cacheVersion` reads `updated_at` alias-aware (already partly: it uses
      `readAttribute` — verify against Developer alias).
- [ ] Blast radius checked: fixture auto-timestamp filling
      (`allTimestampAttributesInModel`), `touch`, and create-time timestamps now
      apply to aliased-timestamp models. Run touch/timestamp/fixtures/cache test
      files; rely on CI for the full suite.
- [ ] Add focused tests proving `Developer.first.cacheKey()` is `developers/id-<ts>`.

## Definition of done

Aliased timestamp columns participate in cache keys / fixture timestamping /
touch exactly as Rails. This unblocks converging `integration.test.ts` to the
canonical `Developer` model.
