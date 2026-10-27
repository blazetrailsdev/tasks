---
title: "config.x set in the application class reads empty from requests under the development server"
status: draft
updated: 2026-10-27
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while porting trailmap to Rails (trailmap#85, `rails/DEVIATIONS.md`, "trails: `config.x` reads empty in the development server").

trailmap's `config/application.ts:24-25` sets `this.config.x.tasks.dir = env.TASKS_DIR` (and `config.x.fleet.repoPaths`) in the application class's static block. Booting through `config/environment` in a plain `tsx` process keeps the value. Under `bin/trails server` in development (Vite, reloading on), requests read `config.x.tasks.dir` as unset, although the process environment carries `TASKS_DIR`. Every page then says "TASKS_DIR names no tasks checkout", `/up/ready` fails `checkout` and `git_identity`, and search matches titles only. Production hides it, because `TASKS_DATABASE` there ends in `.git/tasks.db` and `config/tasks-content.ts` derives the checkout from it.

Reproduced 2026-10-26 with `TASKS_DIR` set and a `TASKS_DATABASE` that is not `<checkout>/.git/tasks.db`. Root cause not verified. The first suspect is a second module instance of the application class under Vite's SSR module graph, so request code reads a `config` that the static block never wrote.

Rails reads one `Rails.application.config.x` for the life of the process, reloading or not (`railties/lib/rails/application/configuration.rb`, `Custom`), and the Rails twin (`rails/config/application.rb:21-23`) keeps the value in development.

## Acceptance criteria

- A trailties test boots an application in development mode through the dev server's module loader, sets `config.x.<ns>.<key>` in the application class, and reads the same value from a request.
- The fix is in trailties (the dev server / reloader), not a trailmap workaround.
- trailmap's dev server answers `/up/ready` with `checkout` ok when only `TASKS_DIR` names the checkout.
