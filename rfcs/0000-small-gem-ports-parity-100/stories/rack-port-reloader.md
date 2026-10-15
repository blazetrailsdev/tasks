---
title: "Port Rack::Reloader (reloader.rb has no TS file)"
status: draft
updated: 2026-10-15
rfc: "0000-small-gem-ports-parity-100"
cluster: rack-api
packages: [rack]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rack/v3.1.14/lib/rack/reloader.rb` (112 lines) has no `packages/rack/src/reloader.ts`. `parity:api` reports 0/7: `Rack::Reloader#initialize`, `#call`, `#reload!`, `#safe_load`, and `Rack::Reloader::Stat#rotation`, `#figure_path`, `#safe_stat`. The Ruby `safe_load` uses `Kernel#load`, which is ruby-compat's `rbFLoad` (trails CLAUDE.md § "A migration file is loaded by `Kernel#load`"). The tests are `vendor/rack/v3.1.14/test/spec_reloader.rb`, if one is vendored there.

## Acceptance criteria

- [ ] `reloader.ts` mirrors `reloader.rb` method by method, and rack `files` reaches 46/46.
- [ ] `parity:api` reports 7/7 for `reloader.rb`, with no new call or call-argument rows.
- [ ] Any upstream spec is ported with Rails' bodies.
