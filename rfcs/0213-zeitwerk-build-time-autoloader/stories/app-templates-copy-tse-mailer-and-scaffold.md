---
title: "app-templates-copy-tse-mailer-and-scaffold"
status: done
updated: 2026-11-03
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9641
claim: "2026-11-02T23:16:44Z"
assignee: "app-templates-copy-tse-mailer-and-scaffold"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/railties/lib/rails/tasks/framework.rake:19-20` copies `erb/{controller,mailer,scaffold}`. `packages/trailties/src/tasks/framework.ts` copies only `tse/controller`: `generators/tse/mailer` does not exist and `generators/tse/scaffold` has a `templates.ts` module, no `templates` directory, so `cp_r` would raise.

## Acceptance criteria

- `tse/mailer/templates` and `tse/scaffold/templates` exist as template directories.
- `defaultTemplates.tse` in `framework.ts` is `["controller", "mailer", "scaffold"]`.
