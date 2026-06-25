---
title: "Materialize model declares: migrate test-local model classes + strip redundant as any"
status: ready
updated: 2026-06-25
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: ["materialize-declares-rollout-waves"]
deps-rfc: []
est-loc: 300
priority: 49
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Final materialize sub-track step. With baked declares on the canonical models
(dep), the `as any` casts AR tests used to reach typed `.replies`/`.mentor`/
columns/enums are now redundant. This story:

1. migrates remaining test-local `class X extends Base` definitions onto the
   canonical materialized models (where a canonical model exists), and
2. strips the now-redundant `as any` casts those tests carried.

This compounds with the canonical-schema burndown: tests that ride canonical
models AND drop their casts read like the Rails source.

## Acceptance criteria

- [ ] Replace test-local model classes with canonical materialized models where
      one exists (otherwise leave the local class, but typed).
- [ ] Remove `as any` casts that the baked declares make redundant; a cast that
      is still load-bearing stays (with a one-line reason if non-obvious).
- [ ] No `@ts-expect-error`/`as any` is added to mask a real type gap — fix the
      model/generator instead.
- [ ] `pnpm tsc` passes; touched test files still pass `pnpm vitest run`.

## Definition of done

Test-local model duplicates are migrated to canonical models and redundant
`as any` casts are gone. No new casts mask real gaps.
