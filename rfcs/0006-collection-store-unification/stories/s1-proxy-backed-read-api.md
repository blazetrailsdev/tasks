---
id: S1
rfc: "0008-collection-store-unification"
title: "Proxy-backed read API with deprecated cache shim"
status: draft
cluster: associations
deps: []
est_loc: 180
---

# S1 — Proxy-backed read API with deprecated cache shim

## Goal

Introduce a read path on `CollectionProxy` that exposes the loaded targets as
the canonical store, and turn `_cachedAssociations` into a deprecated shim that
delegates to that read path. No write paths change yet — this story is purely
additive so later stories can migrate callers one at a time.

## Acceptance

- `CollectionProxy` exposes an internal read accessor returning the loaded
  target array (single source of truth).
- `_cachedAssociations` reads route through the proxy accessor; the existing
  six test files that poke it directly still pass untouched.
- No public API change; no test renames.
- `api:compare` delta non-negative on
  `collection_association.rb` / `collection_proxy.rb`.

## Notes

Keep the shim `@internal`-tagged. Map `string | string[]` primary keys when the
proxy identifies targets.
