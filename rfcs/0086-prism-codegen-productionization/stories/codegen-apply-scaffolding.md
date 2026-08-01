---
title: "codegen-apply-scaffolding"
status: done
updated: 2026-08-01
rfc: "0086-prism-codegen-productionization"
cluster: null
deps:
  - scorer-getter-and-arrow-resolution
deps-rfc: []
est-loc: 200
pr: 5819
claim: "2026-08-01T19:21:05Z"
assignee: "codegen-apply-scaffolding"
blocked-by: null
closed-reason: null
---

## Context

PR #5727 discussion: the scorer's "missing" rows (79, of which some are
genuinely unported) could be scaffolded by a `codegen:apply <file>
<method>` command that inserts the generated body into the port file at
the Rails-correct position — the spike's "scaffolding accelerator" verdict
made operational. Constraints agreed: draft generator only, never commits,
writes a distinctive marker comment, and the porting agent finishes under
normal test-compare discipline. Requires the cross-file resolver
([[scorer-getter-and-arrow-resolution]]) first, so a method ported into a
different file is not duplicated.

## Acceptance criteria

- codegen:apply inserts a generated method body (marker-commented) at the
  Rails-layout position in the twin file; refuses when the global index
  resolves the method elsewhere.
- Never runs as part of any autofix/commit hook; docs state the draft-only
  contract.
