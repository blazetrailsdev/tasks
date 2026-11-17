---
title: "indexBy keeps insertion order for integer-like string keys"
status: draft
updated: 2026-11-17
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`index_by` (`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/enumerable.rb:52-60`) always answers the one Hash it built, so insertion order holds for every key. After trails#10236, `indexBy` (`packages/activesupport/lib/enumerable-utils.ts`) answers a ruby-compat `Hash` for non-string keys or an empty collection, and a null-proto plain object when every key is a string. That branch was kept by operator ruling on 2026-11-17, so string-keyed callers whose ported surface is a plain object (`SchemaCache#columnsHash`, `packages/activerecord/lib/connection-adapters/schema-cache.ts:457`; `loadFixtures`, `test-fixtures.ts:353`; `MailersController#attachmentsFor`; `CollectionAssociation#idsWriter`) stay unchanged. Two gaps remain:

- Integer-like string keys (`"10"`, `"2"`, e.g. a `String(id)` key in `idsWriter`) come back in numeric order in the plain object, where Ruby keeps insertion order.
- An empty collection answers an empty `Hash` under the `K extends string` → `Record<K, T>` overload, and an empty relation does the same under `Relation#indexBy` (`packages/activerecord/lib/relation.ts`).

## Acceptance criteria

- A string-keyed `indexBy` result keeps insertion order for integer-like string keys, either because the switch also answers a `Hash` for them with the affected callers converged, or because those callers move to `Hash`.
- The `indexBy` / `Relation#indexBy` overloads match what is returned at runtime for an empty input.
