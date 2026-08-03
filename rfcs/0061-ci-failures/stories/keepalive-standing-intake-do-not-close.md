---
title: "Keep-alive: standing CI-failures intake — do not close"
status: draft
updated: 2026-08-03
rfc: "0061-ci-failures"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 9999
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0061 is the standing intake for CI failures — there will always be more of
them, and per the repo's standing priority rules (CLAUDE.md / memory:
`feedback_ci_failures_rfc_always_top_priority`) it must stay active and at top
priority so new red-CI stories can be filed and claimed immediately.

The `chore: auto-close completed RFCs` job closes any RFC with no open
stories. Without a permanent open story, 0061 auto-closes every time the
backlog empties, and each new CI failure then requires a reopen that races the
auto-close job (see memory: `project_tasks_new_on_closed_rfc_races_autoclose`).

This story is a deliberate keep-alive placeholder: it stays `draft` forever
with an absurdly low-rank priority so it never enters the ready queue and is
never claimed. Do NOT promote, claim, or implement it.

## Acceptance criteria

- [ ] Never. This story is intentionally permanent; close it only if RFC 0061
      is itself retired or the auto-close job learns to exempt standing-intake
      RFCs (at which point file that exemption and close this).
