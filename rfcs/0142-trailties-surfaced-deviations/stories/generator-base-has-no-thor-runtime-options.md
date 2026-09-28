---
title: "GeneratorBase has no Thor runtime options (--pretend/--force/--skip/--quiet)"
status: done
updated: 2026-09-28
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 4
pr: trails#8221
claim: "2026-09-28T16:27:29Z"
assignee: "scaffold-controller-passes-locals-instead-of-setting-ivars"
blocked-by: null
closed-reason: null
---

## Context

Every Rails generator gets Thor's runtime options from `Thor::Actions.add_runtime_options!`
(thor 1.3.2 `lib/thor/actions.rb`, `class_option :force/-f`, `:pretend/-p`, `:quiet/-q`,
`:skip/-s`, `group: :runtime`), which `Rails::Generators::Base` inherits through
`include Thor::Actions` (`vendor/rails/v8.0.2/railties/lib/rails/generators/base.rb:19`).
So `bin/rails generate model post --pretend` sets `options[:pretend]`, and
`railties/test/application/generators_test.rb:270-277` depends on exactly that.

trails' `GeneratorBase.start` (`packages/trailties/src/generators/base.ts`) parses only the
declared `classOptions()`, and `GeneratorBase` declares no runtime options. `--pretend`,
`--force`, `--skip` and `--quiet` fall through to `remaining` and are read as positional
arguments or attributes. `GeneratorOptions` has `pretend` / `force` / `skip` / `quiet`
fields, but they are only reachable through `Generators.invoke`'s `config`, which is how
trails#8216's `generators with apply_eslint_autocorrect_after_generate! and pretend` test
had to pass `pretend`.

Thor is not vendored (same blocker noted in `generators-have-no-thor-source-paths-or-template-files`),
so cite thor 1.3.2 by version.

## Acceptance criteria

- `GeneratorBase` declares the four runtime class options (`force`/`-f`, `pretend`/`-p`,
  `quiet`/`-q`, `skip`/`-s`, boolean, runtime group) in its `static {}` block, as
  `add_runtime_options!` does.
- `start` parses them, so `start(["post", "--pretend"])` sets `options.pretend` and does not
  treat `--pretend` as an attribute.
- The `... and pretend` test in `application/generators.test.ts` passes `"--pretend"`
  through `rails(...)` as argv, with no side channel through `config`.
