---
title: "Delete registerConstant and the class-path API"
status: blocked
updated: 2026-11-03
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: zw-framework
packages: ["ruby-compat", "activesupport", "arel"]
deps:
  [
    "framework-constant-tables-replace-class-paths",
    "register-x-retires-from-activerecord-tests",
    "register-x-retires-from-other-tests",
  ]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: "2026-11-03T17:52:18Z"
assignee: "delete-register-constant-and-class-path-api"
blocked-by: "Under-scoped: origin/main still has ~1005 registerConstant call sites across 22 packages (activerecord 120, actionpack 109, ruby-compat 88, activejob 70, ...); the done deps (#9645/#9647/#9648) retired registerX, not registerConstant. generatedClassPath is rbModName/rbInspect/exception naming's fallback (exception.ts:43,69, include.ts:254, object.ts:496) and CLAUDE.md keeps class-path tables as ruby-compat internals, so deleting it needs an owner decision on its replacement. Needs splitting into per-package seat-conversion stories (ceiling 800 LOC) before the final delete."
closed-reason: null
---

## Context

`packages/ruby-compat/src/variable.ts:74`, `classpath.ts:30-74`. RFC 0213 § "Framework constants".

## Acceptance criteria

- `registerConstant`, `registerClassPaths`, `generatedClass` and `generatedClassPath` have no references left.
- The call-time inventories in `packages/activesupport/CLAUDE.md` and `packages/arel/CLAUDE.md` are updated.
- `pnpm parity:modules` and the entry import pass.
