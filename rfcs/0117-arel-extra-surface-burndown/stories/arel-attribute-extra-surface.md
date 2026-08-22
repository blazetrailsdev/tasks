---
title: "Retire the extra surface on attributes/attribute.ts"
status: claimed
updated: 2026-08-22
rfc: "0117-arel-extra-surface-burndown"
cluster: null
packages: ["arel"]
deps: ["arel-operator-spellings-in-conventions", "arel-node-accept-removal-members"]
deps-rfc: []
est-loc: 130
priority: 5
pr: null
claim: "2026-08-22T19:48:21Z"
assignee: "arel-attribute-extra-surface"
blocked-by: null
closed-reason: null
---

## Context

`packages/arel/src/attributes/attribute.ts` is arel's **worst file by novel
count**: 18 extras, 11 novel, 7 moved
(`pnpm parity:api:extra --package arel`, 2026-08-22).

Rails counterpart: `vendor/rails/activerecord/lib/arel/attributes/attribute.rb`
— a `Struct.new(:relation, :name)` with `type_caster`, `able_to_type_cast?`,
and the `Expressions` / `Predications` / `AliasPredication` /
`OrderPredications` / `Math` includes.

Novel (post-`arel-operator-spellings-in-conventions`, which retires the 9
`multiply`/`divide`/`bitwise*` rows — do that story first):

- `[ATTRIBUTE_BRAND]` — `attribute.ts:56`, imported from
  `nodes/binary.ts:` — a JS brand symbol used for nominal typing. Rails
  narrows with `is_a?(Arel::Attributes::Attribute)`; `instanceof` is the TS
  equivalent and does not need a brand. Delete the brand and use `instanceof`,
  or, if a genuine circular-import problem blocks that, say so explicitly —
  CLAUDE.md's zero-import slot section is the sanctioned shape, not a brand.
- `relationName` — `attribute.ts:50`, a module-level `export function`. Rails
  reads `relation.name` inline. Fold into its callers
  (`table-ref.ts` is one; that file is retired by its own story) or make it
  private to the module.

Moved: `accept` (retired by `arel-node-accept-removal-members`), `add`
(retired by the conventions story), `constructor`, `name`, `relation`,
`tableAlias`, `typeForAttribute`. Each needs checking against `attribute.rb`
before assuming it is misplaced — `relation` and `name` are the Struct members
and should match, so a `moved` verdict on them points at the _matcher_, not
the code. Check `docs/ruby-ts-conventions.md` and report what you find; if
`Struct.new(:relation, :name)` members are simply not extracted as Ruby
methods, that is a conventions gap worth its own story.

## Acceptance criteria

- `[ATTRIBUTE_BRAND]` and the exported `relationName` are gone from arel's
  public surface (deleted, inlined, or made module-private).
- `pnpm parity:api:extra --package arel` for `attributes/attribute.ts`: novel
  **11 → 0**; the file's remaining rows are moved-only and each is either
  retired or explained in the PR body.
- `pnpm typecheck` clean; `pnpm vitest run packages/arel` green.
- No new `@noRailsEquivalent` tag.
- If the Struct-member `moved` rows turn out to be a conventions gap, file it
  with `pnpm tasks new arel-extra-surface-burndown <slug> --body-file <path>`
  rather than working around it here.
