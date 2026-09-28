---
title: "Triage actionpack's assertion mismatches into per-file burn-down stories"
status: draft
updated: 2026-09-28
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: ["actionpack"]
deps:
  [
    "testing-harness-parity-residue",
    "rendering-parity-residue",
    "metal-parity-residue",
    "routing-parity-residue",
    "http-call-baselines-and-residue",
    "middleware-call-baselines-and-residue",
  ]
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Assertion mismatches are measured only for matched tests, so they rise as the
sibling RFCs port tests. On 2026-09-27, before any of them landed, the ungated
marks in `scripts/test-compare/assertion-mismatch-mark.json` were:
actiondispatch `{assertionCount: 357, kind: 513, value: 72}`,
actioncontroller `{283, 463, 76}`, abstractcontroller `{5, 18, 0}`.

Some of these are real divergences (a trails test asserting less than Rails);
some are an unmapped trails assertion helper, which counts as one unmapped
assertion where Rails' `assert_called_with` counts several.

## Acceptance criteria

- `pnpm parity:test:assertions` and
  `scripts/test-compare/output/convention-comparison.json` are read per file, and
  each file's residue is classified as divergence or mapping gap.
- Each file (or small group) with divergence gets a burn-down story in this RFC
  via `pnpm tasks new`, with the file's counts and the Rails `file:line` range.
- Mapping gaps are filed against the tooling RFC that owns the assertion
  mapping.
- The measured marks after the ports are recorded in this RFC's changelog.
