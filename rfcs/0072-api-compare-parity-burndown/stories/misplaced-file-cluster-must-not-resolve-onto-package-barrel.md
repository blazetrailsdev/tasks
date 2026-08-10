---
title: "selectMisplacedFile latches onto the package barrel, silently mis-pairing whole buckets"
status: done
updated: 2026-08-08
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6235
claim: "2026-08-08T14:02:06Z"
assignee: "sqlite-in-memory-predicate-disagrees-with-adapter"
blocked-by: null
closed-reason: null
---

## Context

`selectMisplacedFile` (`scripts/api-compare/compare.ts:1461`) picks one TS file
for a Ruby bucket whose expected TS path does not exist, by voting: each of the
bucket's Ruby method names votes for every TS file containing a candidate. The
package barrel (`packages/<pkg>/src/index.ts`) re-exports the whole package, so
it contains a candidate for essentially every name and wins the vote outright —
it passes all three thresholds (min hits, 50% coverage, 2x separation) whenever
any real file would.

The consequence is a silent mis-pairing: the bucket's methods are compared —
arity, option keys, call-parity, skeletons — against whichever same-named symbol
the barrel happens to re-export, which is unrelated to the port. PR #6225 hit
exactly this: `core_ext/object/acts_like.rb`'s bucket landed on
`activesupport/src/index.ts`, so Ruby `Object#as_json`
(`vendor/rails/activesupport/lib/active_support/core_ext/object/json.rb:58-66`)
was compared against `TimeWithZone#asJson` and its `instance_values` call read as
a body gap. That instance was fixed with a `RUBY_FILE_TS_OVERRIDES` entry, one
Ruby file at a time; the underlying voting bug is untouched and every other
bucket with a non-existent expected TS file is exposed to it.

`api-compare` counts 4 misplaced files in activesupport alone after #6225; each
should be audited for whether the cluster it latched onto is the barrel.

## Acceptance criteria

- [ ] `selectMisplacedFile` no longer resolves a bucket onto the package barrel
      (`index.ts`), which is a re-export site rather than a port location.
- [ ] Buckets that legitimately live at the barrel keep their credit — RUBY_FILE_TS_OVERRIDES
      maps `activesupport:core_ext/integer/inflections.rb` to `index.ts` explicitly
      (`scripts/api-compare/conventions.ts:121`), and that is the direct-match path,
      not the cluster path; it must be unaffected.
- [ ] Any bucket that loses its cluster as a result is re-homed with an explicit
      `RUBY_FILE_TS_OVERRIDES` entry naming the file trails actually ports it to,
      rather than being left as missing.
- [ ] Unit test in `scripts/api-compare/compare.test.ts` alongside the existing
      `selectMisplacedFile` cases.
- [ ] `pnpm parity:api:calls` green; `pnpm parity:api` delta non-negative.
