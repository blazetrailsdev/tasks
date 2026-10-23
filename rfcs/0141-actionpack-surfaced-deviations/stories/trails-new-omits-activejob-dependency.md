---
title: "trails new omits @blazetrails/activejob, so generate scaffold crashes"
status: draft
updated: 2026-10-23
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 30
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found re-running the root README quickstart on `main` `9a59b3b073` (trails#8195), Node 24.16.0, SQLite.

`trails new blog` now writes `app/jobs/application-job.ts` (`import ... from "@blazetrails/activejob"`), and since #9226 the finisher eager-loads `app/jobs`. But the generated `package.json` never lists `@blazetrails/activejob`: `packages/trailties/src/generators/app-generator.ts:233-243` names activerecord, activemodel, date, activesupport, rack, ruby-compat, actionpack, actionview and trailties only.

So the first `bin/trails generate scaffold Post title:string body:text` in a fresh app dies with:

```text
Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@blazetrails/activejob' imported from .../blog/app/jobs/application-job.ts
```

Rails: `railties/lib/rails/generators/app_base.rb` `rails_gemfile_entry` / the `rails` gem pulls in `activejob`, and `rails/all` (`railties/lib/rails/all.rb`) requires `active_job/railtie` unless `--skip-active-job`.

Adding `"@blazetrails/activejob": "*"` to the app's `package.json` by hand makes the rest of the quickstart run.

## Acceptance criteria

- `trails new` lists `@blazetrails/activejob` in the generated `dependencies` (and omits both it and `app/jobs` under a skip-active-job option, if one is ported).
- A generator test asserts the dependency is present whenever `app/jobs/application-job.ts` is written.
- The root README quickstart runs from `trails new` through `generate scaffold` with no manual edit.
