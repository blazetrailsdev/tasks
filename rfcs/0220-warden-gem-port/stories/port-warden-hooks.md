---
title: "Port Warden::Hooks (callback registry and prepend_ filters)"
status: draft
updated: 2026-11-03
rfc: "0220-warden-gem-port"
cluster: warden-core
packages: ["warden"]
deps: ["warden-package-setup"]
deps-rfc: []
est-loc: 260
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`lib/warden/hooks.rb:1-212`, a module `Manager` extends (`manager.rb:12`).

- `_run_callbacks(kind, *args)` (`:7-17`): `send("_#{kind}")` to read the
  registry, then the `except` / `only` / `scope` / `event` option filter at
  `:11-13` (`value.is_a?(Array) ? !value.include?(...) : value != ...`), then
  `callback.call(*args)`. `kind` is one of the closed set below, so per
  CLAUDE.md § "A dispatch by name is spelled directly" the `send` becomes a
  module-private registry or a `switch` over the six readers, not an
  `rbFSend` with a computed name.
- The seven registrars and their readers: `after_set_user` (`:53-69`, with
  `_after_set_user`), `after_authentication` (`:76-79`, a wrapper adding
  `event: :authentication`), `after_fetch` (`:85-88`, `event: :fetch`),
  `before_failure` (`:110-119`), `after_failed_fetch` (`:138-147`),
  `before_logout` (`:166-175`), `on_request` (`:191-200`). Each takes
  `(options = {}, method = :push, &block)` and `send(method, [block, options])`
  (`:62`, `:112`): `method` is `:push` or `:unshift`, a closed pair, written
  directly.
- `prepend_<filter>` (`:203-210`): a `class_eval` string over six names. Port
  as six written methods, each `filter(options, :unshift, &block)`.
- Each reader is `@_x ||= []` on the extended object, i.e. per-class state on
  `Manager`; use an own-property memo (CLAUDE.md § "`inherited` is deferred to
  own-property memo guards") so a `Manager` subclass does not share its
  parent's list unless Ruby would.

Install with `extend()` (CLAUDE.md § "Module mixins"). The spec is its own
story (`port-warden-hooks-spec`) because it drives through `Manager`.

## Acceptance criteria

- `packages/warden/src/hooks.ts` ports every `def` at its Rails name;
  `parity:api` credits `hooks.rb`, including the six `prepend_*` methods.
- No `rbFSend` with a computed hook name; `pnpm parity:api:sends` unchanged.
- A small `hooks.trails.test.ts` covers the option filter until the spec story
  lands (TS-only, so it goes in the `.trails.test.ts` file).
