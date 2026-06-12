---
title: "Guardrail — fail CI when a 0000- placeholder RFC lands on main"
status: draft
updated: 2026-06-11
rfc: "0024-tasks-cli-coverage"
cluster: guardrails
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`main` is supposed to hold only numbered RFCs; `0000-*` (and legacy `draft-*`)
placeholders live on PR branches until finalize assigns a number. Finalize is a
manual pre-merge step, and skipping it silently corrupts `main` — this has already
required a repair PR. This story makes the invariant enforced instead of
remembered.

## Acceptance criteria

- [ ] `validate.mjs` (and therefore CI + the pre-commit hook) fails when run on
      `main` and any `rfcs/0000-*` or `rfcs/draft-*` directory exists.
- [ ] The check is scoped so it does **not** fire on PR branches (placeholders are
      legitimate there) — e.g. gated on branch/ref or run as a dedicated CI step
      on the merge target only.
- [ ] Failure message names the offending dir and points at the existing
      `scripts/finalize-rfc.mjs` (switching to `tasks finalize` once
      [[cli-finalize-rfc]] lands). The remediation it names must always exist — so
      this story stays landable before the CLI wrapper does.
- [ ] A test/fixture demonstrates the guard tripping and passing.

## Notes

The enforcement half of [[cli-finalize-rfc]]. Independent of the editor work — can
land any time. Decide the branch-detection mechanism (CI context vs. git ref) as
part of the story.
