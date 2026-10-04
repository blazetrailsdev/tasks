---
title: "Port AppBase#apply_rails_template and give AppGenerator a source root, retiring app:template's source-path push and verbose: false"
status: draft
updated: 2026-10-04
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails applies a template through `AppBase#apply_rails_template`
(`vendor/rails/v8.0.2/railties/lib/rails/generators/app_base.rb:264-268`):
`apply rails_template if rails_template`, rescuing `Thor::Error, LoadError, Errno::ENOENT` into
`Error, "The template [#{rails_template}] could not be loaded. Error: #{e}"`. `rails_template` is
set by `set_default_accessors!` (`app_base.rb:270-279`), and the rake task reaches it through
`AppGenerator.apply_rails_template(template, destination)`
(`rails/generators/rails/app/app_generator.rb:331-337`). `apply` is called verbose, so Rails prints
`apply  <path>` and pads the template's output.

After trails#8505, `packages/trailties/src/commands/app.ts` calls `Thor::Actions#apply`
(`packages/trailties/src/thor/actions.ts`) with two workarounds:

- `(await gen.sourcePaths()).push(Dir.pwd())`. `AppGenerator` has no source root:
  `GeneratorBase.defaultSourceRoot` (`packages/trailties/src/generators/base.ts`) answers only
  when `<generator root>/templates` exists on disk, and the app generator's templates are
  `generators/rails/app/templates.ts`, not a directory. With no source path,
  `find_in_source_paths` (`vendor/thor/v1.3.2/lib/thor/actions.rb:153-177`) raises for every path,
  an absolute one included. In Rails the source root is `rails/app/templates`
  (`rails/generators/base.rb`, `default_source_root`), so an absolute template path resolves.
- `{ verbose: false }`. `GeneratorBase` has no `shell`, so the verbose arm's
  `shell.padding += 1` (`actions.rb:222`) would throw. `rebase-generator-base-onto-thor-group`
  gives it one.

## Acceptance criteria

- [ ] `AppGenerator` answers a source root, so `findInSourcePaths` resolves an absolute template
      path with no path pushed by the caller.
- [ ] `AppBase#applyRailsTemplate` and `setDefaultAccessorsBang`'s `rails_template` arm are ported
      line for line, including the rescue and its message, and
      `AppGenerator.applyRailsTemplate(template, destination)` is ported from
      `app_generator.rb:331-337`.
- [ ] The `app:template` entry point calls `AppGenerator.applyRailsTemplate`, `apply` runs with
      its default `verbose`, and the `sourcePaths().push` and `verbose: false` workarounds are gone.
