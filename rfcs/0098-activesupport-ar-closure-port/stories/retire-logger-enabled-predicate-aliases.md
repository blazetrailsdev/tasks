---
title: "Retire Logger's *Enabled predicate aliases in favour of the quoted-literal ports"
status: done
updated: 2026-08-14
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6535
claim: "2026-08-14T18:15:07Z"
assignee: "executor-seam-end-to-end-request-coverage"
blocked-by: null
closed-reason: null
---

# Retire Logger's `*Enabled` predicate aliases in favour of the quoted-literal ports

## Context

`packages/activesupport/src/logger.ts:250-262` and
`packages/activesupport/src/broadcast-logger.ts` each expose the severity
predicate TWICE: the faithful quoted-literal port (`get "debug?"`, matching
`Logger#debug?` and `broadcast_logger.rb:167-213`) and a trails-invented
`debugEnabled` / `infoEnabled` / `warnEnabled` / `errorEnabled` / `fatalEnabled`
alias with no Ruby counterpart. `pnpm parity:api:extra --package activesupport`
scores all ten as novel surface (broadcast-logger.ts: 5 novel, all of them; the
same five on logger.ts) — measured on #6531, after that PR taught extra-surface
to credit the literal spelling.

Rails has one name per predicate. The aliases are the only reason the file
carries two.

Live callers to migrate: `packages/activesupport/src/null-logger.ts:9` (doc
only), `null-logger.test.ts:24-25`, `silence-logger.test.ts:22-26`.

## Acceptance criteria

- [ ] The five `*Enabled` getters are deleted from `logger.ts` and
      `broadcast-logger.ts`; callers read `logger["debug?"]`.
- [ ] `pnpm parity:api:extra --package activesupport` drops 10 novel names.
- [ ] `pnpm parity:api` / `pnpm parity:test` deltas non-negative.
