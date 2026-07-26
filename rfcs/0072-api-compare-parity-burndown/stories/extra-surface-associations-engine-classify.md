---
title: "extra-surface: classify the associations.ts functional association engine"
status: done
updated: 2026-07-26
rfc: "0072-api-compare-parity-burndown"
cluster: extra-surface
deps:
  [
    "extra-surface-honor-internal-jsdoc-on-file-functions",
    "extra-surface-mixin-pseudo-module-host-leak",
  ]
deps-rfc: []
est-loc: 200
priority: 35
pr: 5341
claim: "2026-07-26T03:10:57Z"
assignee: "extra-surface-associations-engine-classify"
blocked-by: null
closed-reason: null
---

## Context

Found by the `extra-surface-activerecord-top-files-inventory` spike
(2026-07-25). `packages/activerecord/src/associations.ts` carries 33 novel
extras (94 moved, all of which are mixin-host-interface artifact — see the
`__mixin` host-leak story; the 33 novel are real).

Rails' `lib/active_record/associations.rb` is almost entirely documentation
plus the `Associations` module's small public surface (`association`,
`association_cached?`, `init_internals`, the `has_many`/`belongs_to` macro
definitions). trails instead implements a **functional association engine**
in this one file, and none of its function names exist anywhere in Rails —
the behavior lives in `associations/*_association.rb` and
`associations/builder/*.rb` in Rails, split across many files and classes.

The 33 names, grouped by the Rails home they most plausibly belong to:

- **Loaders** — `loadBelongsTo` (`associations.ts:1413`), `loadHasOne`,
  `loadHasMany` (`:1918`), `loadHasManyThrough` (`:2533`),
  `loadHasOneThrough`, `loadHabtm`. Rails: `HasManyAssociation#load_target`
  et al in `associations/*_association.rb`.
- **Builders** — `buildBelongsTo`, `buildHasOne` (`:1843`, JSDoc already
  says "Mirrors: `ActiveRecord::Associations::HasOneAssociation#build_record`"),
  `buildHasManyRelation`, `buildThroughAssociation`, `buildThroughJoinScope`,
  `createThroughAssociation`.
- **Writers** — `setBelongsTo`, `setHasOne`, `setHasMany`.
- **Scope/query helpers** — `applyAssociationScope`, `computeHasManyWhere`,
  `countHasMany`, `habtmTargetFk`, `ownerHasUnresolvedThroughKey`,
  `resolveCounterColumn`, `updateCounterCaches`.
- **Class resolution** — `resolveAssocClass`, `resolveModel`,
  `lookupModelWithAutoload`, `registerModel`, `toSlug`, `qualifiedName`.
- **Lifecycle** — `initializeAssociations`, `fireAssocCallbacks`,
  `touchBelongsToParents`, `reflectLockVersionBump`,
  `attributeNamesList`, `isEqual`.

Note `attributeNamesList`, `isEqual` and `toSlug` in that last group are
mixin-host-interface artifact (declared at `attribute-methods.ts:126` and
`base.ts:4486`) and drop out for free once the `__mixin` story lands — start
by re-running `pnpm api:extra` after that fix so this story works from a
30-name list, not 33.

Four (`applyAssociationScope`, `habtmTargetFk`, `lookupModelWithAutoload`,
`resolveAssocClass`) already carry `@internal` JSDoc and will drop out once
the `@internal`-on-fileFunctions extractor fix lands. Sequence this story
after both tooling fixes to avoid re-deriving.

The remaining ~26 need real classification: the JSDoc on several already
names a Rails method (`buildHasOne` → `HasOneAssociation#build_record`), which
makes them (c) misplaced ports whose home is
`packages/activerecord/src/associations/has-one-association.ts` and siblings —
a genuinely large relocation. Others (`toSlug`, `registerModel`,
`resolveModel`) are trails' model-registry invention with no Rails analogue at
all.

## Acceptance criteria

- A per-name classification of the post-tooling-fix novel list on
  `associations.ts` into: (a) invention to remove, (b) allowlist/`@internal`
  with a written reason, (c) misplaced port with the target Rails-layout TS
  file named, using the `Mirrors:` JSDoc already present where it exists.
- The classification is recorded durably — either applied in this PR for the
  (b) cases, or registered as follow-up stories in this RFC for each (c)
  relocation cluster, each carrying its name list and `associations.ts:<line>`
  refs. Do NOT open sibling PRs yourself.
- Any relocation actually performed in this PR keeps the method in its
  Rails-layout file (`api:compare` requirement) and stays under the 500 LOC
  ceiling; ship the portion that fits and register the rest.
- `pnpm vitest run` over the touched association test files passes; no test
  renames.
- Record `associations.ts` novel before/after in the PR body.

## Fidelity-first policy

Moving toward Rails fidelity is the stated goal of this (and every)
extra-surface story; the allow-set/allowlist is a **last resort**. Before
admitting or keeping any name in the allow-set, first make — or file as its own
story — the fidelity change that would make the entry unnecessary: converge the
TS surface onto the Rails name and Rails-layout file (relocate + rename),
delete the invention, or justify an `@internal` at the declaration site. Only
names that are faithful-but-unmappable (e.g. genuine Ruby file constants or
nested class names present in the matched Rails file) belong in the allow-set;
any other allowlisted entry must cite the filed fidelity story next to it.
