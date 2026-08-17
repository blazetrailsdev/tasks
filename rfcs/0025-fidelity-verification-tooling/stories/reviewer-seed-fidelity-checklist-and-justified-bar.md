---
title: "Reviewer seed omits locals/decomposition/member-order and accepts unconstrained 'justified'"
status: draft
updated: 2026-08-03
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #5979 (the fidelity-instructions audit), after merge.

The audit found the implementer and reviewer instructions were badly
asymmetric: the reviewer prompt carried a strict fidelity rubric that
CLAUDE.md never stated. #5979 fixed the implementer side. The reviewer side
still has three holes, and they matter now precisely because the new CLAUDE.md
rules are only as durable as the review that checks them.

The trails reviewer prompt is a Go string literal in
`~/github/deanmarano/btwebooks/webhook/handler.go` (REVIEW PHILOSOPHY block,
around lines 3925-3990). It is NOT editable from `~/.btwhooks/messages.json`:
trails has no `reviewer_prompt` key, and adding one is unsafe — the per-repo
override at `handler.go:3882-3891` replaces the entire hardcoded prompt and
appends only delivery mechanics plus the prior-reviews block, so it would drop
the WORKFLOW, PARITY MAP, CARRYING FINDINGS FORWARD sections and the
`<!-- comments: N; open: M -->` sentinel that btwhooks parses for cycle
counting. So this is a Go source change, not config.

The three holes:

1. The seed's item 3 enumerates "method names, argument order and defaults,
   control flow, branch conditions, early returns, error/exception behavior,
   and edge-case handling". It never mentions local or parameter names, method
   decomposition, constant/field names, or member order within the file. Those
   classes score near zero in the review corpus (2-3 flagged blocks across
   5,405 PRs) because reviewers are not asked to look, not because the drift is
   absent. CLAUDE.md now requires all four.
2. CARRYING FINDINGS FORWARD offers `justified — the impl agent gave a
Rails-backed reason; cite it` as a terminal status, with nothing
   constraining what counts. This is the reviewer-side half of the
   converge-never-ratify rule CLAUDE.md now states.
3. Nothing tells the reviewer that a diff ADDING a `call-mismatches-*-exclude`
   row, an `arity-exclude.json` entry, or a `@noRailsEquivalent` /
   `@missingRailsCall` tag is registering a new deviation whose `reason` should
   be reviewed at least as hard as the code. A seeded placeholder reason
   currently passes review as long as the gate is green — which is how the
   unreviewed-reason population grew enough to need the RFC 0083 ratchet.

Full analysis and proposed replacement wording (R0-R3) is in the audit at
`~/.btwhooks/data/github/blazetrailsdev/trails/audits/fidelity-instructions-20260803T134718Z.md`,
section "Which agent does each change target?".

## Acceptance criteria

- The reviewer prompt's fidelity enumeration in `handler.go` also names method
  decomposition, constant and field names, local and parameter names, and
  member order within the file.
- The `justified` status admits only (a) a gem/path.rb:LINE cite showing Rails
  does this, or (b) a TypeScript language shortcoming with the settled
  workaround ruled out. Preference-shaped reasons stay OPEN. A deviation the
  agent agrees is wrong but defers is OPEN until a convergence story id appears
  in the PR body.
- A new numbered item makes baseline and deviation-tag additions reviewable by
  default, with a seeded or code-restating reason called out as a finding.
- The `<!-- comments: N; open: M -->` sentinel, PARITY MAP, WORKFLOW and
  CARRYING FINDINGS FORWARD sections are all still emitted; verify against a
  freshly rendered seed under
  `~/.btwhooks/data/github/blazetrailsdev/trails/<pr>/reviewer-seed.txt`.
- Do NOT implement this by adding a `reviewer_prompt` key for trails in
  messages.json, for the reason above.

## Re-verified 2026-08-17 (draft sweep)

Still valid. Note the edit target is outside this repo — the reviewer prompt is a
Go string literal in `~/github/deanmarano/btwebooks/webhook/handler.go` — so this
story cannot be closed by a trails PR and should be scheduled accordingly.
