---
title: "Guardrail — fail CI when a 0000- placeholder RFC lands on main"
status: done
updated: 2026-06-12
rfc: "0024-tasks-cli-coverage"
cluster: guardrails
deps: []
deps-rfc: []
est-loc: 70
priority: 30
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

**Closed 2026-06-12 without implementation — superseded by auto-finalize
(#24).** The failure this story was written to prevent (a forgotten manual
finalize silently corrupting `main`) structurally cannot happen anymore: the
`auto-finalize-rfc` workflow renames any `0000-*`/`draft-*` placeholder the
moment it lands on `main` and pushes the result. A failing guard would only
ever fire in the minute-long window before that self-healing push (a false
alarm on every RFC merge) or if the Action itself were disabled — a scenario
better noticed via the visible `0000-*` dir than defended with a second CI
mechanism sharing the same failure modes.

Original context (pre-#24): `main` is supposed to hold only numbered RFCs;
`0000-*` placeholders live on PR branches until finalize assigns a number.
Finalize was a manual pre-merge step, and skipping it silently corrupted
`main`, requiring a repair PR.

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
