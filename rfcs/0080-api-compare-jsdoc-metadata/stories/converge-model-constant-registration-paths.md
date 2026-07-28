---
title: "Converge the three model constant-table registration paths onto one guarded path"
status: ready
updated: 2026-07-28
rfc: "0080-api-compare-jsdoc-metadata"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found in review of PR #5503 (converge-ar-model-resolution-onto-constantize).

Three code paths write Active Support's constant table, and they do not agree
on what else they update:

1. `registerModel` (`packages/activerecord/src/associations.ts:340`) — sets
   `modelRegistry` (which since #5503 writes through to the constant table),
   `_modelsByName`, `_registryKeys`, flushes pending counter-cache columns, and
   runs `guardCanonicalNameShadow`.
2. `registerSubclass` (`packages/activerecord/src/inheritance.ts:416`) —
   `if (klass.name) registerConstant(klass.name, klass);` only.
3. The adapter setter (`packages/activerecord/src/base.ts:1356-1358`) —
   `Base._modelsByName.set(this.name, this); registerConstant(this.name, this);`

(2) and (3) were added by #5471 (`21f363ebb`) so globalid's locator could
resolve models through `constantize` after its own model finder was retired,
so they cannot simply be deleted.

Consequences now that AR resolves model constants through `constantize`
(#5503):

- **The lookup widened.** Names registered only by (2)/(3) resolve where the
  old `resolveModel` (a bare `modelRegistry` read) raised. Test-local throwaway
  classes that self-register via STI or an adapter assignment are now globally
  resolvable, and a flat-name collision with a canonical model resolves to
  whichever was created last.
- **The shadow guard is bypassed.** `guardCanonicalNameShadow`
  (`associations.ts:293`) runs only in (1), so (2)/(3) can shadow a canonical
  name with no error — exactly the poisoning that guard exists to prevent.
- **Teardown is asymmetric.** `ModelRegistry.clear` (`associations.ts:267`)
  unregisters only its own keys, so constants written by (2)/(3) survive a
  registry clear.

## Acceptance criteria

- One registration path owns the constant table for model classes, so the
  registry and the constant table cannot disagree in either direction.
- `guardCanonicalNameShadow` (or an equivalent) covers the STI-subclass and
  adapter-setter paths, or the reason it deliberately does not is recorded at
  each call site.
- `ModelRegistry.clear` leaves no model constants behind.
- globalid's locator still resolves STI subclasses and adapter-assigned models
  — `packages/globalid/src/global-locator.test.ts` stays green.
- A test that fails on baseline covers the collision case: a bespoke class
  registered under a canonical model's name via the STI-subclass path.
