---
title: "bin/release's failure mail is tested in CI and on one real failed release"
status: draft
updated: 2026-11-27
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trailmap#209 added `bin/release` (both Procfiles): it runs the release task, and
on failure mails the last 40 lines to `EMAIL` via curl `--ssl-reqd` over
`SMTP_*`. It was only checked by hand against a stub task. There is no
automated test, because a vitest test would have to spawn it, and that needs `node:*`. No real
failed deploy has been run through it.

## Acceptance criteria

- A CI step (shell, not vitest) runs `bin/release` with a failing stub task
  against a local SMTP sink, and asserts: the exit status is passed through, the mail arrives with the
  last lines, and a passing task sends no mail.
- One deliberate failing release on a preview app (e.g. a broken migration)
  produces the mail, and the old containers stay live.
