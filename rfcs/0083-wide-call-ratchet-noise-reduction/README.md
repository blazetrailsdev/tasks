---
rfc: "0083-wide-call-ratchet-noise-reduction"
title: "Wide call-set ratchet — noise reduction"
status: closed
created: 2026-07-30
updated: 2026-08-03
owner: "@deanmarano"
packages:
  - "activerecord"
  - "arel"
  - "actiondispatch"
  - "actioncontroller"
  - "activesupport"
clusters:
  - "api-compare"
related-rfcs:
  - "0047"
  - "0080"
priority: 0
---

# Wide call-set ratchet — noise reduction

## Summary

The RFC 0047 wide call-set ratchet (`pnpm parity:api:calls`) currently baselines
**4794 entries across 505 files and 13 packages**, of which **4445 (92.7%) still
carry the verbatim `Baseline (RFC 0047)` seed reason** — never reviewed by a
human. The list is too large and too noisy to burn down, and it fails PRs for
reasons unrelated to fidelity.

A measured investigation (2026-07-30) classified all 5038 rows of the live
artifact by cause. The majority are tooling artifacts, not fidelity gaps. This
RFC removes that noise with **tooling-only changes — no product code is
touched**, so the sibling burn-down RFC starts from a list where every remaining
entry means something.

## How the gate works today

| Piece           | Location                                                                                                                         |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Producer        | `scripts/api-compare/compare.ts` with `--wide-calls` → `output/call-mismatches-wide.json` (`compare.ts:1127`, `:2166`)           |
| Significant set | `WIDE_SIGNIFICANT_CALLS` (`compare.ts:204-220`)                                                                                  |
| Core predicate  | `significantMissingCalls` (`compare.ts:242-286`)                                                                                 |
| Gate            | `scripts/api-compare/lint-call-mismatches-wide.ts`                                                                               |
| Baseline        | split dir `scripts/api-compare/call-mismatches-wide-exclude/<package>/<tsFile .ts→.json>` (`lint-call-mismatches-wide.ts:72-91`) |
| Enforcement     | CI only — `.github/workflows/ci.yml:1435-1444`. No eslint rule; `pnpm parity:api` alone does NOT run it.                         |

Three mechanics drive the noise:

1. **The TS call-set is lexical per (file, method).** `checkCalls` reads
   `tsCallsByFileName.get(tsFile)?.get(tsName)` (`compare.ts:1638`). The only
   escape is `effectiveTsCalls` (`compare.ts:337-346`), which unions a
   delegate's calls only for bodies with `≤ DELEGATION_MAX_CALLS = 3` calls
   (`compare.ts:295`). Extracting a helper out of any larger body trips the gate.
2. **The Ruby extractor records no receiver.** `walk_for_calls`
   (`extract-ruby-api.rb:2111-2137`) records the callee name for `:call` /
   `:command_call` identically to `:fcall` / `:vcall`, so a plain-Ruby
   `xs.first` / `opts.fetch` is credited against an unrelated ported method of
   the same name.
3. **`isPortedWithArgs` is package+deps wide** (`compare.ts:272`, `:1657-1659`),
   so the moment any method named e.g. `quote` acquires a parameter anywhere,
   every Rails caller of `quote` flags at once.

Two further mechanics worth recording:

- The baseline key is `package + tsFile + rubyName + call` — **no `tsName`** —
  so the artifact's 5038 rows collapse to 4794 unique keys. `findDuplicateKeys`
  already guards genuine duplicates; there is no de-duping work left.
- `@missingRailsCall` JSDoc tags (`build.ts`, `parity:api:build`) mirror baseline
  reasons into source, but **nothing in `compare.ts` or the lint reads them**.
  Annotating a call today does not remove its baseline entry.

## Measured cause breakdown

Classification of the 5038 live artifact rows:

| Cause                                                           | Rows | Noise?       |
| --------------------------------------------------------------- | ---: | ------------ |
| Ruby call on a non-self receiver (Enumerable/Hash/String idiom) | 3402 | pure noise   |
| Helper extraction (call reachable in-file, invisible to gate)   |  518 | pure noise   |
| Property-access port (`this.owner` for Rails `owner`)           |  203 | pure noise   |
| Cross-file / mixin-attribution split                            |  469 | mostly noise |
| Genuine: same-file candidate that takes args, not called        |  683 | **real**     |
| Candidate unresolvable in-package                               |   48 | mixed        |

(The last four rows are measured after receiver scoping; buckets overlap by
construction, so the cascade below is the authoritative projection.)

## Decisions taken

- **Receiver scoping is the conservative variant.** Suppress only calls whose
  receiver is provably a local variable or a literal — NOT the aggressive
  "self/implicit receiver only" rule. The aggressive rule removes 3402 rows but
  makes genuine qualified calls to ported collaborators (`owner.save`,
  `association.reader`) permanently invisible. The conservative rule removes
  1336 and keeps the gate's meaning intact. This is a deliberate trade of
  noise-reduction for signal preservation.
- **Under the conservative variant the cross-file / mixin bucket grows to 1606
  rows**, making it the second-largest lever and putting it on the critical
  path. It mixes artifact with real divergence, so it is split into an
  audit story and a fix story — never a blind widening.
- **`@missingRailsCall` becomes load-bearing** so permanent, correct deviations
  (single-threaded `synchronize`, the 349 already-verified equivalents) can
  leave the baseline dir and live as reasoned tags at the call site. This is the
  direct analogue of RFC 0080's `retire-extra-surface-allow.json`, and matches
  the standing preference for justifying deviations at the call site rather than
  in a JSON blob.

## Projected cascade

| Step                              |                    Rows |                                 Δ |
| --------------------------------- | ----------------------: | --------------------------------: |
| today                             |                    5038 |                                 — |
| + receiver scoping (conservative) |                    3702 |                             −1336 |
| + same-file transitive closure    |                    3288 |                              −414 |
| + property-access ports           |                    3031 |                              −257 |
| + cross-file / mixin resolution   |              ~1400–1900 |                    −1100 to −1600 |
| + tag suppression                 | unreviewed genuine only | permanent deviations exit the dir |

Hard floor: **931 rows** classified `GENUINE (same-file candidate that takes
args)` — a real ported helper the TS body does not call. That is the burn-down
RFC's population.

## Non-goals

- No product-code changes. Every story here is tooling.
- Not retiring the wide ratchet or the split baseline layout — both work.
- Not touching the narrow RFC 0044 gate, `SIGNIFICANT_CALLS`, or
  `call-mismatches-exclude.json`.
- Not de-duping or stale-pruning: `--write` already prunes stale entries and
  deletes emptied files (`lint-call-mismatches-wide.ts:143-184`), and duplicate
  keys are already guarded.

## Sequencing

Reporting first (so the population is legible), then the safe extractor fixes,
then the audit-gated cross-file work, then receiver scoping, then tag
suppression last — so tags are only minted against a de-noised population.

Each story reseeds the split baseline with
`pnpm tsx scripts/api-compare/lint-call-mismatches-wide.ts --write` and stays
well under the 500-LOC ceiling.

## Verification

Every story states its expected row delta. A story whose measured delta differs
materially from the projection above must say so in its PR body — the
projections come from instrumented probe runs on the 2026-07-30 tree, and the
population moves as sibling work lands.
