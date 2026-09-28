---
title: "Port rails new --dev: trails new --dev links the app to the local trails checkout"
status: ready
updated: 2026-09-28
rfc: "0142-trailties-surfaced-deviations"
cluster: generators
packages: ["trailties"]
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

Found while writing the root README quickstart (trails#8195). None of the
`@blazetrails/*` packages is on npm, so a `trails new` app's `"*"`
dependencies cannot install. The README works around it with a hand-written
pnpm `overrides:` block that `link:`s every package in a checkout:

```sh
{
  echo "overrides:"
  for p in $TRAILS/packages/*; do
    echo "  \"$(node -p "require('$p/package.json').name")\": \"link:$p\""
  done
  printf 'allowBuilds:\n  better-sqlite3: true\n  esbuild: true\n'
} > pnpm-workspace.yaml
```

Rails already solves this exact problem with a generator option.
`AppBase` declares
`class_option :dev, type: :boolean, desc: "Set up the #{name} with Gemfile pointing to your Rails checkout"`
(`vendor/rails/v8.0.2/railties/lib/rails/generators/app_base.rb:115-116`), and
`rails_gemfile_entry` (`:460-470`) then emits
`GemfileEntry.path("rails", Rails::Generators::RAILS_DEV_PATH, "Use local checkout of Rails")`
in place of the version entry. `:edge` / `:main` (`:121-126`) are the
git-branch siblings. trails' `AppBase`
(`packages/trailties/src/generators/app-base.ts`) and `trails new`
(`packages/trailties/src/commands/new.ts`) have no `dev` option. The package
list is hard-coded as `"*"` in `app-generator.ts` (the `dependencies` /
`devDependencies` blocks around `:169-187`).

The JS analogue of a Gemfile `path:` entry is a `link:` (pnpm) or `file:`
(npm/yarn) specifier. Because the packages depend on each other with
`workspace:*`, the app also needs every transitive `@blazetrails/*` package
pinned to the checkout, which is what the `overrides` block does.

## Acceptance criteria

- `trails new <app> --dev` writes the app's `@blazetrails/*` entries pointing
  at the checkout that `bin/trails.js` runs from (the `RAILS_DEV_PATH`
  analogue). It also writes what the package manager needs for transitive
  `@blazetrails/*` resolution (for pnpm, `overrides` plus `allowBuilds` in
  `pnpm-workspace.yaml`), so `pnpm install` then `bin/trails server` works
  with no manual step.
- The option is declared on `AppBase` as a class option, as in Rails, and the
  version arm stays the default.
- A generator test asserts the `--dev` package entries. The `--edge` /
  `--main` arms are out of scope unless trivial, and if deferred they get their
  own story.
