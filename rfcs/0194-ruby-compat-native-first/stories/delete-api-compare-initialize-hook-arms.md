---
title: "Delete api-compare's [initialize] hook arms, which no module feeds"
status: draft
updated: 2026-10-26
rfc: "0194-ruby-compat-native-first"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#9321 deleted ruby-compat's module `initialize` hook symbol and `initializeIncludedModules`, following RFC 0188's rule that a module's `initialize` is inlined into the constructor. The api-compare scripts still recognise the hook, but no source defines it any more:

- `scripts/api-compare/extract-ts-api.ts:1635`, `:4018-4056` and `:4246-4304` record a module's `[initialize]` hook;
- `scripts/api-compare/extra-surface.ts:1516-1527` credits `[initialize]` through `initializeIncludedModules`;
- `scripts/api-compare/report-key-reads.ts:179` has a matching arm;
- their tests: `extract-ts-api.test.ts:220,3696`, `extra-surface.test.ts:5014` and `report-key-reads.test.ts:246`.

## Acceptance criteria

- [ ] Every `[initialize]` arm and its test is deleted from the three scripts.
- [ ] `pnpm parity:api`, `parity:api:extra:gate` and `parity:api:inlined` report the same numbers before and after.
