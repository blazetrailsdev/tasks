---
title: "Vendor rack-cache and port RailsMetaStore / RailsEntityStore"
status: draft
updated: 2026-09-27
rfc: "0164-actiondispatch-http-parity"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/rack_cache.rb` (67
lines) defines `RailsMetaStore < Rack::Cache::MetaStore` (`:12`: `self.resolve`,
`initialize(store = Rails.cache)`, `read`, `write`) and `RailsEntityStore <
Rack::Cache::EntityStore` (`:36`: `self.resolve`, `initialize`, `exist?`,
`open`, `read`, `write`). `pnpm parity:api --package actiondispatch` reports the
file 0/6, and `test/dispatch/rack_cache_test.rb` (`RackCacheMetaStoreTest`, 1
test: "stuff is deep duped") has no trails file.

Both classes subclass the rack-cache gem, which is not vendored. Rails' Gemfile
pins it: `rack-cache (1.17.0)` (`vendor/rails/v8.0.2/Gemfile.lock:434`). The
precedent for a Rack-ecosystem gem trails needs is `rack`, `rack-session` and
`rack-test`: each is vendored under `vendor/` and ported as its own package.

## Acceptance criteria

- rack-cache 1.17.0 is added as a vendored source (`vendor/sources.ts`,
  procedure in `vendor/README.md`), with its lib at a versioned path.
- `Rack::Cache::MetaStore` and `Rack::Cache::EntityStore` are ported with the
  members the two Rails subclasses reach, at their Ruby names, where the
  package layout rules put a new gem port.
- `http/rack-cache.ts` ports both Rails classes; `dispatch/rack-cache.test.ts`
  ports the Rails test.
- If the base classes do not fit this PR, ship the vendoring and the base
  classes here and file the Rails subclasses as a follow-up story in this RFC.
