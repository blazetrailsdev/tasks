---
title: "app-generator-javascript-gemfile-entry-loads-vite-trails"
status: draft
updated: 2026-11-17
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`trails new` defaults `--javascript` to `vite` and `runJavascript` calls `vite:install`
(`packages/trailties/lib/generators/app-base.ts:740-753`), but the generated app cannot run it:
its `package.json` (`packages/trailties/lib/generators/trails/app/templates/package.json.tt`)
does not list `@blazetrails/vite-trails`, and `config/application.ts.tt` does not load its
engine, so `bin/trails vite:install` and `bin/trails assets:precompile` both answer
`Unrecognized command` in a freshly generated app (checked 2026-11-17 on `7c34e78dfb`, also
after adding the dependency by hand: the engine is never required).

Rails puts the bundler gem in the Gemfile through `javascript_gemfile_entry`
(`vendor/rails/v8.0.2/railties/lib/rails/generators/app_base.rb:491-499`), and `Bundler.require`
loads it. vite_ruby's `assets:precompile` extension is already ported
(`packages/vite-assets/lib/tasks/vite.ts`), and `packages/vite-trails/lib/tasks/vite.ts` installs it.

Blocks `no-asset-precompile-so-production-serves-no-app-assets`, whose Dockerfile
`RUN SECRET_KEY_BASE_DUMMY=1 ./bin/trails assets:precompile`
(`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/app/templates/Dockerfile.tt:92-95`)
needs this task to exist.

## Acceptance criteria

- [ ] `AppBase#javascriptGemfileEntry` is ported from `app_base.rb:491-499`, answering
      `@blazetrails/vite-trails` for `--javascript vite`, and the generated `package.json` lists it.
- [ ] The generated application loads the vite-trails engine, so `bin/trails vite:install` and
      `bin/trails assets:precompile` are recognized in a freshly generated app.
- [ ] A generator test pins both.
