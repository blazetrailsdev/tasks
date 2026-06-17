---
title: "Converge integration.test.ts to canonical Developer/Firm/fixtures"
status: ready
updated: 2026-06-17
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: ["timestamp-alias-resolution-fidelity"]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Sibling of `converge-partial-decl-models-updated-at` (which converged
`cache-key.test.ts` to the canonical AR `CacheKeyTest` using
`CacheMe`/`CacheMeWithVersion`). `packages/activerecord/src/integration.test.ts`
still uses a bespoke `defineSchema` that redefines the canonical `developers`,
`firms`, `clients`, and `cached_developers` tables with partial shapes plus
inline partial-declaration model classes.

The Rails source is `vendor/rails/activerecord/test/cases/integration_test.rb`
(uses fixtures: `Developer.first`, `Firm.find(4)`, `Client.first`,
`CachedDeveloper.first`, `owners(:blackbeard)`/`pets(:parrot)`, `Cpk::Order`).
Canonical models already exist: `test-helpers/models/developer.ts`
(`Developer`, `CachedDeveloper`), `company.ts` (`Firm`, `Client`),
`cpk/order.ts`, plus `developers`/`companies`/`owners`/`pets` fixtures.

BLOCKED-BY `timestamp-alias-resolution-fidelity`: the canonical `developers`
table has `legacy_updated_at` + `aliasAttribute("updated_at",...)`, so until
trails resolves timestamp aliases, `Developer.cacheKey()` is `developers/id`
(not Rails' `developers/id-<ts>`). `CachedDeveloper` also needs
`cacheTimestampFormat = "number"` (Rails developer.rb:351) added to the canonical
model.

## Acceptance criteria

- [ ] Port `integration_test.rb` bodies word-for-word; names unchanged.
- [ ] Replace bespoke `defineSchema`/inline models with canonical
      `Developer`/`CachedDeveloper`/`Firm`/`Client`/`Cpk::Order` +
      `useHandlerFixtures(["developers","companies","owners","pets"])`.
- [ ] Add `cacheTimestampFormat = "number"` to canonical `CachedDeveloper`.
- [ ] cacheKey/cacheVersion assertions are Rails-faithful (`developers/id-<ts>`).
- [ ] Port `test_cache_key_changes_when_child_touched` using `Owner`/`Pet`
      (Pet `belongsTo("owner",{touch:true})`).

## Definition of done

`integration.test.ts` uses canonical models/fixtures with Rails-faithful
cacheKey/cacheVersion expectations, after the alias-resolution fix lands.
