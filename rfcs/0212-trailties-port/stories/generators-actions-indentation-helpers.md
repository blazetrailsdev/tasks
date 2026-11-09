---
title: "Port Rails::Generators::Actions indentation/indent/with_indentation"
status: in-progress
updated: 2026-11-09
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#9907
claim: "2026-11-09T12:20:24Z"
assignee: "generators-actions-indentation-helpers"
blocked-by: null
closed-reason: null
---

## Context

`Rails::Generators::Actions#initialize` (vendor/rails/v8.0.2/railties/lib/rails/generators/actions.rb:10-13) sets `@indentation = 0`. trails#9848 inlined it into `Base`'s constructor as `_indentation` (packages/trailties/src/generators/base.ts). Its readers and writers are not ported yet: the private `indentation`, `indent` and `with_indentation` helpers in actions.rb, which `gem_group`, `gem` and `github` use to nest Gemfile output. So the field is currently write-only.

## Acceptance criteria

- Port `indentation`, `indent(content, multiplier = 1)` and `with_indentation(&block)` from actions.rb at their Rails names, as `@internal` members that read and write `_indentation`.
- Converge the call sites in the ported `gem`/`gemGroup`/`github` bodies, if they exist, onto them.
- Port the Rails `actions_test.rb` cases that cover nested `gem_group`/`github` indentation.
