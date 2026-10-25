---
title: "send-count: drop the dead rbFPublicSend arm from SEND_PATTERN"
status: done
updated: 2026-10-25
rfc: "0194-ruby-compat-native-first"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: trails#9297
claim: "2026-10-25T00:50:39Z"
assignee: "rescue-from-ports-respond-to-case-equals"
blocked-by: null
closed-reason: null
---

## Context

trails#9266 removed `rbFPublicSend`, so every send is `rbFSend`. `SEND_PATTERN` in `scripts/parity/send-count.ts` is still `rbF(Public)?Send\(…`, kept so the merge-base count stayed comparable while the rename was in flight. Once main carries no `rbFPublicSend`, the `(Public)?` arm and the `rbFPublicSend` mentions in its JSDoc and in `send-count.test.ts` are dead.

## Acceptance criteria

- [ ] `SEND_PATTERN` matches `rbFSend` only, and its JSDoc names `rbFSend` only.
- [ ] `send-count.test.ts` cases use `rbFSend`.
- [ ] `pnpm parity:api:sends` stays green.
