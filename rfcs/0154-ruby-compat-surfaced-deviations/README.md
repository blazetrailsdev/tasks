---
rfc: "0154-ruby-compat-surfaced-deviations"
title: "ruby-compat surfaced deviations — the MRI port's standing convergence bucket"
status: active
created: 2026-09-17
updated: 2026-09-17
owner: "@deanmarano"
packages:
  - "ruby-compat"
  - "activesupport"
clusters:
  - "mri-relocation"
  - "measurement"
related-rfcs:
  - "0129-ruby-compat"
  - "0138-ruby-compat-residual-convergence"
  - "0135-platform-adapters-in-ruby-compat"
  - "0148-ruby-compat-catch-throw"
  - "0130-activerecord-extra-surface-receipt-burndown"
  - "0117-arel-extra-surface-burndown"
  - "0120-extra-surface-gating-rollout"
priority: 3
---

# RFC 0154 — `ruby-compat` surfaced deviations

## Summary

The standing convergence bucket for `packages/ruby-compat/**`: Ruby core and
stdlib surface that trails calls, measured against `vendor/ruby/` rather than
`vendor/rails/`. Like its arel (0124), activemodel (0134), actionpack (0141) and
trailties (0142) siblings it runs no campaign — it is the home a surfaced
ruby-compat deviation goes to.

## Motivation

CLAUDE.md routes a surfaced deviation to `<package>-surfaced-deviations`, and
**no ruby-compat bucket exists**. Every RFC that has owned this package is
finished:

| RFC                                     | status     |
| --------------------------------------- | ---------- |
| `0129-ruby-compat`                      | superseded |
| `0135-platform-adapters-in-ruby-compat` | superseded |
| `0138-ruby-compat-residual-convergence` | closed     |
| `0148-ruby-compat-catch-throw`          | closed     |
| `0089-corelib-primitives`               | superseded |

`0023-surfaced-deviations` is `postponed` and retired as the catch-all. So a
ruby-compat finding surfaced today has nowhere to go: `tasks new` against 0129
fails with `RFC 0129-ruby-compat is superseded — it cannot take new stories`,
which is how this gap was found.

That is a live problem rather than a theoretical one, because ruby-compat is the
one package in the repo whose job is to **keep growing**. Its README's rule 1 is
"only what trails actually calls" — so every time a port needs another piece of
MRI, surface lands here. RFC 0129 closed having moved the first tranche
(`Rational`, `regexpEscape`, `Range`/`succ`, the monitor mixin, the platform
adapters); the tranche after it has no home.

### Evidence

Measured 2026-09-17 against trails `main` (`eda2443035`):

- LOC ratios across all 672 mirrored Ruby/TS file pairs: median **1.19x**,
  aggregate **1.20x**, 18 files above 3x, 6 above 5x.
- The **worst ratio in the repo** is
  `packages/activesupport/src/core-ext/big-decimal/conversions.ts` at **30.1x**
  (14 Ruby lines → 422 TS). It is not bloat: the file hosts a port of Ruby's
  `BigDecimal` stdlib class, whose upstream is
  `vendor/ruby/ext/bigdecimal/bigdecimal.c`. It is misfiled, in the same way
  `Rational` was before RFC 0129 moved it.
- That misfiling hides a fidelity bug (see
  `move-big-decimal-to-ruby-compat`): Ruby's `BigDecimal#to_s` defaults to
  scientific notation and the 14-line Rails core_ext exists solely to flip that
  default to `"F"`. trails baked `"F"` into the class, so the Rails file's
  behavior has no TS counterpart implementing it.

## Design

### Scope

In scope: any divergence in `packages/ruby-compat/**` between a ported member
and its MRI counterpart in `vendor/ruby/`, plus Ruby core/stdlib surface still
living in a Rails package that should relocate here, plus the measurement
machinery that scores this package.

Out of scope:

| Subsystem                                              | Owner    |
| ------------------------------------------------------ | -------- |
| The Rails packages' extra-surface burndown             | RFC 0130 |
| Ruby→TS idiom conversion classes (truthiness, `fetch`) | RFC 0082 |
| Deviations blocked on an unported subsystem            | RFC 0123 |

### Clusters

- **`mri-relocation`** — Ruby core/stdlib surface living in the wrong package,
  and the fidelity bugs that misfiling hides. The RFC 0129 `move-*-to-ruby-compat`
  series continued.
- **`measurement`** — how `parity:api:extra` scores a package that is not a
  Rails port. ruby-compat is in `TS_ONLY_PACKAGES`, so the Rails comparison
  never scores it; it is enrolled in the extra-surface ratchet for a different
  purpose, and that enrollment has a sign error this cluster owns.

## Non-goals

- **Un-enrolling ruby-compat from `parity:api:extra`.** The enrollment is
  deliberate (`scripts/api-compare/config.ts:20-33`) and is the only mechanical
  enforcement of the package's rule 1. The `measurement` cluster fixes the
  ratchet's direction, not its existence.
- **Enrolling ruby-compat in the Rails comparison.** It has no gem on the other
  side; coverage, arity and call parity over it are meaningless questions, and
  the README states the exclusion is permanent.
- **Driving ruby-compat to a parity percentage.** A deviation bucket has no
  headline number.
- **Porting MRI surface trails does not call.** Rule 1 stands.

## Alternatives considered

- **Reopen RFC 0129.** Rejected: it closed having delivered its campaign, and
  reopening a superseded RFC to hold unrelated follow-on work is what the
  per-package bucket pattern exists to avoid.
- **File under RFC 0130.** Rejected: 0130 is activerecord's burndown with a
  crisp end state ("one line deleted from the mark file and `activerecord` moved
  to `TAGGED_ONLY_PACKAGES`"), and ruby-compat's mark semantics are a different
  question that would muddy it.
- **File under RFC 0023.** Rejected: `postponed`, and retired as the catch-all
  by CLAUDE.md.

## Rollout

1. **Filing (this PR).** Bucket authored `active`, with its two opening
   stories hand-authored under `stories/` (`tasks new` cannot target an
   uningested `0000-` RFC). Rows are created when CI ingests on merge.
2. No rehome batch: no existing stories move here. The bucket opens with the
   two filed below and takes new findings as they surface.

## Verification

- `pnpm validate` passes across all RFCs and stories.
- After merge, `pnpm tasks list --rfc <this rfc>` reports **2** stories, and
  because the bucket is filed `active` rather than `draft`,
  `pnpm tasks ready --rfc <this rfc>` is non-empty — the
  `ruby-compat-extra-surface-growth-protocol` story is pickable and
  `move-big-decimal-to-ruby-compat` unblocks behind it.
- Burndown target: closes at **0 open stories with no new filing for a full
  campaign cycle**, the way 0124 and 0134 closed.

## Open questions

None.

## Changelog

- 2026-09-17: initial RFC, filed to give ruby-compat the per-package bucket
  every other package already has, after `tasks new` against the superseded
  RFC 0129 surfaced its absence.
