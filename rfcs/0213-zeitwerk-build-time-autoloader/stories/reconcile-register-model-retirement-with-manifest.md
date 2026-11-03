---
title: "reconcile-register-model-retirement-with-manifest"
status: in-progress
updated: 2026-11-03
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9658
claim: "2026-11-03T04:36:40Z"
assignee: "reconcile-register-model-retirement-with-manifest"
blocked-by: null
closed-reason: null
---

## Context

On trails#9644 the owner chose to keep `registerModel` as the call in the generated manifest (`packages/activerecord-cli/src/generate-manifest.ts:221-231`) and rejected a separately named seat. `register-x-retires-from-other-tests` and RFC 0213 § "`registerX` retires" still say `registerModel` is deleted, and root CLAUDE.md § "Constant lookup is an import or a registry" says it retires.

## Acceptance criteria

- RFC 0213, root CLAUDE.md and `register-x-retires-from-other-tests` state what happens to `registerModel`, consistent with the owner's decision and with `generated-model-manifest-is-a-build-artifact`.
