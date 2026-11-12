---
title: "blazetrails/no-swallowed-rejection bans empty .catch and .then rejection handlers"
status: draft
updated: 2026-11-12
rfc: "0000-no-void-promises"
cluster: gate
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

~8 sites silence a rejection with `.catch(() => {})`:
`activemodel/lib/attribute-assignment.ts:37,144,174`,
`activerecord/src/connection-adapters/schema-cache.ts:195`,
`activestorage/lib/attached/one.ts:62`, `trailties/lib/commands/console.ts:60`,
`solid-cable/lib/action-cable/subscription-adapter/solid-cable.ts:86`,
`website/src/lib/frontiers/sw-client.ts:167`.

## Acceptance criteria

- [ ] A rule in `eslint/` reports a `.catch(fn)` or `.then(_, fn)` whose `fn` has an empty body or only returns, with a RuleTester test.
- [ ] It runs repo-wide against an only-shrink count mark seeded at the current count.
