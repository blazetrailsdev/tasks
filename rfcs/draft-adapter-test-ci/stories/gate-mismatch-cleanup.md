---
title: "Reduce test:compare gate-mismatches toward zero"
status: ready
rfc: "draft-adapter-test-ci"
cluster: gates
deps: []
deps-rfc: []
est-loc: 200
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The gate machinery (`describeIf*` / `itIfSupports` + Rails-gate extraction +
`--gates` classifier) shipped (#2856/#2880/#2884) and is advisory (never fails
CI). The 2026-06-02 snapshot showed 524 gate-mismatches (124 should-gate / 336
missing-gate / 57 wrong-gate / 7 over-gated). This story works the **actionable**
classes per file toward `grandGateMismatch → 0`. See this RFC §Design (`gates`).
Lands in the **trails** repo (test files). Likely splits across several PRs.

## Acceptance criteria

- [ ] **wrong-gate / over-gated** reconciled to Rails' gate (prefer
      `itIfSupports("<feature>")` where Rails gates by feature; add the key to
      `SUPPORTS` if missing, verified against vendored Rails).
- [ ] **missing-gate** triaged per test: left un-gated + noted where our impl is
      legitimately more portable, gated where it would misbehave on the adapter
      Rails excludes.
- [ ] **should-gate** NOT bulk-converted — treated as implementation-time
      guidance (the bodies are unimplemented-feature/infra stubs). Only gated
      when the feature is actually built.
- [ ] Per-file "complete" = zero `gate-mismatch` lines in
      `pnpm test:compare --package activerecord --gates` for that file.

## Notes

Advisory work — refresh manifests (drop `--cached`) before each pass. Each
wrong-gate fix also nudges `test:compare` parity. Coordinate with the
test-compare-100 attack plan (separate RFC) so files aren't worked twice.
