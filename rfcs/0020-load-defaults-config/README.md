---
rfc: "0020-load-defaults-config"
title: "Versioned framework defaults (config.load_defaults) — partial_inserts first"
status: draft
created: 2026-06-09
updated: 2026-06-09
owner: "@deanmarano"
packages:
  - activerecord
  - trailties
clusters:
  - config-defaults
---

<!-- Unnumbered until merge: keep `rfc:` as 0020-load-defaults-config and the H1
     below number-free. `scripts/finalize-rfc.mjs` assigns the number at merge. -->

# RFC 0020 — Versioned framework defaults (`config.load_defaults`)

## Summary

trails has **no `load_defaults` mechanism**. Rails versions its framework defaults
behind `config.load_defaults <version>`: each new major flips a set of
class-attribute defaults to their modern values (e.g. `load_defaults 7.0` sets
`ActiveRecord::Base.partial_inserts = false` while leaving `partial_updates =
true`). trails models the individual flags as framework class-attributes with
Rails' _old_ framework default, but there is no version-gated path to flip them —
so a real consuming app gets the pre-7.0 value with no way to opt into the modern
one. The test env papers over this by setting flags directly
(`test-setup-ar.ts` forces `Base.partialInserts = false`). This RFC introduces a
minimal versioned-defaults mechanism in the ActiveRecord trailtie and lands
`partial_inserts` as its first concrete flag; subsequent flags follow as stories.

## Motivation

Surfaced post-merge during trails #2958 (record create-time dirty changes). The
finding, verbatim concern:

- **`partial_inserts` default layering.** `Base.partialInserts` keeps Rails'
  framework class-attribute default `true` (`dirty.rb:49-50`). The test env forces
  `false` in `test-setup-ar.ts`, mirroring an app's `config.load_defaults 7.0`
  (which flips `partial_inserts` false while `partial_updates` stays true). trails
  has **no** trailtie/config wiring for `partial_inserts`, so a real consuming app
  currently gets `partial_inserts = true` with no `load_defaults` path to false.

Verified on `main` (`activerecord/src/trailtie.ts`): the trailtie wires several
`config.activeRecord` flags (sqlite strict-strings, pg date decoding, encryption,
timezone-aware types) but **no `partialInserts`**, and there is **no
`loadDefaults` / version-gating mechanism at all**. So `partial_inserts` cannot be
wired correctly without first establishing the substrate — which is why this is an
RFC, not a single story.

Secondary, related (also from #2958, recorded so it is not lost):

- **counter-cache test infidelity.** `counter-cache.test.ts` models declare
  AR-level attribute defaults on columns whose DB schema has no DB default; they
  persist correct values only because the test env forces `partial_inserts =
false`. Under Rails' framework default `partial_inserts = true` (with matching
  DB-column defaults) these would behave differently. Once a real `load_defaults`
  path exists, the test env should consume _that_ path rather than the direct
  `Base.partialInserts = false`, and the counter-cache canonical columns should get
  real DB defaults. Tracked as a follow-on, not part of the first story.

## Design

Rails' `config.load_defaults <version>` walks a version→{flag: value} table and
assigns each flag onto the owning framework class. The faithful-but-minimal trails
shape:

1. **A versioned defaults table** keyed by framework-version string (e.g. `"7.0"`,
   `"7.1"`, `"8.0"`), each mapping the AR class-attributes that version flips to
   their modern values. Start with the `7.0` entry containing `partialInserts:
false` (and leave room for the rest as later stories add them).
2. **`config.load_defaults(version)`** on the trailtie/application configuration
   applies every entry up to and including `version` onto `ActiveRecord.Base`
   (and other owning classes as flags are added). This mirrors Rails'
   `Configuration#load_defaults`.
3. **Test env consumes the mechanism.** `test-setup-ar.ts` calls
   `load_defaults("7.0")` (or the app-equivalent) instead of poking
   `Base.partialInserts = false` directly — so the test path exercises the real
   code, not a bypass.

The first story establishes (1)+(2) with `partial_inserts` as the sole entry and
rewires the test env (3). Later flags are mechanical additions to the table, each
its own story (so each can carry its own parity verification).

### Scope guard

This RFC is **not** "port every Rails framework default." It establishes the
mechanism and the first flag. Each additional `load_defaults`-gated flag is a
separate story with its own Rails-behavior verification; do not batch them.

## Alternatives considered

- **Keep poking flags directly in `test-setup-ar.ts`.** Status quo. Rejected — it
  hides the gap (consuming apps still get the wrong default) and means the test
  env diverges from any real app's configuration path.
- **Wire `partial_inserts` as a one-off `config.activeRecord.partialInserts`
  without a version table.** Rejected — it would not match Rails' semantics
  (`load_defaults` is version-gated; `partial_inserts` is one of many flags a
  version flips), and the next flag would face the same missing-substrate problem.
  Build the minimal versioned mechanism once.
- **A full Rails-parity `load_defaults` table for 7.0/7.1/8.0 in one shot.**
  Rejected — out of proportion to the surfaced need; each flag needs its own
  behavioral verification. Land the mechanism + one flag, grow incrementally.

## Rollout

1. Phase 1 — [partial-inserts-load-defaults](stories/partial-inserts-load-defaults.md):
   establish the versioned-defaults table + `config.load_defaults`, land
   `partial_inserts: false` as the `7.0` entry, rewire `test-setup-ar.ts` to
   consume it.
2. Follow-on (not yet storied): migrate other framework defaults onto the table;
   give the counter-cache canonical columns real DB defaults and re-verify under
   `partial_inserts = true`. File as stories when picked up.

## Open questions

1. **Which version keys to seed?** Recommendation: seed only the entries needed by
   a flag actually being wired (start with `7.0` for `partial_inserts`); add
   `7.1`/`8.0` rows when a flag belonging to them is ported. Avoids speculative
   empty version rows.
2. **Owning-class generality.** `partial_inserts` lives on `ActiveRecord.Base`.
   When a `load_defaults`-gated flag belongs to another framework class
   (ActionView, etc.), the table needs a per-flag owner. Keep the first cut
   AR-only; generalize the owner dimension when the second package needs it.

## Changelog

- 2026-06-09: initial RFC. Spun out of the post-merge triage of #2958, which
  flagged that `partial_inserts` has no trailtie wiring and trails has no
  `load_defaults` mechanism at all. Scoped to establish the minimal versioned
  mechanism + `partial_inserts` as the first flag.
