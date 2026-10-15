---
title: "parity: the inlined-from staleness gate pairs a constructor with its Rails class the way compare.ts does"
status: claimed
updated: 2026-10-14
rfc: "0188-module-initialize-inlined-into-constructors"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: "2026-10-14T23:57:42Z"
assignee: "inlined-from-gate-pairs-constructors-as-compare-does"
blocked-by: null
closed-reason: null
---

## Context

`scripts/api-compare/lint-inlined-from.ts` `inlinedFromFindings` (trails#8810) finds the Rails counterpart of a tagged TS constructor by `rubyFileToTs(entity.info.file, pkg) === tsFile` plus the short name of the class. `scripts/api-compare/compare.ts` pairs the same constructor through `resolveOwner` inside `main` (used by `inlinedSegmentsFor`), which also handles a TS class whose name differs from the Ruby short name and a Ruby file with several owners on one TS seat.

So the two can disagree: a constructor the call gate pairs and compares can be reported by the staleness gate as "sits on a constructor whose file and name mirror no Rails class or module". No tagged constructor exists in `packages/` at filing, so no case is known yet; the conversion stories of RFC 0188 will produce the first ones.

## Acceptance criteria

- The staleness gate and the call gate pair a tagged constructor with the same Rails class: either `compare.ts` writes the pairing it resolved into an artifact the gate reads, or the owner resolution is extracted from `main` and shared.
- A fixture covers a TS class whose name differs from its Rails class's short name and is paired by `compare.ts`; the staleness gate accepts its tags.
- `pnpm parity:api:inlined` stays green on main.
