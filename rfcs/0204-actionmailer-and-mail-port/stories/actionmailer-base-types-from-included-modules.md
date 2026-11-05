---
title: "Type ActionMailer::Base's included members from the real modules"
status: done
updated: 2026-11-05
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#9746
claim: "2026-11-05T16:36:28Z"
assignee: "actionmailer-base-types-from-included-modules"
blocked-by: null
closed-reason: null
---

## Context

`packages/actionmailer/src/base.ts`'s `interface Base` hand-declares
`lookupContext` and `render(...args: unknown[])`, which in Rails come from
`include AbstractController::Rendering` / `ActionView::Layouts`
(`vendor/rails/v8.0.2/actionmailer/lib/action_mailer/base.rb:487-496`). The
static side likewise hand-declares `prependViewPath` / `appendViewPath`
(from `ActionView::ViewPaths::ClassMethods`) and the DeliveryMethods class
attributes. `ActionController::Base`
(`packages/actionpack/src/action-controller/base.ts:470-480`) types the same
members from the modules' own exports.

## Acceptance criteria

- `Base`'s instance and static declarations for these members are typed from
  the included modules (`Included<>` / `Extended<>` or the modules' exported
  function types), with no `unknown[]` signatures left.
- `pnpm typecheck` clean; no change to runtime.
