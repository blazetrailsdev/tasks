---
title: "loaderForPackage memoizes across its await"
status: claimed
updated: 2026-11-02
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-11-02T16:46:44Z"
assignee: "autoloader-receipts-recheck-after-scan-retires"
blocked-by: null
closed-reason: null
---

## Context

`packages/zeitwerk/src/registry.ts` `loaderForPackage` awaits a `package.json` read and `pushDir` between its `Object.hasOwn` check and its assignment, so two concurrent first calls build two loaders. Its memo must behave as a synchronous `||=`. RFC 0213 still describes the unported per-package loader from Zeitwerk; update it to the owner's decision on trails#9619.

## Acceptance criteria

- Concurrent `loaderForPackage` calls for one `package.json` answer the same loader.
- RFC 0213's README records `loaderForPackage` and that Zeitwerk's per-gem loader and inflector are not ported.
