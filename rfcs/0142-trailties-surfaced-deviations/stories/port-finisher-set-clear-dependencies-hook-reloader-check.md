---
title: "port-finisher-set-clear-dependencies-hook-reloader-check"
status: done
updated: 2026-09-29
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: trails#8246
claim: "2026-09-29T18:29:30Z"
assignee: "port-finisher-set-clear-dependencies-hook-reloader-check"
blocked-by: null
closed-reason: null
---

## Context

In a generated app's development server, template edits are never picked up.
After `trails new blog` and `generate scaffold Post`, editing
`app/views/posts/index.html.tse` changes nothing until the server restarts
(re-run of the root README quickstart, PR #8195, `main` at `45a00eb2aa`).

The view reloader itself is wired. `packages/trailties/src/trailties/action-view.ts:165-184`
mirrors `actionview/lib/action_view/railtie.rb:108-123`: it pushes a
`ViewReloader` onto `app.reloaders` and registers `app.reloader.toRun`.
Nothing ever polls it, though. Rails' `Finisher` initializer
`set_clear_dependencies_hook`
(`vendor/rails/v8.0.2/railties/lib/rails/application/finisher.rb:184-222`) sets:

```ruby
if config.reloading_enabled?
  if config.reload_classes_only_on_change
    app.reloader.check = lambda { app.reloaders.map(&:updated?).any? }
  else
    app.reloader.check = lambda { true }
  end
else
  app.reloader.check = lambda { false }
end
```

`packages/trailties/src/application/finisher.ts` has no `set_clear_dependencies_hook`.
`ActiveSupport::Reloader.check` keeps its class-attribute default `() => false`
(`packages/activesupport/src/reloader.ts:157`), so `checkBang()` never
reports an update and `ViewReloader#execute` never runs.
`port-remaining-finisher-initializers` (done) listed this initializer at
`finisher.rb:182-` but did not port it.

## Converged shape

`setClearDependenciesHook` declared on `Finisher` in Rails declaration order,
with the `check` arms above. The file-watcher `reloader` that clears autoloaded
constants (`:204-221`) has no Zeitwerk to call in trails (CLAUDE.md, "Trails has
no autoloader"). Port its structure and receipt the `ActiveSupport::Dependencies`
calls `@missingRailsCall … PERMANENT` against that section.

## Acceptance criteria

- [ ] `set_clear_dependencies_hook` is ported per `finisher.rb:184-222`.
- [ ] In a generated app under `trails server` (development), editing a
      `.html.tse` view changes the next response without a restart. A test
      covers `app.reloader.check()` answering `true` after a watched file changes.
