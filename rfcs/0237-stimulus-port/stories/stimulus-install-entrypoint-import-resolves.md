---
title: "stimulus-install-entrypoint-import-resolves"
status: in-progress
updated: 2026-11-18
rfc: "0237-stimulus-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10311
claim: "2026-11-18T19:06:39Z"
assignee: "stimulus-install-entrypoint-import-resolves"
blocked-by: null
closed-reason: null
---

## Context

- `vendor/stimulus-rails/v1.3.4/lib/install/stimulus_with_node.rb:10-12` (and `stimulus_with_bun.rb`) append `import "./controllers"` to `app/javascript/application.js`, which sits next to `app/javascript/controllers/`.
- `packages/stimulus/lib/install/stimulus-with-{node,bun}.ts` (trails#10294) append the same line to `app/javascript/entrypoints/application.js`. The CLAUDE.md vite section changes only that directory segment. From `entrypoints/`, `./controllers` resolves to `entrypoints/controllers`, which does not exist, so a generated app's import is broken.
- The same question applies to turbo's `turbo_with_node.rb:1-3` once it is ported.

## Acceptance criteria

- The operator rules on the import specifier: `../controllers`, vite_rails' `~/controllers` alias, or something else. The ruling is recorded in the CLAUDE.md vite section.
- Both stimulus install templates write the ruled specifier, with a `@missingRailsArgs append_to_file — PERMANENT` receipt.
- `packages/vite-trails/test/stimulus-install.trails.test.ts` asserts the new line.
