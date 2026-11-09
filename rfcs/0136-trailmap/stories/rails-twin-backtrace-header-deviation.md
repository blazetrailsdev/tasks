---
title: "rails/: record the job-failure mail's JS-style backtrace header in DEVIATIONS.md"
status: draft
updated: 2026-11-09
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trailmap#135 made `rails/app/jobs/application_job.rb` head the failure mail's backtrace with
`"#{exception.class.name}: #{exception.message}"` and prefix each frame with four spaces and "at", so the mail reads
like the trails side's JavaScript `error.stack`. That is a language deviation, which CLAUDE.md says
`rails/DEVIATIONS.md` records under **language**, but it was not recorded there.

## Acceptance criteria

- A `language:` entry in `rails/DEVIATIONS.md` names the backtrace formatting and its one place.
