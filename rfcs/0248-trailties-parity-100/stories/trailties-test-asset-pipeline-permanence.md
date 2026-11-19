---
title: "trailties: rule on sprockets_assets, assets and asset_debugging tests"
status: claimed
updated: 2026-11-19
rfc: "0248-trailties-parity-100"
cluster: receipts
packages: [trailties]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: "2026-11-19T18:33:07Z"
assignee: "port-source-paths-for-not-namespaced-generators-test"
blocked-by: null
closed-reason: null
---

## Context

Three Rails test files exercise the Sprockets / Propshaft asset pipeline:

| Rails test file                                                          | Miss |
| ------------------------------------------------------------------------ | ---: |
| `vendor/rails/v8.0.2/railties/test/application/sprockets_assets_test.rb` |   32 |
| `vendor/rails/v8.0.2/railties/test/application/assets_test.rb`           |   20 |
| `vendor/rails/v8.0.2/railties/test/application/asset_debugging_test.rb`  |    6 |

Root CLAUDE.md § "importmap-rails and propshaft are out of scope; JavaScript is
served by Vite (`vite_rails`)" covers Propshaft. Operator ruling (2026-11-19): Sprockets is explicitly out of
scope too; Vite is the chosen path. That section is amended to name Sprockets.

## Acceptance criteria

- [ ] Root CLAUDE.md § "importmap-rails and propshaft are out of scope;
      JavaScript is served by Vite (`vite_rails`)" names Sprockets as out of
      scope (heading kept so citations resolve), and Sprockets'
      unported-files rows are permanent.
- [ ] Tests that exercise only Vite-reachable behavior are ported.
- [ ] Every remaining test carries `PERMANENT-SKIP:` citing that section.
- [ ] All three files show Miss 0.
