---
title: "Re-profile /feed for rbCallSuper's share of self time after trails#10062"
status: draft
updated: 2026-11-13
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`rb-call-super-init-internals-is-cheap` set "`rbCallSuper` is at most 1% of `/feed` self time" on the `examples/twelve-dollar-server` profile (3.3% on 2026-10-30, 1.4% on `/posts/250000`). trails#10062 inlined `Base#initInternals` and made `rbCallSuper` cheaper, and measured only an in-process benchmark: `initInternals` 1,067 ns to 347 ns a call, and `limit(20)` load 15.6 µs to 13.3 µs a record on a three-column model. The host was at load 20-37, so the server benchmark (good to about ±10% there) could not resolve a 3% effect, and the `/feed` profile was not re-taken.

## Acceptance criteria

- A CPU profile of `/feed` and `/posts/250000` on a quiet host, at a commit containing trails#10062, reports `rbCallSuper`'s share of self time.
- If the share is above 1%, the remaining callers are named by frame and filed as stories; if it is at or below 1%, this story closes with the figures.
- The README table in `examples/twelve-dollar-server/README.md` gains a row for the new run.
