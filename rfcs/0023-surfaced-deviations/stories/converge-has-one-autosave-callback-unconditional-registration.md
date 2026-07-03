---
title: "converge-has-one-autosave-callback-unconditional-registration"
status: done
updated: 2026-07-03
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4495
claim: "2026-07-03T16:57:54Z"
assignee: "converge-has-one-autosave-callback-unconditional-registration"
blocked-by: null
closed-reason: null
---

## Context

Surfaced during review of PR #4493
(`converge-has-one-through-persist-onto-autosave`).

trails gates the **registration** of the has_one autosave `after_create` /
`after_update` callbacks on `options.autosave !== false`:
`packages/activerecord/src/autosave-association.ts:1302-1311` — each wrapper does
`if (assocDef?.options?.autosave === false) return;` before invoking
`saveHasOneAssociation`. The comment just above (`:1295-1301`) claims the
callback is registered UNCONDITIONALLY, so comment and code disagree.

Rails registers `save_has_one_association` unconditionally
(`vendor/rails/activerecord/lib/active_record/autosave_association.rb:199-200`,
`define_non_cyclic_method(save_method) { save_has_one_association(reflection) }`
under `elsif reflection.has_one?` — no autosave-option gate) and performs the
`autosave != false` check INSIDE the method (`:484`). The difference matters
because Rails' in-method path still persists a NEW child via the
`_record_changed?` → `new_record?` leg (`:487,511`) even when `autosave` is
nil/false; the trails early-return skips the callback entirely for
`autosave: false`, so a new/dirty child of an `autosave: false` has_one is only
persisted via the post-commit `flushPendingReplaces` safety net
(`base.ts:3328`) for the writer path — not in-transaction, and not at all for a
pure build path that leaves no `_pendingReplace`.

Functionally equivalent TODAY for through joins (the `flushPendingReplaces` net
catches the writer path, verified in PR #4493), but the transaction-boundary
divergence (post-commit vs in-save) and the build-path gap are latent.

trails: `packages/activerecord/src/autosave-association.ts:1290-1311`
(`addAutosaveAssociationCallbacks`, has_one arm), `saveHasOneAssociation`
(`:1053`), `autosaveHasOne` (`:477`).
Rails: `autosave_association.rb:196-201` (registration),
`:473-507` (`save_has_one_association`, in-method `autosave != false` gate).

## Acceptance criteria

- [ ] Register the has_one `save_has_one_association` callback unconditionally
      (drop the `autosave === false` early-return in the `afterCreate`/
      `afterUpdate` wrappers) and move the `autosave != false` decision inside
      `autosaveHasOne`, matching Rails `autosave_association.rb:484`.
- [ ] Preserve current behavior: `autosave: false` still skips re-saving an
      already-persisted child, but a NEW/changed child still persists via the
      `_record_changed?` leg (Rails parity), in-transaction rather than relying
      on the post-commit `flushPendingReplaces` net.
- [ ] Fix the now-accurate comment; keep direct + through has_one green on
      sqlite + PG + MariaDB.
