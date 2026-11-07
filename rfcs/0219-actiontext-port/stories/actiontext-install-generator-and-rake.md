---
title: "Port the action_text:install generator, test_unit hook and rake task, wiring Trix and @rails/actiontext from npm"
status: ready
updated: 2026-11-07
rfc: "0219-actiontext-port"
cluster: at-engine
packages: ["actiontext", "trailties"]
deps:
  [
    "actiontext-content-helper-and-views",
    "converge-generators-actions-gemfile-family-onto-package-json",
  ]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

- `vendor/rails/v8.0.2/actiontext/lib/generators/action_text/install/install_generator.rb` (84):
  `install_javascript_dependencies` (`bun add` / `yarn add @rails/actiontext
trix`, `:13-20`), `append_javascript_dependencies` (imports into
  `app/javascript/application.js`, pins into `config/importmap.rb`,
  `:22-36`), `create_actiontext_files` (template `actiontext.css`, copies
  `_blob.html.erb` and the content layout, `:38-48`),
  `enable_image_processing_gem` (`:50-60`), `create_migrations`
  (`railties:install:migrations FROM=active_storage,action_text`, `:62-64`),
  the `using_*?` probes, and `hook_for :test_framework`.
- `install/templates/actiontext.css` (440).
- `lib/rails/generators/test_unit/install_generator.rb` (15) and
  `templates/fixtures.yml` (4).
- `lib/tasks/actiontext.rake` (6): `action_text:install`.
- `enable_image_processing_gem` edits the Gemfile; trails' package.json
  counterpart is decided by `converge-generators-actions-gemfile-family-onto-package-json`
  (RFC 0171).

## Acceptance criteria

- The generator's public methods run in Rails' order with Rails' names; the
  npm package names and importmap pins are the gem's strings verbatim (the
  RFC's "Client side" section).
- `enable_image_processing_gem` uses whatever the RFC 0171 story settles for
  the Gemfile family, with no ActionText-local invention.
- `actiontext.css` and `fixtures.yml` ship as templates; the copied views are
  the `.tse` files from `actiontext-content-helper-and-views`.
- `trails generate action_text:install` and the rake task are reachable from
  trailties, closing RFC 0212's "generator hooks" note for ActionText.
