---
title: "mime-responds-reaches-base-by-class-body-assignment-not-include"
status: draft
updated: 2026-10-10
rfc: "0162-actioncontroller-metal-parity"
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
closed-reason: null
---

## Context

`ActionController::MimeResponds` is a module
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/mime_responds.rb:8`) whose one
instance method is `respond_to` (`mime_responds.rb:211`), and `ActionController::Base` gets it
by `include`, as the `MimeResponds` entry of `Base::MODULES`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/base.rb:231-271`).

In trails `packages/actionpack/src/action-controller/metal/mime-responds.ts` exports `respondTo`
as a free function plus the `Collector` and `VariantCollector` classes, and no `MimeResponds`
module. `packages/actionpack/src/action-controller/base.ts` reaches it by a class-body
assignment, `respondTo = respondTo;`, so there is no module object for `Base.MODULES` to hold
and none for `ActionController.const_get(:MimeResponds)` to resolve.

Found while sizing `api-without-modules-and-load-hooks-are-not-ported`, whose
"`Base.MODULES` holds the modules `base.rb:231-271` lists, and `base.ts` includes them from it"
needs every entry to be an includable module. `ParameterEncoding` and the `ViewPaths` half of
`ActionView::Layouts` have the same gap and are owned by
`base-view-paths-and-parameter-encoding-reach-base-through-include`.

## Acceptance criteria

- [ ] `mime-responds.ts` exports `MimeResponds`, a `Module` whose `respondTo` is defined on it
      (`mime_responds.rb:211`), and `base.ts` gets `respondTo` by `include(Base, MimeResponds)`
      in `MODULES` order, with the class-body `respondTo = respondTo` gone.
- [ ] `action-controller/controller/mime/respond-to.test.ts` stays green.
