---
title: "rails/: add the job-failure mail, OpsMailer and /mail-test twin"
status: draft
updated: 2026-11-09
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trailmap#134 added three things on the trails side only:

- `ApplicationJob`'s `after_discard` failure mail (`app/jobs/application-job.ts`)
- `OpsMailer` (`app/mailers/ops-mailer.ts`), with `jobFailed` and `probe`
- `FailingProbeJob` and the `/mail-test` page (`MailTestsController`)

`rails/` has no Action Mailer: no `ApplicationMailer`, no SMTP settings, no
`EMAIL` read. The gap is recorded as an `app:` entry in `rails/DEVIATIONS.md`
("job-failure mail and `/mail-test` exist on the trails side only"). CLAUDE.md's
tandem rule needs both apps to carry the change.

## Acceptance criteria

- `rails/app/mailers/application_mailer.rb` reads the same SMTP settings from
  the same env vars, and `ops_mailer.rb` provides `job_failed` and `probe`,
  with subjects and bodies identical to the trails side.
- `rails/app/jobs/application_job.rb` has `after_discard` mail `EMAIL`, does
  nothing when `EMAIL` is unset, and never masks the job's error. It also adds
  `failing_probe_job.rb`.
- `MailTestsController`, its route and view are added under `rails/`, and
  `script/tandem` compares `GET /mail-test`.
- The DEVIATIONS.md entry is removed.
