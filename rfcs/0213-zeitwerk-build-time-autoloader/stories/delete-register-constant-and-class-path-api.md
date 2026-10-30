---
title: "Delete registerConstant and the class-path API"
status: ready
updated: 2026-10-30
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
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/ruby-compat/src/variable.ts:74`, `classpath.ts:30-74`. RFC 0213 § "Framework constants".

## Acceptance criteria

- `registerConstant`, `registerClassPaths`, `generatedClass` and `generatedClassPath` have no references left.
- The call-time inventories in `packages/activesupport/CLAUDE.md` and `packages/arel/CLAUDE.md` are updated.
- `pnpm parity:modules` and the entry import pass.
