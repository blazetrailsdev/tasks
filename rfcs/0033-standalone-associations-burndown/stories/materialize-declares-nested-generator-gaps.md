---
title: "materialize-declares-nested-generator-gaps"
status: in-progress
updated: 2026-06-25
rfc: "0033-standalone-associations-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4115
claim: "2026-06-25T12:59:32Z"
assignee: "materialize-declares-nested-generator-gaps"
blocked-by: null
---

## Context

Follow-up to `materialize-declares-nested-class-models` (PR #4036), which
extended the type-virtualization walker (`packages/activerecord/src/type-virtualization/walker.ts`)
to visit model classes nested in `describe`/`it`/function bodies and baked
declares into the seven files that materialized typecheck-green.

Three nested-class files were deferred because the generator
(`packages/activerecord/scripts/materialize-model-declares.ts`) produces
declares that fail `pnpm typecheck`:

- `associations/eager-singularization.test.ts`: associations use a
  `className` option that differs from the actual in-file class name (e.g.
  `class Octopus` registered/referenced as `"EsOctopus"`).
  `resolveAssociationTarget` emits `declare octopus: EsOctopus | null`,
  but no `EsOctopus` type exists → TS2304 "Cannot find name 'EsOctopus'".
- `nested-attributes.test.ts` and
  `validations/association-validation.test.ts`: the no-schema-merge path
  emits `declare id: number` from an explicit `this.attribute("id", ...)`
  call, which collides with `Base`'s `id` accessor → TS2610
  ("'id' is defined as an accessor in Base, but is overridden here as an
  instance property"). `association-validation.test.ts` additionally hits
  TS2322 (a nullable column typed non-null).

## Acceptance criteria

- [ ] Generator skips emitting `declare id` (Base owns the `id` accessor),
      matching how the schema-merge path already skips `id`.
- [ ] Generator resolves/aliases association targets whose runtime
      `className` differs from the in-file class name, OR skips emitting a
      typed declare when the target cannot be resolved (no broken TS2304).
- [ ] Nullable columns render `T | null` consistently (no TS2322).
- [ ] Bake declares into the three files above; `pnpm typecheck` and the
      affected suites stay green. No behavior change.
- [ ] 500-LOC ceiling; single PR from main.
