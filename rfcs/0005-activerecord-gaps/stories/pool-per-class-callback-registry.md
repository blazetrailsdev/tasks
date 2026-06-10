---
title: "Per-class clone-on-write callback registry on AbstractAdapter"
status: in-progress
updated: 2026-06-10
rfc: "0005-activerecord-gaps"
cluster: connection-pool
deps: []
deps-rfc: []
est-loc: 15
pr: 3087
claim: "2026-06-10T15:35:04Z"
assignee: "pool-per-class-callback-registry"
blocked-by: null
---

## Context

`AbstractAdapter` uses a single shared static checkout/checkin callback registry
(matches Rails today). A per-class clone-on-write registry is only needed if a
concrete adapter ever registers its own callbacks.

## Acceptance criteria

- [ ] Per-class clone-on-write callback registry added on `AbstractAdapter`
- [ ] Shared-static behavior preserved when no concrete adapter overrides

## Notes

From the connection-pool gap plan (PF per-class callbacks). Status `draft` —
~15 LOC, only pursue when a concrete adapter actually needs its own callbacks.
