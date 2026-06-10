---
rfc: "0006-collection-store-unification"
title: "Migrate findTarget and instance-method reads through the proxy"
status: claimed
updated: 2026-06-10
cluster: associations
deps: ["s2-migrate-preloader-writes"]
est-loc: 140
priority: 2
pr: null
claim: "2026-06-10T20:30:45Z"
assignee: "s3-migrate-findtarget-reads"
blocked-by: null
---

# S3 — Migrate findTarget and instance-method reads through the proxy

## Goal

Route `Association#findTarget` (`association.ts:372`) and the read at
`instance-methods.ts:49` through the proxy read accessor introduced in S1, so no
production read path touches `_cachedAssociations` anymore.

## Acceptance

- `findTarget` reads the proxy target.
- `instance-methods.ts:49` reads the proxy target.
- After this story the only remaining references to `_cachedAssociations` are
  the deprecated shim (S1) and the six test pokes.
- No public API change; no test renames.
- `api:compare` delta non-negative.

## Notes

Confirm read-after-preload and read-after-`<<` both return the same array
identity expectations the existing tests assert.
