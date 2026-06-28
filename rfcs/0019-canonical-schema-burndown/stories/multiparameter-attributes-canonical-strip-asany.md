---
title: "Converge multiparameter-attributes.test.ts onto canonical Topic + strip as-any casts"
status: done
updated: 2026-06-28
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: 83
pr: 4219
claim: "2026-06-27T17:26:35Z"
assignee: "multiparameter-attributes-canonical-strip-asany"
blocked-by: null
---

## Context

`packages/activerecord/src/multiparameter-attributes.test.ts` defines a bespoke
in-function `class Topic extends Base` in ~34 `it()` blocks and reaches its
columns via `(topic as any).last_read` / `(topic as any).written_on` /
`(topic as any).bonus_time` casts (34 occurrences). The canonical `Topic` model
(`test-helpers/models/topic.ts`) now carries baked typed declares for exactly
these columns, so this file is a candidate for canonical convergence + cast
removal — the unfinished half of `materialize-declares-strip-asany` (PR #4190),
which deliberately scoped out test-local-class migrations as all-or-nothing
per-file work.

Mirrors Rails `activerecord/test/cases/multiparameter_attributes_test.rb`.

## Acceptance criteria

- [ ] Replace the bespoke per-test `class Topic extends Base` blocks with the
      canonical `Topic` model + canonical `TEST_SCHEMA`/fixtures (watch the
      esbuild same-name rename gotcha — import aliased if a local `Topic` must
      coexist).
- [ ] Strip the now-redundant `(topic as any).<column>` casts that the baked
      declares make unnecessary; keep load-bearing casts (e.g. `.attributes =`
      bulk-assign) with a one-line reason.
- [ ] No `as any` / `@ts-expect-error` added to mask a real gap.
- [ ] Test names unchanged; `pnpm tsc` green; the file passes `pnpm vitest run`.
