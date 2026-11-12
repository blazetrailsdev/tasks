---
title: "Port turbo:install (jsbundling branch) targeting the vite_rails entrypoint"
status: draft
updated: 2026-11-12
rfc: "0000-hotwire-via-vite"
cluster: turbo
packages: [turbo-rails]
deps:
  [
    turbo-rails-package-helpers-and-turbo-stream-format,
    hotwire-vite-claude-md-ruling,
    vite-rails-install-and-precompile-hook,
  ]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/turbo-rails/v2.0.23/lib/tasks/turbo_tasks.rake:1-44` defines `Turbo::Tasks`
(`run_turbo_install_template`, `using_bun?`), `turbo:install` (`:16-26`,
which picks importmap, bun or node) and the `turbo:install:importmap`,
`:node` and `:bun` tasks (`:28-43`). `lib/install/turbo_with_node.rb:1-10`
appends `import "@hotwired/turbo-rails"` to `app/javascript/application.js`
and runs `yarn add @hotwired/turbo-rails`. `turbo_with_bun.rb` does the same
with bun. Test: `vendor/turbo-rails/v2.0.23/test/installer_test.rb` (4).

## Acceptance criteria

- The task picks bun when `using_bun?` is true and node otherwise, as
  upstream does with the importmap arm removed. The node template's
  hard-coded `yarn add` runs the package manager vite_ruby detects from the
  app's lockfile (pnpm, npm, yarn or bun), with a one-line receipt citing the
  ratified section.
- An end-to-end test runs `vite:install` and then this install task in a
  generated app, and asserts the entrypoint import and the `package.json`
  dependency.
- `turbo:install`, `turbo:install:node` and `turbo:install:bun` are ported.
  The importmap arm and `turbo_with_importmap.rb` are dropped, citing the
  ratified CLAUDE.md section.
- The entrypoint path follows the answer to RFC open question 3, with a
  receipt on the one changed segment.
- The package added is `@hotwired/turbo-rails`, as `turbo_with_node.rb:10`
  adds it (RFC open question 5).
- The non-importmap arms of `installer_test.rb` are ported.
