---
title: "extra-surface leaves TS files with no Rails counterpart entirely unmeasured"
status: done
updated: 2026-07-27
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: 18
pr: 5427
claim: "2026-07-27T17:23:13Z"
assignee: "extra-surface-skips-files-without-rails-counterpart"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #5391 (`module-level-config-accessor-shape`).

`scripts/api-compare/extra-surface.ts` only scores a TS file that has a Rails
counterpart file in the api-compare file map. Files with no counterpart are
skipped entirely, so ALL of their public surface is unmeasured — neither novel
nor moved nor allowlisted, just invisible.

`packages/activerecord/src/ar-config.ts` is the worked example: it has 20+
exported `setX` functions that are re-spellings of a Ruby `foo=` (exactly the
population RFC 0081 exists to eliminate) and `parity:api:extra` reports ZERO extras for
it, because `active_record.rb` redirects onto `base.ts` in the file map rather
than onto `ar-config.ts`. The RFC 0081 acceptance criterion "parity:api:extra shows the
matching drop" was written assuming those extras were counted; they never were.
See the "Note on the acceptance criterion about parity:api:extra" section of
`rfcs/0081-writer-accessor-convergence/README.md`.

This is a measurement hole, not a scoring preference: the whole point of
extra-surface is to find TS surface Rails does not have, and a file with no
counterpart is the case where that is MOST likely.

## Acceptance criteria

- Quantify the hole first: list every TS file in the data-layer packages with
  public surface and no Rails counterpart in the file map, with its exported
  symbol count. This number decides whether the fix is worth its size.
- Decide how such files should score. Options to weigh: attribute the file to
  the Rails file its symbols' umbrella module maps to (`ar-config.ts` ->
  `active_record.rb`, which `compare.ts:1772-1790` already does for the umbrella
  config path); or score against the whole-package Rails name set so surface can
  still be classed novel vs moved.
- Whatever lands must not mass-flag ported code as drift — check the delta on
  every package before/after and allowlist nothing to make the number look good.
