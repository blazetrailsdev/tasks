---
title: "i18n-api-tests-mount-localization-in-remaining-api-suites"
status: draft
updated: 2026-11-19
rfc: "0245-i18n-test-parity-100"
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

`vendor/i18n/v1.14.8/test/api/lazy_loadable_test.rb:16-19` includes `I18n::Tests::Localization::{Date,DateTime,Time,Procs}`, but `packages/i18n/test/api/lazy-loadable.test.ts` mounts none of `testsLocalizationDate` / `testsLocalizationDateTime` / `testsLocalizationTime` / `testsLocalizationProcs` (`packages/i18n/test/support/tests/localization/*.ts`). The same modules are also included by `test/api/{cascade,pluralization,memoize,all_features}_test.rb`, which have no trails counterpart file yet.

## Acceptance criteria

- [ ] `lazy-loadable.test.ts` calls the four localization registrars, in Rails' include order.
- [ ] `test/api/{cascade,pluralization,memoize,all-features}.test.ts` exist, mirroring their Rails setup and includes, or a story per file is filed.
- [ ] `pnpm parity:test -- --package i18n` shows no new misses for those rows.
