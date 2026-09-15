---
title: "IsolatedExecutionState.has should be isKey (key?)"
status: done
updated: 2026-09-15
rfc: "0147-execution-context-at-thread-spawn-sites"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#7822
claim: "2026-09-15T22:30:45Z"
assignee: "isolated-execution-state-has-is-key-predicate"
blocked-by: null
closed-reason: null
---

## Context

`IsolatedExecutionState.has` (`packages/activesupport/src/isolated-execution-state.ts`) ports
`key?` (`activesupport/lib/active_support/isolated_execution_state.rb:44-46`), but
`pnpm parity:api --package activesupport --missing` still lists `key? → isKey` as missing and
`parity:api:extra` counts `has` as novel surface. Callers include `execution-wrapper.ts:133`.
The Thread attribute `active_support_execution_state` (`:7`) is also reported missing as
`activeSupportExecutionState` / `setActiveSupportExecutionState` because trails declares it via
module augmentation on `Thread`.

## Acceptance criteria

- [ ] `has` is renamed to `isKey` (Rails name per docs/ruby-ts-conventions.md) and every caller updated.
- [ ] `parity:api` for `isolated_execution_state.rb` rises; `parity:api:extra` drops `has`.
