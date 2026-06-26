---
title: "Materialize model declares: virtualizer/walker gap fixes (post/author/comment)"
status: in-progress
updated: 2026-06-26
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: 26
pr: 4170
claim: "2026-06-26T01:37:00Z"
assignee: "materialize-declares-generator-fixes"
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

## Concrete gap inventory (full-rollout run, PR for materialize-declares-rollout-waves)

A full-directory dry run (generator over all 194 top-level models, then per-file
typecheck-revert) materialized **129 models green** and surfaced **28 broken
models** in five concrete gap classes. The 129 green models shipped; the 28
below were reverted and are the work item for this story:

- **Gap A — Ruby `::`-namespaced `className` emitted verbatim into TS type
  position → syntax error (TS1109/TS1005).** `company.ts`
  (`Namespaced::Client`, `Namespaced::Firm`), `company-in-module.ts`
  (`MyApplication::Business::Firm`, `Nested::Firm`, …). Fix: demodulize /
  resolve the namespaced className to the registered TS class identifier in
  `resolve-target` (and the auto-import pass), instead of pasting the Ruby
  constant path.
- **Gap B — unresolved association target: a `has_many`/`belongs_to` whose
  Rails class name has no corresponding TS model class in scope → `Cannot find
name 'X'` (TS2304).** Bulk of the failures: `author.ts` (66), `member.ts`
  (28), `post.ts` (26), `person.ts` (11), `project.ts`, `friendship.ts`,
  `club.ts`, `category.ts`, `organization.ts`, `member-detail.ts`, `eye.ts`,
  `zine.ts`, `vertex.ts`, `user.ts`, `tag.ts`, `tagging.ts`, `reference.ts`,
  `job.ts`, `hotel.ts`, `categorization.ts`, `cpk.ts` (partial). Names like
  `CommentsWithOrder`, `AuthorsWithSelect`, `NoJoinsComment`, `Sink`,
  `FamilyMember`, `PolymorphicHuman` are Rails scoped/anonymous association
  classes the walker emits as bare identifiers with no import/declaration.
- **Gap C — subclass loader-method override not reflected by the walker:
  subclass `loadBelongsTo`/`loadHasOne`/assoc property not assignable to the
  base type (TS2416).** `chef.ts`, `comment.ts`, `cpk.ts`, `pirate.ts`,
  `post.ts` (mixed with Gap B). The synthesized subclass overload widens/narrows
  vs the base declare.
- **Gap D — `composed_of` aggregation column materialized as its raw DB column
  type, breaking the consumer's value-object cast (TS2322).** `customer.ts`
  materialized `balance: number`; `aggregations.test.ts` casts
  `& { balance: Money }`, yielding impossible `number & Money`. Aggregation
  columns must materialize as the composed value object (or be omitted).
- **Gap E — intentionally-invalid relation fixture (TS2344/TS2304).**
  `user-with-invalid-relation.ts` targets `InfoInvalid` (not a `Base`) /
  `UserInvalid` (undefined) by design. This is a deliberately broken Rails
  fixture; it may be a permanent expected-skip rather than a generator fix —
  decide whether to exclude it from the generator's eligible set.

## Definition of done

`post.ts`/`author.ts`/`comment.ts` materialize green via the generator. This
unblocks `materialize-declares-rollout-waves`.
