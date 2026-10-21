---
title: "app-generator-ships-prettier-as-the-omakase-style-half"
status: draft
updated: 2026-10-21
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

`rails new` ships a formatter by default; `trails new` does not.

Rails' RuboCop slot does two jobs. `create_rubocop_file` / `rubocop`
(`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/app/app_generator.rb:92-94`, `:393-396`)
writes `.rubocop.yml`, which inherits `rubocop-rails-omakase`
(`.../rails/app/templates/rubocop.yml.tt:1-2`, Gemfile `Gemfile.tt:62-65`). That
config is mostly `Layout/*` cops, i.e. formatting, and `bin/rubocop -a`
autocorrects them. `bin` (`app_generator.rb:111-115`) and the generated CI
(`templates/github/ci.yml.tt:45-59`) run it, and `--skip-rubocop`
(`app_base.rb:100`, `:392-393`) turns all of it off.

trails maps that slot to ESLint (done stories `map-rubocop-to-eslint-in-token-renames`,
`app-base-declares-a-skip-eslint-class-option`,
`app-generator-writes-an-eslint-config-instead-of-rubocop-yml`,
`generated-ci-and-manifest-run-eslint-not-rubocop`). `AppGenerator#eslint`
(`packages/trailties/src/generators/app-generator.ts:1435-1456`) writes
`eslint.config.mjs` with `js.configs.recommended` + `tseslint.configs.recommended`,
which have no layout rules. So the formatting half of the omakase slot is
missing: a generated app has no house style and no autocorrecting formatter.
Found when a trailmap#72 review flagged hand-formatting (trailmap, a
`trails new` app, has no formatter either).

Prettier is the JS ecosystem's formatter and the closest analogue of the
omakase `Layout/*` cops. It belongs inside the existing RuboCop-mapped slot,
not as a new top-level surface. Rails has one switch, `--skip-rubocop`, for
lint and style together, so `--skip-eslint` should skip Prettier too. No new
`--skip-prettier` option: that would be invented surface (trails CLAUDE.md,
"No extra abstraction").

## Acceptance criteria

- `trails new` adds `prettier` (exact version, plus `eslint-config-prettier` so
  ESLint does not fight it) to the generated `devDependencies` beside the ESLint
  packages (`app-generator.ts:256-258`), under the same `this.skip("Eslint")` guard.
- The generated `eslint.config.mjs` ends with the `eslint-config-prettier`
  entry, and a `.prettierrc.json` / `.prettierignore` (same ignore list as the
  ESLint config) is written by the same `createEslintFile` step. The
  "Overwrite or add rules to create your own house style" comment covers both.
- Formatting is reachable the way `bin/rubocop -a` is: either `bin/eslint`
  also runs `prettier --check` (`--write` with `-a`/`--fix`), or a `bin/prettier`
  is created alongside `bin/eslint` under the same exclude pattern
  (`app-generator.ts:482-520`). Pick one and justify it against `app_generator.rb:111-115`.
- The generated CI lint job (`generated-ci-and-manifest-run-eslint-not-rubocop`'s
  output) also fails on unformatted files.
- The freshly generated app passes its own format check (the templates
  `trails new` writes are Prettier-clean).
- `--skip-eslint` generates none of it. `app-generator.test.ts` covers both arms.
