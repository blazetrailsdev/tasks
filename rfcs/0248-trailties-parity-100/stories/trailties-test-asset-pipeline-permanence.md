---
title: "trailties: rule on sprockets_assets, assets and asset_debugging tests"
status: ready
updated: 2026-11-18
rfc: "0248-trailties-parity-100"
cluster: receipts
packages: [trailties]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
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
served by Vite (`vite_rails`)" covers Propshaft. Sprockets has no section yet
(RFC Open question 1).

## Acceptance criteria

- [ ] Tests that exercise only Vite-reachable behavior are ported.
- [ ] Every remaining test carries `PERMANENT-SKIP:` citing a ratified section; Sprockets rows wait for the operator ruling.
- [ ] All three files show Miss 0.
