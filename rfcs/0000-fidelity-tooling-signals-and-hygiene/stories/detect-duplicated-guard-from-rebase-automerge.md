---
title: "Spike: detect the duplicated-guard half of the rebase auto-merge failure mode"
status: ready
updated: 2026-07-30
rfc: "0000-fidelity-tooling-signals-and-hygiene"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: 10
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0025 story `lint-rebase-automerged-files` (PR #5431) fixed half of a
two-part failure mode. A rebase that auto-merges a file produces content no
hook ever lints, and it bit PR #5356 twice in one rebase:

1. Orphaned imports — now caught by the `post-rewrite` / `post-merge` hooks
   added in #5431.
2. A duplicated guard — #5355 fixed `HasOneAssociation#foreignKeyColumns` to
   consult the rich reflection; #5356 fixed the same bug at a slightly
   different offset. Git merged both without conflict, leaving two identical
   `_reflectOnAssociation(...)?.foreignKey` lookups in one function, the second
   unreachable. No lint rule and no test catches this — a human reviewer found
   it.

Case 2 was explicitly out of scope for #5431 because it needs semantic
analysis, not lint. It is filed here so the gap is tracked rather than lost in
the PR prose.

## Acceptance criteria

- Investigate whether a cheap near-duplicate check over the files a rewrite
  touched can flag case 2 without a false-positive flood — e.g. detecting
  repeated identical statements/conditions within a single function body.
  A spike outcome of "not worth the noise, close it" is an acceptable result,
  recorded with the evidence.
- If viable, wire it into `scripts/lint-rewritten-files.sh` behind the same
  report-only contract (never blocks a rebase).
- Verify against the real #5355/#5356 reproduction: the merged
  `foreignKeyColumns` body with two identical reflection lookups must be
  flagged; the pre-merge parents must not be.

## Re-verified 2026-08-17 (ready sweep)

Citations spot-checked against the current tree and still resolve; no path or
mechanism in this body has been retired. Carried forward unchanged.

General note from the sweep, applies to every `scripts/api-compare/` story: RFC 0092
moved `conventions.ts`, `types.ts`, `shared-cache.ts` and `write-json-manifest.ts`
to `scripts/parity/`, and RFC 0084 folded `call-mismatches-wide-exclude/` and
`lint-call-mismatches-wide.ts` into the single `call-mismatches-exclude/` tree.
Re-check any such reference before starting.
