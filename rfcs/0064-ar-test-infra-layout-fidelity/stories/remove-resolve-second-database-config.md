---
title: "Delete resolveSecondDatabaseConfig now that the named arunit2 entry owns the config"
status: draft
updated: 2026-07-27
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`resolveSecondDatabaseConfig` / `ResolvedSecondDatabase` / `SecondDatabaseConfig`
(`packages/activerecord/src/support/arunit2-config.ts:59-85`) built an ad-hoc
arunit2 connection config for callers that established their own second pool.

PR #5414 removed both runtime callers: `connect()` establishes `ARUnit2Model` from
the named `"arunit2"` entry that `expandConfig` publishes in
`Base.configurations` (`support/connection.ts`, mirroring `connection.rb:33`),
and `base-prevent-writes.test.ts` dropped its own `establishConnection`. The
only remaining callers are `arunit2-config.test.ts`'s own unit tests, so the
function is dead surface that duplicates the named-entry path — and a second,
divergent source of truth for what "the arunit2 config" is.

`arunitDatabaseNames` and `databaseName` in the same module stay: `connection.ts`
and the MySQL test-helper both use them.

## Acceptance criteria

- `resolveSecondDatabaseConfig` and its two exported types are deleted, along
  with the tests that only cover them.
- `arunit2-config.ts`'s module doc stops describing a resolver that no longer
  exists.
