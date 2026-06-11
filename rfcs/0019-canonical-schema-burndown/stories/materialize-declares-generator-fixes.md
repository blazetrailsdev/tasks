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

Follow-up to the declare-materialization pilot (trails PR #3099), which landed
`packages/activerecord/scripts/materialize-model-declares.ts` — runs the
trails-tsc type-virtualizer + auto-import + schema passes and writes the
synthesized `declare` members back into model source — and materialized declares
for `topic.ts` and `developer.ts` (typecheck-green). Three of the five pilot
models could not be materialized cleanly; each exposes a real gap in the
type-virtualization coverage that blocks the rest of the rollout. This story
fixes those three gaps, then materializes the remaining pilot models.

## Acceptance criteria

- [ ] `synthesize` falls back to `Base` for unresolved association targets. When
      a target model is neither in scope nor in the model registry (e.g.
      `hasMany("commentsWithOrder")` → `CommentsWithOrder`, `AuditLog`-style
      targets), emit `AssociationProxy<Base>` rather than an unimported class,
      mirroring how polymorphic belongsTo already degrades to `Base`. Surface a
      `log()`/warning listing the dropped targets. Fixes `post.ts`/`author.ts`
      (~92 TS2304). Add a virtualize fixture covering the fallback.
- [ ] `synthesize` composes subclass loader overrides as
      `Base["loadBelongsTo"] & (own overloads)` so a subclass adding its own
      `belongsTo` stays assignable to the inherited loader (e.g. `SpecialComment`
      vs `Comment`). Guard on whether the base chain actually emits that loader.
      Fixes `comment.ts` (TS2416). Add a fixture.
- [ ] The walker captures `static _tableName` in addition to `static tableName`
      for schema-column lookup; canonical models use `_tableName`, so models like
      `WebTopic` (`_tableName = "topics"`) currently get no column declares. Add a
      fixture.
- [ ] Materialize `post.ts`, `author.ts`, and `comment.ts`; commit the declares;
      whole-repo `pnpm typecheck` green.

## Notes

Schema columns attach via the class-name convention
(`pluralize(underscore(name))`) and, after this story, via `_tableName`. Keep the
warning surface concise — one line per dropped association target is enough to
audit coverage gaps in later waves.
