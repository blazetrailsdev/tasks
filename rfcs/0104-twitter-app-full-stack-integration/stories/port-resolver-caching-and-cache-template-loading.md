---
title: "port-resolver-caching-and-cache-template-loading"
status: ready
updated: 2026-09-04
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 40
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Resolver.caching` is the last unported member of
`vendor/rails/actionview/lib/action_view/template/resolver.rb` — the file is at
86% in `pnpm parity:api --package actionview`, and the three missing names are
`caching` / `caching=` / `caching?` (`resolver.rb:49-54`,
`cattr_accessor :caching, default: true` plus `alias :caching? :caching`).

It was left out of the resolver-protocol unification PR deliberately: nothing
in trails would read it. Its Rails readers are
`ActionView::Base.cache_template_loading` (`base.rb:186-193`), which
reads and writes it, and the `action_view.caching` initializer
(`railtie.rb:90-94`), which sets it from `config.reloading_enabled?`. Neither is
ported — `grep -rn cacheTemplateLoading packages/` finds nothing — so shipping
the accessor alone would have been an unread config flag.

## Acceptance criteria

- `Resolver.caching` / `setCaching` / `isCaching` exist on
  `packages/actionview/src/template/resolver.ts`, backed by `classAttribute`
  from `@blazetrails/activesupport`, defaulting to `true`.
- `Base.cacheTemplateLoading` reads and writes it (`base.rb:186-193`).
- `actionview`'s trailtie sets it from the app's reloading configuration
  (`railtie.rb:90-94`).
- `template/resolver.rb` reaches 100% in `pnpm parity:api --package actionview`.
