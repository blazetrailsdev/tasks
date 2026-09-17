---
title: "Shard the assertion mark per Rails test file"
status: draft
updated: 2026-09-17
rfc: "0097-parity-output-sharding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0097's disposition section (`README.md:325-337`) rules this register
**LEAVE MONOLITHIC**, on two premises. The second is sound and the first is
false, which is what this story exists to correct.

> Its real key is the package, and package is already the _coarsest_ level of
> the sharding convention — **there is no source-file dimension below it.**

There is. `scripts/test-compare/output/convention-comparison.json` already
carries, per Rails test file, the arrays `assertionMismatches`,
`kindMismatches` and `valueMismatches` (written by `compare.ts`, the per-file
`files[]` entries). Their lengths sum **exactly** to the per-package totals the
ratchet gates on. Measured 2026-09-17 on activerecord:

| dimension       | sum over `files[]` | `totalAssertionMismatch` etc. |
| --------------- | -----------------: | ----------------------------: |
| assertion-count |               1862 |                          1862 |
| assertion-kind  |               3798 |                          3798 |

across 348 files, 223 of them non-zero. `countsFromArtifact`
(`scripts/test-compare/assertion-ratchet.ts:57`) discards that dimension and
keys on `r.package` alone. The source-file grain is measured today and thrown
away at the gate boundary.

0097's OTHER premise stands and is the reason this matters: sharding **by
package** would not relieve the conflict, because virtually every edit moves the
`activerecord` counters. That is exactly right, and it is why the fix has to be
per Rails test FILE, not per package.

**The cost of leaving it monolithic is now paid, not hypothetical.** RFC 0132
(`0132-ar-closure-assertion-parity`, 97 stories, 34 declaring `activerecord`
and most of the undeclared ones activerecord test files) serializes entirely on
these three integers. trails#7857 unblocked it by FREEZING the mark — a marker
that refuses `--write` for the RFC's duration — which works only because this
ratchet has no staleness arm and slack reads as green. The freeze buys
parallelism by suspending enforcement: a regression inside the accumulated slack
passes CI until the closing reseed. Sharding is the mechanism that buys the same
parallelism without suspending anything.

## Converged shape

`scripts/test-compare/assertion-mismatch-mark/<package>/<rubyFile .rb→.json>`,
mirroring `scripts/api-compare/call-mismatches-wide-unreviewed/<package>/<tsFile
.ts→.json>` from RFC 0083 (trails#5922), which solved the identical
one-number-serializes-the-repo problem for the wide call ratchet.

- `countsFromArtifact` keys on `(package, rubyFile)`.
- `violations` compares per shard; a file absent from the mark must measure 0.
- **No committed package-level total** — sum the shards at report time. A second
  committed number re-serializes exactly what the sharding just unblocked.
- A shard reaching all-zero is DELETED, not written as zeros: `writeMarks` in
  `unreviewed-ratchet.ts` skips non-positive entries (`if (max <= 0) continue;`),
  and hand-written zeros leave shards no reseed produces.
- `pnpm parity:test:assertions:tighten [<package>/<file>.json]` as the narrow
  verb. No reseed — same reason the call baselines forbid one.

## Seeding

Seed from a fresh FULL `parity:test`, never by distributing the current package
number: today's committed `activerecord` mark can sit below a full measurement,
and there is no faithful way to split a number that is already tighter than the
sum. If the per-file sum exceeds the old package mark, that delta is genuine
debt to converge first — the migration must not launder it.

## Acceptance criteria

- The per-package `assertion-mismatch-mark.json` is replaced by per-Rails-file
  shards; no committed package-level total remains.
- Two stories converging different Rails test files in the same package can land
  in either order without touching the same file.
- The gate's arms (`exceeded`, `unmarked`, `missing`) keep their current
  meanings at the finer grain, with tests.
- RFC 0097 `README.md:325-337` is rewritten: the disposition flips with the
  falsified premise named, so the next reader does not re-derive it.
- The freeze machinery (`loadFreeze` / `renderFrozen` / `renderFrozenSlack`,
  trails#7857) is NOT removed — it is the general interlock — but RFC 0132's
  marker can be deleted once this lands, ahead of
  `0132-ar-closure-assertion-parity/tighten-assertion-mark-after-0132`.

## Notes

Related: `0127-fidelity-tooling-signals-and-hygiene/assertion-mark-reseed-rewrites-unrelated-packages`
scopes the reseed so it stops rewriting other packages. That is a different axis
— it is across packages, this contention is inside one — and neither story
substitutes for the other.
