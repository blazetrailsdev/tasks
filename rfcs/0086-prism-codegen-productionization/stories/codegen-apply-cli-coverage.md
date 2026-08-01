---
title: "Test coverage for the codegen:apply CLI layer"
status: draft
updated: 2026-08-01
rfc: "0086-prism-codegen-productionization"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/prism-codegen/apply-cli.ts` (added in PR #5819) has no test coverage.
`apply.test.ts` exercises only the pure `planApply` planner; every CLI-layer
behaviour was verified by hand:

- argument-count / usage output,
- unknown Rails file (not in `TARGET_FILES`), with the known-file list,
- missing twin port file,
- the `(toplevel)` guard,
- `--dry-run` reporting the insertion point without writing,
- the write path plus the "nothing was staged or committed" contract.

Raised as a reviewer note on #5819: the `__PRISM_TODO` passthrough refusal is a
stated acceptance criterion of `codegen-apply-scaffolding`, and although the
gate itself now lives in `planApply` and is unit-tested, the CLI's sourcing of
that count from `perDef` is not. `score-cli.ts` is untested for the same
historical reason, so a shared approach would cover both.

## Acceptance criteria

- A test file drives `apply-cli`'s behaviours above against a temp port file,
  without invoking the real Rails vendor tree where avoidable.
- The dry-run path is asserted to leave the port file byte-identical.
