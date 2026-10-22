---
title: "trailmap: CLAUDE.md's screenshot command aborts with 'No usable sandbox' on the box; it needs --no-sandbox"
status: draft
updated: 2026-10-22
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 5
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

CLAUDE.md gives `chrome-headless-shell --window-size=390,1400 --screenshot=...` for phone-width shots. On the box (Ubuntu, AppArmor restricting unprivileged user namespaces) it aborts with `FATAL ... zygote_host_impl_linux.cc:128 No usable sandbox!` and writes no file. Seen while shooting trailmap#74. Adding `--no-sandbox` makes it work.

## Acceptance criteria

- The screenshot command in CLAUDE.md, and in the screenshot notes it points to, includes `--no-sandbox`, and says why.
