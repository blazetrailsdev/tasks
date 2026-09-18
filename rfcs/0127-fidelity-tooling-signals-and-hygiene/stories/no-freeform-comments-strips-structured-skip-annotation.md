---
title: "no-freeform-comments strips ROOT-CAUSE/SCOPE lines of the structured skip annotation"
status: draft
updated: 2026-09-18
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
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

`blazetrails/no-freeform-comments` (`--fix`, run by the pre-commit hook) deletes the `// ROOT-CAUSE:` and `// SCOPE:` lines of the structured skip annotation, keeping only `// BLOCKED:`. The annotation format is defined in `scripts/test-compare/normalize-skips.ts:10-15` and RFC 0132 stories tell agents to write all three lines naming the filed story in `SCOPE:`. In PR #7868 all 14 parked tests lost their `ROOT-CAUSE:`/`SCOPE:` lines at commit time; the story slug had to be folded into the `BLOCKED:` line.

## Acceptance criteria

- The rule keeps a `BLOCKED:` / `ROOT-CAUSE:` / `SCOPE:` block directly inside an `it.skip` body, matching `normalize-skips.ts`.
- One shape is documented for naming the filed story (SCOPE line or BLOCKED line), and the RFC 0132 story template matches it.
