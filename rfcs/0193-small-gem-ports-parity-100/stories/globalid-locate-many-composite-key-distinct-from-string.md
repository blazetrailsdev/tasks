---
title: "globalid: locateMany record index keeps an Array id distinct from its String spelling"
status: draft
updated: 2026-10-22
rfc: "0193-small-gem-ports-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`BaseLocator#locate_many` (`vendor/globalid/v1.3.0/lib/global_id/locator.rb:181-187`) indexes records with `index_by` keyed by `record.id.map(&:to_s)` for a composite id. A Ruby Hash keeps an Array key distinct from a String key. `packages/globalid/src/locator.ts#locateMany` (trails#9230) keys a null-prototype object with `String(record.id.map(String))`, so a composite id `["a","b"]` collides with a scalar id `"a,b"`.

## Acceptance criteria

- [ ] The record index distinguishes an Array key from a String key, as a Ruby Hash does (for example, an `rbHash`-keyed Hash or a Map with an unambiguous key), and the lookup by `gid.modelId` uses the same key.
- [ ] A test locates a composite-key record and a scalar-id record whose string spellings coincide.
