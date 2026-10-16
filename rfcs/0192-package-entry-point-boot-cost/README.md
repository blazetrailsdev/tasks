---
rfc: "0192-package-entry-point-boot-cost"
title: "Package entry-point shape and boot cost: what a consumer pays to import one binding"
status: draft
created: 2026-10-13
updated: 2026-10-13
owner: "@deanmarano"
packages:
  - "ruby-compat"
  - "activesupport"
  - "activerecord"
  - "actionpack"
  - "trailties"
  - "activemodel"
  - "actionview"
  - "arel"
  - "rack"
  - "msgpack"
  - "i18n"
  - "date"
  - "rack-test"
  - "activerecord-cli"
  - "rack-session"
  - "bcrypt"
  - "activejob"
  - "globalid"
  - "html-sanitizer"
  - "did-you-mean"
  - "website"
clusters:
  - "measurement"
  - "findings"
related-rfcs:
  - "0100-package-size-and-publish-shape"
---

# RFC 0192 — Package entry-point shape and boot cost

## Summary

Importing one binding from `@blazetrails/ruby-compat` loads **139 modules and
147ms**. Importing the same kind of binding through an existing subpath loads
**54 modules and 66ms**; the thinnest existing subpath loads **5 modules and
3ms**. The gap is the package's barrel entry point, which eagerly re-exports
every module it names, and `ruby-compat` sits at the bottom of the stack: 20
other workspace packages import its barrel (7 heavyweight consumers plus 13 in
the tail story's table), so they all pay it.

Three ruby-compat quantities recur below and are not interchangeable:
**147 files** shipped as `dist/*.js`; **139 modules** loaded by importing the
barrel (the barrel does not reach every file); and **8 `exports` entries**
(`"."` plus 7 subpaths), which leave 147 − 8 = 139 files with no subpath of
their own — the same number as the barrel's load count by coincidence only.

This RFC scopes that to a measured burndown, and — equally the point — records
that the same question answered **no** for `actionview` and **marginally** for
`msgpack`, so nobody re-runs those experiments.

The `packages` list above is broad because the migration touches every
_consumer_ of the ruby-compat barrel. The packages whose own entry points are
under examination are only three: `ruby-compat` (the target), plus `actionview`
and `msgpack` (both measured, both answered no — see Design).

## Relationship to RFC 0100

[RFC 0100](../0100-package-size-and-publish-shape/README.md) covers package
size and publish shape. It is adjacent and the two must not be conflated,
because they measure different things:

|         | 0100                                        | this RFC                              |
| ------- | ------------------------------------------- | ------------------------------------- |
| Unit    | published MB; bundled KB (esbuild metafile) | modules resolved and executed by Node |
| Mode    | install-time and bundled                    | runtime, unbundled                    |
| Subject | activerecord                                | ruby-compat                           |

0100's own measurement records that no test-helper, fixture or canonical-schema
module is reachable from the public entrypoint — its weight is install-time
only. This RFC is about the opposite: modules that _are_ executed, every boot,
unbundled, which is how trails runs in development, in tests and in the CLI.

Two places they touch, and must stay coordinated:

- **The CI gates overlap.** 0100's `package-size-budget-ci-gate` watches for "a
  new module-scope import pulling a subsystem onto the `base.js` path"; this
  RFC's `boot-graph-measurement-harness` watches per-package loaded/shipped
  ratios. Those are the same class of regression caught two ways. Whichever
  lands second should extend the first rather than stand up a second
  measurement tool — see Open questions.
- **`sideEffects` is a shared hazard.** 0100 records that `sideEffects: false`
  is wrong for this codebase, because much of activerecord _is_ registration
  side effects. This RFC's premise is narrower — that `ruby-compat`'s barrel
  specifically is a pure re-export hub — and every migration story is required
  to stop and report if a consumer's behaviour changes. That requirement exists
  because of 0100's finding; do not weaken it to `sideEffects: false` anywhere.

## Motivation

A full trails application boot (`examples/` app, 4 routes, development env)
resolves **1,284 modules**. Bucketed by owning package, with each package's
shipped `dist/*.js` count for comparison:

| Package         | Loaded at boot | Shipped | Loaded     |
| --------------- | -------------- | ------- | ---------- |
| activerecord    | 251            | 2357    | 10.6%      |
| activesupport   | 182            | 495     | 36.8%      |
| actionpack      | 156            | 636     | 24.5%      |
| **ruby-compat** | **147**        | **147** | **100.0%** |
| trailties       | 117            | 385     | 30.4%      |
| actionview      | 95             | 170     | 55.9%      |
| arel            | 84             | 239     | 35.1%      |
| activemodel     | 73             | 253     | 28.9%      |
| rack            | 32             | 114     | 28.1%      |
| i18n            | 19             | 49      | 38.8%      |
| msgpack         | 14             | 27      | 51.9%      |

`ruby-compat` is the only package that loads **all of itself**, every boot.
`activerecord` is the largest absolute contributor and the best behaved
proportionally — it is not a target here.

The call sites are overwhelmingly barrel imports (`grep` across
`packages/*/src/**/*.ts`):

| Package     | `from "@blazetrails/<p>"` | `from "@blazetrails/<p>/..."` |
| ----------- | ------------------------- | ----------------------------- |
| ruby-compat | **1795**                  | 102                           |
| actionview  | 65                        | 0                             |
| msgpack     | 6                         | 0                             |

### The measured cost

Each figure is modules resolved via a loader hook, and the median of three
warm `await import()` timings:

| Specifier                             | Modules | Time    |
| ------------------------------------- | ------- | ------- |
| `@blazetrails/ruby-compat`            | 139     | 147ms   |
| `@blazetrails/ruby-compat/include`    | 58      | —       |
| `@blazetrails/ruby-compat/range`      | 54      | 66ms    |
| `@blazetrails/ruby-compat/name-error` | **5**   | **3ms** |

`name-error` is the proof that a thin leaf is reachable: the package's shape,
not its dependencies, is what costs 139 modules. `ruby-compat` has no
third-party dependencies in this graph — `/range`'s 54 modules are **53
ruby-compat files plus one** — so every module saved is a module this repo
controls.

### Why 54 and not 5 is the realistic floor

`ruby-compat` contains **six circular import groups covering 41 of its 147
modules, the largest a 28-module strongly-connected component**. An SCC cannot
be partially loaded: entering it anywhere loads all of it. That is the
mechanism behind the ~53-module floor, and it bounds what subpath exports alone
can win. Breaking the SCC is a separate, larger question (see Non-goals).

## Design

Three packages, three different answers, all measured:

### 1. `ruby-compat` — subpath exports, then call-site migration

`exports` already names `"."` plus 7 subpaths and has no wildcard. Add `"./*"` (as
`actionview` already does) so every shipped file is reachable without
enumerating each one, then migrate call sites off the barrel in package-sized batches.

The barrel stays and keeps working; this is additive and behaviour-preserving.
The barrel is a pure re-export hub with no side effects, which is why this is
safe — a story that discovers a side effect must stop and report it.

Entering the 28-module SCC (see Motivation) loads all of it, so a subpath
import only wins if the module it names sits outside the SCC or the consumer
already pays for the SCC. The Phase 1 harness therefore emits a
**binding → owning module → SCC membership** map, and every Phase 2 codemod
uses it to pick subpaths; each batch must also show its package's boot-graph
module count did not rise (a ruby-compat count above the pre-batch baseline
fails the batch).

**1795 call sites cannot be one PR.** Batches are per consuming package, each
a mechanical codemod plus its own measurement: activesupport first (it is
the foundation every other consumer loads), then by boot weight — activerecord, actionpack, trailties, actionview, arel,
activemodel, then the tail.

### 2. `msgpack` — marginal, do it only if it falls out

| Specifier                       | Modules | Time  |
| ------------------------------- | ------- | ----- |
| `@blazetrails/msgpack`          | 162     | 198ms |
| `@blazetrails/msgpack/core-ext` | 141     | 150ms |

21 modules and ~48ms across **6 call sites**. Note 141 of those 162 modules are
_not_ msgpack — the package ships 27 files and drags in ~135 from elsewhere.
Its weight is its dependencies, so entry-point work is nearly irrelevant here.
One story, sequenced last via Phase 3 and its deps, and acceptable to close as not-worth-it.

### 3. `actionview` — a measured dead end, recorded not scheduled

| Specifier                         | Modules | Time      |
| --------------------------------- | ------- | --------- |
| `@blazetrails/actionview`         | 474     | 594ms     |
| `@blazetrails/actionview/helpers` | 441     | 523–653ms |

33 modules saved and **no reliable time difference** — the subpath measured
slower on one of three runs. `actionview` already has a `./*` wildcard, so the
exports work is already done and buys nothing: 441 of its 474 modules belong to
`activesupport` and `ruby-compat`. **The actionview win is downstream of the
ruby-compat fix**, not a separate task. No story.

## Non-goals

- **Breaking ruby-compat's 28-module cycle.** It is what sets the ~53-module
  floor, but it is a structural change to the MRI core emulation with fidelity
  risk, and it is not needed to capture the 139→54 win. Wants its own RFC.
- **Making Perry compile a full trails app.** Explicitly not the motivation
  here; see "This is not the native-compile blocker".
- **activesupport subpath exports.** Measured: 429→364 modules, **15%**. Not
  worth the churn; recorded so it is not re-attempted.
- **actionview entry-point work.** Measured dead end above.
- **activerecord.** Loads 10.6% of what it ships. Already correct.

## This is not the native-compile blocker

Recorded because this finding surfaced during native-compile work and the two
must not be conflated. Perry (AOT TypeScript→native) fails on a full trails app
by exhausting 32GB **while still collecting modules**, before codegen. No
package-level restructuring in this RFC reaches that:

- The blocker scales with the **whole** graph (1,284), not one package's share.
- Perry's collection is eager regardless of import style: `await import(CONST)`
  was measured to collect **identically** to a static import (4 vs 4 modules).
  A runtime-computed specifier escapes collection but then refuses to run in an
  AOT binary.

So the justification for this RFC is the Node-side boot cost on its own merits
— ~81ms and 85 modules on the foundation layer, on every boot of every trails
app and every test process — and nothing here should be sold as unblocking
Perry.

## Alternatives considered

- **Rewrite the barrel to re-export lazily.** ESM `export *` is eager by
  specification; there is no lazy form. A getter-based shim would break
  named-import static analysis and tree-shaking. Rejected.
- **Leave the barrel and let bundlers tree-shake.** trails runs unbundled under
  Node in development, in tests, and in the CLI — the three places this cost is
  actually paid. Rejected.
- **Codemod all 1795 sites in one PR.** Over the est-loc ceiling by a wide
  margin and unreviewable; a per-package batch is measurable individually.

## Rollout

1. Phase 1 — add `"./*"` to `ruby-compat` `exports`, plus the measurement
   harness that makes the table above reproducible and regression-visible.
2. Phase 2 — per-consumer codemod batches, heaviest first, each reporting its
   own boot-module delta.
3. Phase 3 — `msgpack`, if Phase 2 leaves it worth doing.

Phase 1 must land before any Phase 2 batch: the batches depend on the wildcard
subpath existing, and every Phase 2 story declares
`deps: [ruby-compat-wildcard-subpath-export]`.

| Phase | Story                                                                     |
| ----- | ------------------------------------------------------------------------- |
| 1     | `ruby-compat-wildcard-subpath-export`                                     |
| 1     | `boot-graph-measurement-harness`                                          |
| 2     | `migrate-activesupport-off-the-ruby-compat-barrel` (291 imports)          |
| 2     | `migrate-activerecord-off-the-ruby-compat-barrel` (605)                   |
| 2     | `migrate-actionpack-off-the-ruby-compat-barrel` (219)                     |
| 2     | `migrate-trailties-off-the-ruby-compat-barrel` (213)                      |
| 2     | `migrate-actionview-off-the-ruby-compat-barrel` (95)                      |
| 2     | `migrate-arel-off-the-ruby-compat-barrel` (90)                            |
| 2     | `migrate-activemodel-off-the-ruby-compat-barrel` (121)                    |
| 2     | `migrate-the-tail-packages-off-the-ruby-compat-barrel` (161 over 14 pkgs) |
| 3     | `msgpack-entry-point-marginal-call`                                       |

Phase 2 starts with `activesupport`, the foundation every other consumer
loads, then goes by boot weight rather than import count, so the heaviest boot
contributors are measured first; `activerecord` is the largest batch and sits
near the 700 est-loc ceiling, so it may need splitting by subdirectory.

## Verification

- `@blazetrails/ruby-compat` is imported by **0** modules in the boot graph of
  the `examples/` app.
- ruby-compat's boot contribution falls from **147** to the **target** the
  Phase 1 harness fixes. That target is not assumed: 54 is `/range` alone and
  `/include` alone is 58, so the harness story measures the **union** of
  subpaths the app's consumers actually need (per the binding map) and commits
  that figure as the target. The full-app module target is derived from it
  (1,284 minus the measured saving), not set independently.
- The harness from Phase 1 runs in CI, **reports** every package's
  loaded/shipped ratio, and **gates only ruby-compat's** loaded count against
  the committed baseline (see Open question 1).
- No change to `pnpm build`, lint, or test outcomes at any step — every change
  in this RFC is behaviour-preserving.

## Open questions

1. **Should the harness be folded into 0100's `package-size-budget-ci-gate`?**
   Both watch module-scope import regressions, from different units. Options:
   one tool reporting both published size and boot-graph ratios; or two tools
   with a shared collector. Recommendation: whichever story lands second
   extends the first, and neither is marked done while two separate
   measurement tools exist.
2. **Should the harness gate CI or only report?** A hard gate on a module count
   is brittle against legitimate feature growth. **Resolved:** report in CI
   and gate only `ruby-compat`'s loaded count, which should never rise. The
   harness story's AC encodes this.
3. **Does `msgpack` justify any work at all?** 21 modules over 6 call sites.
   Recommendation: file it, sequence it last via Phase 3 deps, and accept closing it as not-worth-it.

## Changelog

- 2026-10-13: initial RFC
- 2026-10-14: review fixes — harness gate policy, measured union target,
  binding→SCC map, explicit story deps, `website` consumer, count terminology
- 2026-10-16: cross-reference RFC 0100 — the two measure different units on
  overlapping subjects; records the CI-gate overlap and the shared
  `sideEffects` hazard. 0100 links back.
