---
title: "Gate predicateKindMismatches with an only-shrink mark"
status: ready
updated: 2026-09-23
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: ["classattribute-crediting-misses-writers-and-class-seats"]
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8002 (`reject-predicate-matched-by-non-boolean-getter`) added a report-only list,
`predicateKindMismatches` in `api-comparison.json`. It holds Ruby predicates `foo?`
matched only through the bare candidate `foo` by a getter or value property whose type
cannot hold a boolean (`scripts/api-compare/compare.ts` `predicateKindMismatch`,
`extract-ts-api.ts` `memberAdmitsBoolean`). At merge it listed 42 rows (activerecord 25,
actioncontroller 4, activemodel 3, activesupport 3, actiondispatch 3, actionview 2,
trailties 2). A hand check of all 42 found them all real:

- 38 are `class_attribute` predicates (`activesupport/lib/active_support/core_ext/class/attribute.rb:80-84`
  generates `foo?`). Many are installed at runtime by `classAttribute()`'s `isName` but
  invisible to the extractor. `classattribute-crediting-misses-writers-and-class-seats`
  addresses that and should drain most of them.
- `ConnectionPool#active_connection?` (0155 `pool-active-connection-predicate-is-a-getter`),
  `AbstractAdapter#in_use?` (0119 `abstract-adapter-in-use-predicate-is-a-getter`) and
  `Template#strict_locals?` (0153 `rename-q-predicates-actionview-actionpack`) have their own
  stories.

## Acceptance criteria

- After `classattribute-crediting-misses-writers-and-class-seats` lands, re-measure the list
  and hand-verdict any residue.
- Add an only-shrink per-package mark for `predicateKindMismatches.length`, in the style of
  `lint-block-params.ts` / `block-param-mark.json`, with a `:tighten` script and no reseed.
  Wire it into CI's Rails API comparison job.
- CLAUDE.md "Before you open the PR" lists the new gate.
