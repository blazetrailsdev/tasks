---
title: "Move app:template onto railties' framework.rake task over Thor's apply"
status: done
updated: 2026-11-05
rfc: "0171-thor-port"
cluster: null
packages: ["trailties"]
deps: ["port-rails-command-rake-command", "port-thor-actions-apply"]
deps-rfc: []
est-loc: 150
priority: 2
pr: trails#9735
claim: "2026-11-05T12:10:03Z"
assignee: "move-app-template-command-onto-framework-rake-task"
blocked-by: null
closed-reason: null
---

## Context

`app:template` is a Rake task in `vendor/rails/v8.0.2/railties/lib/rails/tasks/framework.rake`
(`generator.apply template`). trails has it as a commander command (`packages/trailties/src/commands/app.ts`), which
imports the template module itself. `port-thor-actions-apply` moves the import into `apply`.

## Acceptance criteria

- [ ] `app:template` is defined through the Rake DSL as `framework.rake` defines it, and
      `packages/trailties/src/commands/app.ts` is deleted.
