---
title: "Load and register app/jobs classes in the finisher so job_class constantizes in a booted app"
status: draft
updated: 2026-09-29
rfc: "0169-activejob-package-port"
cluster: null
packages: ["trailties"]
deps: ["register-activejob-constants-for-class-name-round-trip", "port-activejob-railtie"]
deps-rfc: []
est-loc: 250
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

In Rails, Zeitwerk autoloads `app/jobs/*_job.rb` when `constantize` first names
a job class. trails has no autoloader (CLAUDE.md § "Trails has no autoloader");
its eager directory scan is `loadControllers` in
`packages/trailties/src/application/finisher.ts:150`, which walks
`app/controllers`, imports each `*_controller` / `*-controller` file and
registers each exported `…Controller`.

Without the same for jobs, a booted app's inline or async adapter serializes
`"job_class" => "WelcomeEmailJob"` and cannot `constantize` it back
(`core.rb:63`), so every enqueued job fails. Extend the finisher's eager load
with the job directory: walk every existent `app/jobs` path, import each
`*_job` / `*-job` `.ts`/`.js` file, and register each exported `…Job` under
its namespace-prefixed Ruby name (the mechanism from
`register-activejob-constants-for-class-name-round-trip`).

This is the trails eager-scan counterpart of Zeitwerk's `app/jobs` root, not a
Rails method; it cites the CLAUDE.md section and carries no new public name.

## Acceptance criteria

- [ ] A booted fixture app with `app/jobs/welcome-email-job.ts` performs `WelcomeEmailJob.performLater()` through the inline adapter.
- [ ] Namespaced jobs (`app/jobs/admin/cleanup-job.ts`) register as `Admin::CleanupJob`.

## Definition of done

Requiring apps to register job classes by hand does not close this story.
