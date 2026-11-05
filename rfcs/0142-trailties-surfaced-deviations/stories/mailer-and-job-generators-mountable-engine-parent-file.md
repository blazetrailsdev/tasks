---
title: "Mailer and job generators take the mountable_engine? arm for their application parent file"
status: draft
updated: 2026-11-05
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails picks the application-level parent file through `mountable_engine?`:

- `MailerGenerator#application_mailer_file_name`
  (`vendor/rails/v8.0.2/actionmailer/lib/rails/generators/mailer/mailer_generator.rb:29-35`):
  `"app/mailers/#{namespaced_path}/application_mailer.rb"` for a mountable engine,
  else `"app/mailers/application_mailer.rb"`.
- `JobGenerator#application_job_file_name`
  (`vendor/rails/v8.0.2/activejob/lib/rails/generators/job/job_generator.rb`), same shape.

trails' `packages/trailties/src/generators/trails/mailer/mailer-generator.ts`
`applicationMailerFileName` and `trails/job/job-generator.ts`
`applicationJobFileName` return only the non-engine path, under
`@missingRailsCall mountable_engine? — CONVERGEABLE scaffold-controller-hooks-test-framework-and-engine-arms`.
That story ports `mountable_engine?` / `namespace_dirs` but does not list these two arms.

## Acceptance criteria

- Once `mountableEngine` is ported (deps: scaffold-controller-hooks-test-framework-and-engine-arms),
  both methods take Rails' `if mountable_engine?` arm with `namespacedPath()`, kebab-case file names.
- The `@missingRailsCall` receipts on both methods are removed.
