---
title: "Scope the per-file option-key and literal maps to the same package"
status: done
updated: 2026-08-02
rfc: "0083-wide-call-ratchet-noise-reduction"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 5871
claim: "2026-08-02T11:16:52Z"
assignee: "scope-per-file-option-key-and-literal-maps-to-package"
blocked-by: null
closed-reason: null
---

## Context

`tsParamsByFileName` in `scripts/api-compare/compare.ts` is keyed by a
package-RELATIVE file path and is populated for this package AND its dep
packages (the dep loop records each method under `m.file`). Relative paths
collide across packages — `attribute-methods.ts` exists in both activemodel and
activerecord, `schema-statements.ts` in several adapters — so a same-file lookup
can return a dep package's signatures.

PR #5855 fixed this for the calls-parity ported-with-args gate by giving it a
package-only per-(file, name) map (`tsParamsByFileNameInPkg`). The two other
consumers of `tsParamsByFileName` were left alone because moving them shifts
their own baselines:

- `checkOptionKeys` (via `tsOptionKeysByFileName`, populated in the same
  `recordTsParams` call)
- `checkLiterals` (via `tsParamsByFileName` directly)

Both are documented as deliberately per-FILE scoped precisely to stop a sibling
same-named method from lending its keys/defaults — the cross-package collision
defeats that intent in exactly the way the comment warns about.

## Acceptance criteria

- `checkOptionKeys` and `checkLiterals` resolve against package-only per-file
  maps, matching the ported-with-args gate.
- Option-key and literal baselines/outputs reseeded; report the delta.
- The per-file comments record that the scoping is package-only and why.
