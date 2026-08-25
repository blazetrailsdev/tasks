---
title: "Move the belongs_to autosave halt into the defined save method and use throwAbort"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6409
claim: "2026-08-12T12:26:11Z"
assignee: "call-args-ar-extra-argument-rest-2"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging the has_one raise site in
`converge-autosave-has-one-rollback-raise` (PR #6393), which left the belongs_to
arm of `addAutosaveAssociationCallbacks` untouched.

Rails `add_autosave_association_callbacks`
(`vendor/rails/activerecord/lib/active_record/autosave_association.rb:212-214`):

    else
      define_non_cyclic_method(save_method) { throw(:abort) if save_belongs_to_association(reflection) == false }
      before_save save_method
    end

The `== false` check and the `throw(:abort)` live INSIDE the defined
`save_method`; the `before_save` registration is a bare method reference.

trails (`packages/activerecord/src/autosave-association.ts`,
`addAutosaveAssociationCallbacks`, else branch) splits it the other way: the
defined method just returns `saveBelongsToAssociation.call(this, reflection)`,
and the `beforeSave` lambda does the halting by resolving the result and
returning `false as unknown as void` instead of throwing abort:

    beforeSave(model, (record: any): Promise<void> =>
      Promise.resolve(record[saveMethod]()).then((ok: boolean) =>
        ok ? undefined : (false as unknown as void)));

Two divergences: the halt decision sits in the wrong method, and the halt is a
falsy return cast through `unknown` rather than trails' `throwAbort()` — which
is the settled port of `throw(:abort)` and is already used by the canonical test
models (`test-helpers/models/ship.ts:52`, `pirate.ts:146`).

## Acceptance criteria

1. The defined `saveMethod` for belongs_to performs the
   `=== false` check and calls `throwAbort()`, matching
   `autosave_association.rb:213`.
2. `beforeSave` is registered against that method with no result-translating
   wrapper, and the `false as unknown as void` cast is gone.
3. The `defineNonCyclicMethod` re-entrant early return (returns sync `true`)
   still works through the new shape — that is what the `Promise.resolve` wrapper
   was tolerating.
4. `autosave-association.test.ts` and `src/associations/**` stay green,
   including the belongs_to cancelled-callback tests.
5. `pnpm parity:api:calls` / `:args` non-regressive.
