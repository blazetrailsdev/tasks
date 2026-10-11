---
title: "actionview-base-delegates-erb-trim-mode-writer-to-the-handler-constant"
status: closed
updated: 2026-10-11
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "FALSIFIED: converged in trails#8795 in the review round after it was filed"
---

## Context

`ActionView::Base` has `delegate :erb_trim_mode=, to: "ActionView::Template::Handlers::ERB"`
inside `class << self` (`vendor/rails/v8.0.2/actionview/lib/action_view/base.rb:184-185`).
`packages/actionview/src/base.ts` has no such member, and `parity:api --missing` lists
`erb_trim_mode= → tseTrimMode` under `base.rb`.

It cannot be written with `delegate` (`packages/activesupport/src/module-ext.ts`) today:
`Delegation.generate` resolves a constant-path `to` with `constantize`
(`packages/activesupport/src/delegation.ts`), and none of `ActionView`, `ActionView::Template`,
`ActionView::Template::Handlers` or the TSE handler is a registered constant
(`constantize("ActionView")` raises `uninitialized constant ActionView`). The `ActionView`
namespace object (`packages/actionview/src/namespaces.ts`) seats only `Base`; `TemplateHandlers`
(`template/handlers.ts`) is a free const, not `Template.Handlers`.

A hand-written `static set tseTrimMode` importing the handler into base.ts was tried on
trails#8795 and rejected in review: it is not a delegation and adds a base.ts -> tse.ts
module-eval edge.

## Acceptance criteria

- The TSE handler is reachable as the constant path Rails names
  (`ActionView::Template::Handlers::TSE`), seated on the `ActionView` namespace.
- `Base` declares the writer with `delegate.call(<singleton>, "tseTrimMode=", { to: ... })`,
  resolved at call time, with no eager base.ts -> tse.ts import.
- The `erb_trim_mode=` row under `base.rb` matches; plain-node import of built `dist/base.js`
  and `dist/template/handlers/tse.js` as entry modules both succeed.
