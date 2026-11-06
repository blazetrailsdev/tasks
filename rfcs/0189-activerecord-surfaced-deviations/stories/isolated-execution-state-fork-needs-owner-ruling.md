---
title: "isolated-execution-state-fork-needs-owner-ruling"
status: closed
updated: 2026-11-06
rfc: "0189-activerecord-surfaced-deviations"
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
closed-reason: 'PERMANENT: the repo owner ratified the one IsolatedExecutionState.fork opening call on 2026-11-05 (CLAUDE.md, "A thread-local block stack forks per async block"); receipts are PERMANENT in trails#9769.'
---

## Context

`thread-local-block-stacks-fork-per-async-block-at-the-root` moved the per-async-block
fork out of `packages/activerecord/src/encryption/contexts.ts` into
`IsolatedExecutionState.fork(key, block)` (`packages/activesupport/src/isolated-execution-state.ts`),
which `get` / `set` / `isKey` read through, so `threadMattrAccessor` needs no
accessor re-definition. One opening call remains at block entry:
`Contexts.withEncryptionContext` wraps Rails' body
(`vendor/rails/v8.0.2/activerecord/lib/active_record/encryption/contexts.rb:33-43`)
in `IsolatedExecutionState.fork(...)`, receipted `@inventedArm fork`, and
`fork` carries `@noRailsEquivalent CONVERGEABLE` against this story. Rails has no
such call: a Ruby thread-local read is already per-thread, and one trails
`Thread` holds many in-flight promises.

## Acceptance criteria

- [ ] The repo owner rules on the one opening call (ratify it as PERMANENT with a
      CLAUDE.md section, or name a mechanism that needs no call at block entry).
- [ ] The `fork` and `withEncryptionContext` receipts are rewritten to match the ruling.
