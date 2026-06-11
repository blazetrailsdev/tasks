---
title: "Materialize model declares: virtualizer/walker gap fixes (post/author/comment)"
status: draft
updated: 2026-06-11
rfc: "0019-canonical-schema-burndown"
cluster: null
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

Tooling sub-track that supports the burndown (lets converted tests drop `as any`
casts). `packages/activerecord/scripts/materialize-model-declares.ts` runs the
trails-tsc virtualizer and bakes `declare` members into canonical test-helper
model source so models carry their typed surface directly.

The pilot set is `["topic.ts", "developer.ts"]`. `post.ts`/`author.ts`/
`comment.ts` are explicitly excluded because each hits a virtualizer/walker gap
that would write **broken** declares:

- unresolved association target (a `has_many`/`belongs_to` whose target the
  resolver can't find),
- subclass loader-method override not reflected by the walker,
- `_tableName` gap (model whose table name isn't statically resolvable).

This story fixes those gaps in `src/type-virtualization/` (walker / virtualize /
resolve-target) so `post.ts`/`author.ts`/`comment.ts` materialize typecheck-green.

## Acceptance criteria

- [ ] Reproduce each gap by running the generator on `post.ts`/`author.ts`/
      `comment.ts` and capturing the broken/missing declare.
- [ ] Fix the virtualizer/walker/resolve-target gap (cite the failing input).
- [ ] `pnpm tsx packages/activerecord/scripts/materialize-model-declares.ts
post.ts author.ts comment.ts` writes typecheck-green declares; the three
      models compile with no hand-edits.
- [ ] Existing pilot (`topic.ts`/`developer.ts`) still materializes green
      (no regression).

## Definition of done

`post.ts`/`author.ts`/`comment.ts` materialize green via the generator. This
unblocks `materialize-declares-rollout-waves`.
