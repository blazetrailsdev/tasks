---
title: "Create @blazetrails/stimulus-rails: Engine, Stimulus::Manifest, stimulus:install and stimulus:manifest tasks"
status: draft
updated: 2026-11-12
rfc: "0000-hotwire-via-vite"
cluster: stimulus
packages: [stimulus-rails]
deps: [hotwire-vite-claude-md-ruling]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

- `vendor/stimulus-rails/v1.3.4/lib/stimulus/engine.rb:1-17` and `lib/stimulus-rails.rb`.
- `lib/stimulus/manifest.rb:1-30`: `generate_from`,
  `import_and_register_controller` and `extract_controllers_from`.
- `lib/tasks/stimulus_tasks.rake:1-68`: `stimulus:install` (`:18-28`), the
  importmap, node and bun install tasks (`:30-45`), and `manifest:display` /
  `manifest:update` (`:47-68`).
- The install templates `lib/install/stimulus_with_node.rb:1-22` and
  `stimulus_with_bun.rb`, plus the copied `application.js`,
  `hello_controller.js` and `index_for_node.js` under
  `lib/install/app/javascript/controllers/`.
- Test: `vendor/stimulus-rails/v1.3.4/test/manifest_test.rb`.

## Acceptance criteria

- `packages/stimulus-rails` mirrors `lib/stimulus`, with `compareApi` and
  `compareTests` on.
- The node and bun install arms are ported, and the importmap arm is dropped,
  citing the ratified section. The generated `controllers/index.js` follows
  the answer to RFC open question 1, and the entrypoint path follows open
  question 3.
- `manifest_test.rb` is ported under its upstream name.
