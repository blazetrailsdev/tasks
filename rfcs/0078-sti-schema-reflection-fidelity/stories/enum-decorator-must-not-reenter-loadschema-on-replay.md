---
title: "Enum decorator re-enters loadSchema during replay (needs WeakSet guard; Rails does not)"
status: done
updated: 2026-08-18
rfc: "0078-sti-schema-reflection-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6703
claim: "2026-08-18T14:40:54Z"
assignee: "request-forgery-protection-this-typed-mixin"
blocked-by: null
closed-reason: null
---

## Context

trails' enum decorator re-enters schema loading during decorator replay. In
`packages/activerecord/src/enum.ts:172`, the decorator calls
`assertEnumTypeDeclared(target, attribute)`, which calls `columnForAttribute`
(`model-schema.ts`), which calls `loadSchema`.

Rails' equivalent check (`vendor/rails/activerecord/lib/active_record/enum.rb:240`)
runs during `_default_attributes` materialization, at which point the schema is
already resolved — the decorator does not drive a schema load.

Consequence in trails: replaying pending decorators can recurse
replay -> `columnForAttribute` -> `loadSchema` -> overlay sync -> replay. This
surfaced as `RangeError: Maximum call stack size exceeded` in `dirty.test.ts`
during PR #4981. Re-verified against `origin/main` 2026-08-09: the coupling is
unchanged (`enum.ts:172` -> `assertEnumTypeDeclared` at `enum.ts:1007` ->
`columnForAttribute` -> `loadSchema`), but the containment moved —
`rebuildStiSubclassOverlay` is gone, and the reentrancy guard is now the
`replayingDecorators` WeakSet at `model-schema.ts:1049`, consulted by
`replayOwnPendingDecorators` (`model-schema.ts:1193`). The guard treats the
symptom; the coupling remains, so any future replay site must remember to re-add
a guard.

Note the interaction: the recursion only became reachable once
`replayOwnPendingDecorators` correctly established replay context (enum's check is
gated on `isDecoratorReplay()`); that path still exists at `model-schema.ts:1193`. A future change that adds a replay path without a
guard reintroduces the stack overflow.

## Acceptance criteria

- [ ] The enum decorator resolves the declared type without triggering a schema
      load — read already-resolved schema state (the warm cache / the attribute set
      being materialized) rather than calling `columnForAttribute`.
- [ ] The `replayingDecorators` WeakSet guard (`model-schema.ts:1049`) is removed,
      and no replay path needs an equivalent guard.
- [ ] `enum.test.ts` and `dirty.test.ts` stay green, including
      "attribute_changed? properly type casts enum values" (the test that blew the
      stack).
- [ ] Undeclared-enum-type errors still raise with the same message and timing.

## Notes

Confirm against Rails whether `assertEnumTypeDeclared` should consult
`columns_hash` at all on the replay path, or only the materializing attribute set.
