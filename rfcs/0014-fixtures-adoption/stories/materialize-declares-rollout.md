---
title: "Materialize model declares: synthesize fixes + rollout beyond topic/developer"
status: draft
updated: 2026-06-10
rfc: "0014-fixtures-adoption"
cluster: null
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Follow-up to the declare-materialization pilot (PR for
`fixture-declares-generator`). That PR landed:

- `packages/activerecord/scripts/materialize-model-declares.ts` — runs the
  trails-tsc type-virtualizer + auto-import + schema passes and writes the
  synthesized `declare` members back into model source. Default target is the
  5-model pilot set.
- A virtualizer bug fix: scope params with default initializers
  (`scope("withKwargs", (rel, approved = false) => …)`) were emitted verbatim
  into a function **type** position (illegal `name = default`). Now dropped +
  marked optional with an inferred type (fixture `22-scope-default-param`).
- Materialized declares for **topic.ts** and **developer.ts** (typecheck-green).

Three of the five pilot models could NOT be materialized cleanly — each exposes
a real gap in the type-virtualization coverage that must be fixed first:

1. **Unresolved association targets → `TS2304: Cannot find name 'X'`**
   (post.ts, author.ts; ~92 errors). Associations whose target model isn't a
   ported TS class (e.g. `hasMany("commentsWithOrder")` → guessed
   `CommentsWithOrder`, which has no class; also `AuditLog`-style targets) emit
   `AssociationProxy<UnportedClass>` with no import. **Fix:** when the target
   is neither in scope nor in the model registry, `synthesize` should fall
   back to a safe type (`Base`), mirroring how polymorphic belongsTo already
   degrades to `Base`. Emit a `log()`/warning listing dropped targets.

2. **Subclass loader-override incompatibility → `TS2416`** (comment.ts; 4
   errors). A subclass that adds its own `belongsTo` gets a fresh
   `declare loadBelongsTo: (own overloads)` that is **not assignable** to the
   inherited `loadBelongsTo` from its base model (e.g. `SpecialComment` vs
   `Comment`). **Fix:** when a class extends another walked model that already
   emits `loadBelongsTo`/`loadHasOne`, type the subclass loader as
   `Base["loadBelongsTo"] & (own overloads)` so the override stays assignable.
   Guard on whether the base chain actually has that loader.

3. **`static _tableName` not honored for schema-column lookup.** The walker
   captures `static tableName` but the canonical models use `static _tableName`.
   Schema columns currently attach only via the class-name convention
   (`pluralize(underscore(name))`), so `WebTopic` (`_tableName = "topics"`)
   gets no column declares. **Fix:** capture `_tableName` too.

### Key finding — cast removal needs whole-graph materialization

The pilot's premise was that materializing these models would let us strip
`as any` from AR tests. **Measured local drop from topic+developer alone: ~0
casts.** Reasons (verified by sweeping the suite):

- Most Topic/attribute tests define a **test-local `class Topic extends Base`**
  inside the `it(...)` body — the materialized canonical declares don't apply.
- Canonical-model integration tests cast instances to helper types (`as Rec`)
  or access **other, unmaterialized** models (`developer.projects[0].name` —
  `Project` is untyped), so the cast is still required.
- Remaining casts target **framework-internal** members not in the declare set
  (`readAttribute`, `idWas`, `_dirty`, `columnsHash`, `connection`).

So the `as any` payoff is real but only materializes once (a) the **whole
canonical model graph** is materialized and (b) test-local ad-hoc model classes
are migrated to canonical imports. Plan the rollout accordingly — measure the
drop after each wave, not per single model.

## Acceptance criteria

- [ ] `synthesize`: unresolved association targets fall back to `Base` (+ test
      fixture + warning surface). Re-run the generator on post.ts/author.ts →
      typecheck-green.
- [ ] `synthesize`: subclass loaders compose via `Base["loader"] & …` (+ fixture).
      Re-run on comment.ts → typecheck-green.
- [ ] walker captures `static _tableName` for schema-column lookup (+ fixture).
- [ ] Materialize the remaining pilot models (post, author, comment); commit
      declares; whole-repo `pnpm typecheck` green.
- [ ] Define rollout waves over the rest of `test-helpers/models/**`; each wave
      reports the `as any` delta. Keep each PR ≤500 LOC.
- [ ] (Stretch) Convert a representative test file from a test-local model class
      to the canonical import and strip the now-redundant casts, to validate the
      end-to-end payoff.
