---
title: "GlobalID.defaultLocator is async; converge via a zero-import Locator slot"
status: done
updated: 2026-10-23
rfc: "0193-small-gem-ports-parity-100"
cluster: null
packages:
  - "globalid"
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: trails#9275
claim: "2026-10-23T16:19:36Z"
assignee: "blocklocator-locate-many-filters-nils"
blocked-by: null
closed-reason: null
---

## Refinement (2026-10-22)

Re-verified against trails `origin/main` when 0023 was retired. still async + dynamic import (global-id.ts:124); converged shape is a namespace seat, the zero-import slot is retired. Where this note and the original text below disagree, the note is current; the acceptance criteria apply to what remains.

## Context

`GlobalID.default_locator` is a plain synchronous setter in Rails —
`def default_locator(default_locator); Locator.default_locator = default_locator; end`
(`vendor/globalid/v1.3.0/lib/global_id/global_id.rb:34-36`).

trails ships it `async` (`packages/globalid/src/global-id.ts`, ported in
PR #6221) because `global-id.ts` reaches `Locator` through a **dynamic import**
— the same device `GlobalID#find` uses (`global-id.ts`, ~:196) — to avoid a
runtime edge into the `global-id ↔ signed-global-id ↔ locator` cycle that would
evaluate `class SignedGlobalID extends GlobalID` with `GlobalID` still in TDZ.
An awaited setter is a real API divergence: Ruby callers write
`GlobalID.default_locator(x)` and read `Locator.default_locator` on the next
line.

## Converged shape

CLAUDE.md's settled answer for exactly this shape is the **zero-import slot
module** (the two existing instances: `activerecord/src/encryption/
configurable-slot.ts`, `activerecord/src/associations/collection-proxy-slot.ts`)
— a file with no runtime imports exporting a mutable binding plus a `_setX()`
setter, which `locator.ts` calls at the bottom of its own body. `global-id.ts`
then imports the slot (which joins no cycle) and both `defaultLocator` and
`find` become synchronous-at-the-Rails-shape reads resolved at call time,
exactly where Ruby resolves the constant.

Verify both directions with a plain-node import of the **built** `dist/**.js`
modules as entry modules — a vitest run enters the funnel module first and masks
the TDZ, so a green suite proves nothing here.

## Acceptance criteria

- [ ] `GlobalID.defaultLocator(locator)` is synchronous, matching
      `global_id.rb:34-36`.
- [ ] `GlobalID#find`'s dynamic import is retired by the same slot, or the
      story says explicitly why it must stay.
- [ ] TDZ verified by plain-node import of `packages/globalid/dist/global-id.js`
      and `dist/signed-global-id.js` as entry modules, both orders.
- [ ] globalid suite green; `parity:api --package globalid` stays 80/80.
