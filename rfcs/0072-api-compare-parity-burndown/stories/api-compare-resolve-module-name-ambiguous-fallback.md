---
title: "Measure and resolve resolveModuleName's all-candidates fallback arm"
status: done
updated: 2026-07-26
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 5354
claim: "2026-07-26T14:46:57Z"
assignee: "api-compare-resolve-module-name-ambiguous-fallback"
blocked-by: null
closed-reason: null
---

## Context

`resolveModuleName` (`scripts/api-compare/compare.ts`) ends with a
fall-through arm: when several modules share the short name and _none_ of
them shares a namespace prefix with the including entity, it returns the
**full candidate list** rather than one binding.

PR #5344 removed the analogous broadness from the includer-graph builder and
showed what it costs: 21 methods were counting as implemented in files Ruby's
constant lookup never reaches. This fallback arm is the same failure mode,
just narrower — every returned candidate contributes its methods to the host's
expected surface (`flattenIncludedMethodInfos`) and its includers' files to
the search set (`buildModuleIncluderFqns`), so one wrong candidate is a false
match, not merely noise.

Ruby never binds all of them: lexical scope, then the ancestry chain, then
top-level, then `NameError`. The comment at the arm calls it "original
behavior, safe fallback" — safe against false _negatives_, but it was never
measured against false positives.

## Acceptance criteria

- Measure the arm: how often does it fire on the real manifests, and how many
  matched methods does it currently carry?
- Decide with evidence between (a) narrowing to the ancestry/top-level reading
  and accepting the delta as newly visible gaps (the #5344 disposition), or
  (b) keeping it and documenting the measured justification at the call site.
- Report before/after `pnpm parity:api` totals either way.
