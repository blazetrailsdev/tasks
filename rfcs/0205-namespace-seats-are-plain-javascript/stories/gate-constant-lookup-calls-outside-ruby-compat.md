---
title: "Only-shrink gate on constant-lookup calls outside ruby-compat"
status: closed
updated: 2026-10-30
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "FALSIFIED: lookup calls are allowed again by RFC 0213; a gate on them no longer holds."
---

## Context

CLAUDE.md § "Constant lookup is an import or a registry" (trails#9424): no `constantize`, `safeConstantize`, `rbModConstGet`, `rbModConstDefined`, `rbModConstants`, `rbPathToClass`, `registeredConstant` or `registerConstant` call is added outside ruby-compat. Nothing enforces it. Counts on 2026-10-28 (non-test source): `registerConstant` 279, `constantize` 44, `safeConstantize` 30, `rbModConstGet` 28, `registeredConstant` 16, `isRegisteredConstant` 12, `rbPathToClass` 8, `rbModConstDefined` 7, `rbModConstants` 3.

`pnpm parity:api:sends` (`scripts/`, trails#9129) is the model: per-file count, only-shrink against the `origin/main` merge-base, no mark file.

## Acceptance criteria

- [ ] `pnpm parity:lookups` counts the calls above per file outside `packages/ruby-compat/`, and fails on any file above its merge-base count.
- [ ] Wired into the same CI job as `parity:api:sends`.
- [ ] `registerX` calls are not counted.
