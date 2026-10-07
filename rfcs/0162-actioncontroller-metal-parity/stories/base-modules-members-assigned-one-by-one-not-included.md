---
title: "ActionController::Base copies Layouts, Renderers, Streaming, DataStreaming, Instrumentation, FormBuilder and CSP members instead of including the modules"
status: ready
updated: 2026-10-07
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8571 put the `include()` / `extend()` calls at the bottom of
`packages/actionpack/src/action-controller/base.ts` into Rails' `MODULES` order
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/base.rb:232-272`,
included at `:276-312`). Several `MODULES` entries are still not modules there.
Their members are copied onto `Base` one at a time, between the real includes,
or declared in `Base`'s class body:

- `ActionView::Layouts` (`base.rb:282`): `Base.prototype._normalizeLayout = …`
  and six siblings, plus two `classAttribute` calls and `_writeLayoutMethod()`.
- `Renderers::All` (`base.rb:284`): `Base.prototype._renderToBodyWithRenderer`.
- `Redirecting` (`base.rb:281`): `redirectBack`, `redirectBackOrTo`,
  `_computeRedirectToLocation` assigned beside `include(Base, Redirecting)`.
- `Streaming` (`base.rb:301`): `Base.prototype._renderTemplate`.
- `DataStreaming` (`base.rb:302`): `sendFile`, `sendData`, `sendFileHeadersBang`.
- `Instrumentation` (`base.rb:311`): `redirectTo`, `appendInfoToPayload`,
  `cleanupViewRuntime`, `haltedCallbackHook` assigned after the include.
- `FormBuilder` (`base.rb:295`) and `ContentSecurityPolicy` (`base.rb:297`):
  statics declared in the class body (`defaultFormBuilder`,
  `contentSecurityPolicy`), and CSP's `helper_method` call made by hand.
- `AbstractController::Translation` (`base.rb:277`) and `Logging`
  (`base.rb:307`): not located as includes; confirm where their members live.

An own property on `Base.prototype` beats every included module, so these
members do not take part in the include order the story fixed.

Not in scope, already filed: `Rescue`
(`action-controller-rescue-includes-activesupport-rescuable`), `ParamsWrapper`
(`params-wrapper-process-action-is-inlined-into-base`), `MimeResponds`
(`mime-responds-collector-includes-abstract-collector-module`), `ImplicitRender`
(`implicit-render-send-action-lives-on-its-modules`), `ConditionalGet`
(`conditional-get-modules-included-into-base-with-their-etaggers`), `Caching`
(`abstract-controller-helpers-module-and-caching-instance-halves`).

## Acceptance criteria

- Each module listed above is a `Module` / Concern in its Rails file and reaches
  `Base` through one `include(Base, X)` at its `MODULES` position, with its
  `included do` block carrying the class attributes and `helper_method` calls.
- No `Base.prototype.x = x` line remains for a member of those modules.
- The actionpack suite stays green; a move that cannot be made is filed with
  the method both sides define.
