---
title: "codegen-stdlib-idiom-mapping"
status: done
updated: 2026-08-02
rfc: "0086-prism-codegen-productionization"
cluster: null
deps:
  - codegen-golden-output-snapshots
deps-rfc: []
est-loc: 250
priority: 11
pr: 5842
claim: "2026-08-02T00:03:26Z"
assignee: "codegen-stdlib-idiom-mapping"
blocked-by: null
closed-reason: null
---

## Context

RFC 0065 roadmap item 4, still open — the spike doc's Honest limits #4 records
that Ruby stdlib idioms (`attributes.collect { }`, `arr.first`, `Array(x)`)
pass through untranslated. The asymmetry is now load-bearing: the conformance
scorer already owns a canonicalization table (`scripts/prism-codegen/score.ts`
around the `forEach: "each"` / `toA: "toArray"` map) that folds these idiom
pairs on BOTH sides so they do not read as divergence. That means the scorer is
papering over a generator gap, and the generated JS a claimer would scaffold
from ([[codegen-apply-scaffolding]]) still says `collect`. Move the mapping to
where it belongs: a Ruby-core -> JS/trails-runtime table applied in the
generator's call emission, so the emitted image is the port's idiom, and the
scorer's canon table shrinks to the cases that are genuinely two spellings of
the same ported thing.

## Acceptance criteria

- A stdlib idiom table maps the enumerable/array/kernel core set at emission
  (`collect`->`map`, `Array()`, `blank?`, `raise`->`throw`, and the pairs the
  scorer currently folds); helpers land in `runtime.ts` where no direct JS
  image exists.
- Scorer canonicalization entries made redundant by generator-side mapping are
  removed, and `pnpm codegen:score` matched count does not regress.
- 0 parse errors invariant holds; per-idiom tests.
