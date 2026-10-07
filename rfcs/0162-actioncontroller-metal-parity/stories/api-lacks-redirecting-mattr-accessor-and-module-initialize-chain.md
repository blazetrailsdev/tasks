---
title: "API lacks Redirecting's raise_on_open_redirects accessor and the UrlFor / Instrumentation initialize chain"
status: ready
updated: 2026-10-07
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8613 taught `scripts/api-compare/extract-ruby-api.rb` to unroll
`MODULES.each do |mod| include mod end`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/api.rb:148-150`), so
`api.rb` is now measured against the modules it includes: 62/65. The three
misses `pnpm parity:api --package actioncontroller --missing` lists for
`packages/actionpack/src/action-controller/api.ts` are:

- `raise_on_open_redirects` / `raise_on_open_redirects=`. Rails declares them
  in `Redirecting`'s `included do mattr_accessor :raise_on_open_redirects,
default: false end`
  (`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/redirecting.rb:16-18`),
  so every includer gets them. trails declares the accessor by hand on `Base`
  only (`base.ts`, `mattrAccessor.call(Base, "raiseOnOpenRedirects", { default: false })`),
  and `metal/redirecting.ts`'s `Redirecting` is a class carrying only
  `[included]`. An API controller reads `this.raiseOnOpenRedirects` as
  `undefined` in `_allowOtherHost` (`redirecting.rb:209-211`,
  `metal/redirecting.ts:150`).
- `initialize`. `UrlFor#initialize` sets `@_url_options = nil` after `super`
  (`metal/url_for.rb:32-35`) and `Instrumentation#initialize` sets
  `self.view_runtime = nil` after `super` (`metal/instrumentation.rb:23-26`).
  `base.ts` carries the `UrlFor` body inline in its constructor
  (`parity:api:extra` reports `base.ts constructor inlined-from
metal/url_for.rb`); `api.ts` has no constructor at all.

`api-includes-instrumentation-and-the-rest-of-modules` makes `Redirecting` a
module and includes the rest of `MODULES`, but its acceptance criteria name
neither the `mattr_accessor` nor the `initialize` chain.

## Acceptance criteria

- `mattr_accessor :raise_on_open_redirects, default: false` runs from
  `Redirecting`'s `included` block (`redirecting.rb:16-18`), once, and `base.ts`
  holds no `mattrAccessor.call(Base, "raiseOnOpenRedirects", ...)` line.
- `UrlFor#initialize` (`url_for.rb:32-35`) and `Instrumentation#initialize`
  (`instrumentation.rb:23-26`) live on their modules and chain through `super`,
  so `Base` and `API` both run them, and `base.ts`'s constructor no longer
  carries the `UrlFor` body.
- `pnpm parity:api --package actioncontroller --missing` lists nothing under
  `api.rb`, and `parity:api:extra` drops the `base.ts constructor inlined-from
metal/url_for.rb` and `raiseOnOpenRedirects inlined-from metal/redirecting.rb`
  rows.
