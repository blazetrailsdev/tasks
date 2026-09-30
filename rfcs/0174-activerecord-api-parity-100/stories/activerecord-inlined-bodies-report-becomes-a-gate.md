---
title: "tooling: gate parity:api:extra's inlined-module-bodies report at zero for activerecord"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: placement
packages: ["activerecord"]
deps:
  [
    "activerecord-relocate-query-methods-bodies-inlined-in-relation",
    "activerecord-relocate-callbacks-bodies-inlined-in-base",
    "activerecord-relocate-pg-schema-statements-bodies-inlined-in-adapter",
    "activerecord-relocate-core-bodies-inlined-in-base",
    "activerecord-relocate-persistence-model-schema-counter-cache-bodies",
    "activerecord-relocate-remaining-base-hosted-inlined-bodies",
    "activerecord-relocate-adapter-hosted-inlined-bodies",
    "activerecord-relocate-relation-type-and-association-inlined-bodies",
    "activerecord-deduplicable-deduplicated-and-unary-minus",
  ]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The inlined-from report is printed by `parity:api:extra` and gates nothing, so a burned-down count can
grow back unseen. Once the eight `activerecord-relocate-*` stories land it should read 0 for activerecord;
this story makes it a hard zero in `lint-extra-surface-ratchet.ts` for rowless packages (activerecord,
and arel/activemodel once they go rowless).

## Acceptance criteria

- [ ] `parity:api:extra:gate` fails when a rowless package reports an inlined-from body, with a test.
- [ ] CLAUDE.md step 4 mentions the inlined dimension in one sentence.

## Verification

```bash
pnpm parity:api:extra --package activerecord && pnpm parity:api:moves && pnpm parity:api:extra:gate && pnpm lint --fix
```
