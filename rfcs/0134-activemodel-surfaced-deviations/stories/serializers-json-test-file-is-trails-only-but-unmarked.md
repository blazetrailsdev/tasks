---
title: "activemodel: serializers/json.test.ts is trails-only but not named .trails.test.ts"
status: in-progress
updated: 2026-09-06
rfc: "0134-activemodel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: 7551
claim: "2026-09-06T12:18:19Z"
assignee: "bigdecimal-round-diverges-from-mri-on-negative-ndigits"
blocked-by: null
closed-reason: null
---

## Context

Deferred from `serializers-json-tests-extend-instead-of-include` (PR #7527),
whose "Converged shape" asked: "Note `json.test.ts` describes itself as
'Serializers::JSON host' and has no Rails counterpart file... If it is genuinely
trails-only it should be renamed to `json.trails.test.ts` as part of this —
check `parity:test` before and after."

The rename was not done there, for a reason that survives the story: a
`packages/activemodel/src/serializers/json.trails.test.ts` ALREADY exists beside
it (2 tests, covering `fromJson` under `setParseJsonTimes`). So the "rename" is
really a file MERGE of `json.test.ts`'s 16 tests into the existing
`json.trails.test.ts`, not a `git mv` — a different and larger change than the
one-line rename the note implies, and out of scope for a PR already carrying
five convergences.

Confirmed while there: `json.test.ts` appears in no test-compare mapping
manifest (`grep -rln "json.test.ts\|json_serialization" scripts/` hits only
`scripts/stale-story-references.test.ts`), so `parity:test` credits nothing to
it under either name. The Rails-counterpart file for this directory is
`json-serialization.test.ts` -> `activemodel/test/cases/serializers/json_serialization_test.rb`,
which is separate and untouched.

## Converged shape

Decide whether `json.test.ts`'s 16 cases are genuinely trails-only. If they are,
merge them into `json.trails.test.ts` and delete `json.test.ts`, so the
directory holds exactly one Rails-mapped file (`json-serialization.test.ts`) and
one trails-only file, per the repo's `.trails.test.ts` convention. If any case
does mirror a Rails test in `json_serialization_test.rb`, that case keeps the
Rails test name verbatim and stays in a mapped file instead — check each against
the Rails file before moving it, rather than moving the block wholesale.

No test NAMES change either way; `pnpm parity:test` percent for activemodel must
not drop and `scripts/test-compare/assertion-mismatch-mark.json` must not rise.

Related: [[test-compare-lint-and-serializers-json-mapping]] (blocked) is the
mapping half of the same directory question.

## Acceptance criteria

- [ ] Each of `json.test.ts`'s 16 cases is checked against
      `activemodel/test/cases/serializers/json_serialization_test.rb` and
      classified trails-only or Rails-mirroring.
- [ ] Trails-only cases live in `json.trails.test.ts`; `json.test.ts` is gone or
      holds only Rails-mirroring cases under their verbatim Rails names.
- [ ] No test name changes; `pnpm parity:test` activemodel percent does not drop;
      the assertion-mismatch mark is not raised.
