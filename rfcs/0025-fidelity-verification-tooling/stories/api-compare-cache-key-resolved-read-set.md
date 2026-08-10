---
title: "Key parity:api TS cache on the program's resolved read-set, not whole dependency packages"
status: done
updated: 2026-07-27
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 5380
claim: "2026-07-27T00:30:54Z"
assignee: "api-compare-cache-key-resolved-read-set"
blocked-by: null
closed-reason: null
---

## Context

PR #5375 fixed cached-vs-fresh `parity:api` divergence by folding each
package's TRANSITIVE workspace dependency fingerprints into both TS extraction
cache keys (`scripts/api-compare/extract-ts-api.ts`, the `withDeps` /
`dirMtimeFingerprint` helpers, plus `dependencyInputFiles` /
`readWorkspaceGraph` / `transitiveDeps` in `scripts/api-compare/shared-cache.ts`).

Correct, but coarse: the unit is the whole dependency PACKAGE. Measured on the
merge commit, appending one line to
`packages/activesupport/src/core-ext/string/output-safety.ts` invalidates 12 of
13 packages — only `did-you-mean` stays cached — forcing a ~10s full extraction
for a change that almost nothing actually reads.

The extractor already knows the true input set: after
`ts.createProgram(files, opts)`, `program.getSourceFiles()` enumerates exactly
the files the compiler read, including the cross-package `dist/*.d.ts` it
resolved into. Recording those paths in the cache entry and keying the next run
on their hashes would invalidate only the packages whose resolved inputs really
changed. The wrinkle is bootstrapping: the read-set is known only AFTER an
extraction, so the entry must carry its own input list and be validated against
it (a first run on a new package still extracts).

## Acceptance criteria

- `CacheEntry` records the resolved input files (repo-relative) of the
  extraction that produced it, and a cached entry is served only when every
  recorded input still hashes the same.
- Editing a dependency file that a given package does not resolve leaves that
  package's entry valid (pin the `output-safety.ts` case: activesupport edit
  must NOT invalidate packages that never import it).
- The cached-vs-forced invariant from #5375 still holds: cached and
  `API_COMPARE_FORCE=1` runs produce identical `output/ts-api.json` modulo
  `generatedAt`.
- Regression coverage in `scripts/api-compare/shared-cache.test.ts` (or an
  extractor-side sibling) for the read-set validation path.
