---
title: "credit-mattr-accessor-on-synthesized-file-module"
status: draft
updated: 2026-10-15
rfc: "0169-activejob-package-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activejob/src/serializers.ts` ports `serializers.rb:23-24` as
`mattrAccessor.call(Serializers, "_additionalSerializers")` at top level, but
`parity:api` still lists `_additional_serializers` / `_additional_serializers=`
missing for `serializers.rb`.

Cause: in `scripts/api-compare/extract-ts-api.ts`, the `collectClassAttributeCalls`
pass (~:1179) resolves the call's receiver to `${relPath}:Serializers` only when
that module already exists in `info.modules`, but the synthesized file module
(`autoModKey`, ~:1395-1410) for a file with exported functions and no
class/`new Module` const is created AFTER that pass, so the lookup misses and the
call is dropped.

## Acceptance criteria

- [ ] A top-level `mattrAccessor.call(<X>, ...)` whose receiver names the file's synthesized module credits the accessors to it.
- [ ] `serializers.rb` reads 8/8 in `pnpm parity:api --package activejob`.
