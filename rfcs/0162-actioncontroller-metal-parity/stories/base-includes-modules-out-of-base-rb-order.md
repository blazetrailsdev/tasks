---
title: "ActionController::Base includes its modules out of base.rb's MODULES order"
status: claimed
updated: 2026-10-06
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: "2026-10-06T12:39:40Z"
assignee: "abstract-controller-drops-invented-available-actions"
blocked-by: null
closed-reason: null
---

## Context

Rails includes `ActionController::Base`'s modules in the order of `MODULES`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/base.rb:232-272`, included at `:276-312`):
`AbstractController::Rendering, Translation, AssetPaths, Helpers, UrlFor, Redirecting,
ActionView::Layouts, Rendering, Renderers::All, ConditionalGet, EtagWithTemplateDigest,
EtagWithFlash, Caching, MimeResponds, ImplicitRender, StrongParameters, ParameterEncoding,
Cookies, Flash, FormBuilder, RequestForgeryProtection, ContentSecurityPolicy, PermissionsPolicy,
RateLimiting, AllowBrowser, Streaming, DataStreaming, HttpAuthentication::{Basic,Digest,Token},
DefaultHeaders, Logging, AbstractController::Callbacks, Rescue, Instrumentation, ParamsWrapper`.

trails#8560 moved `Cookies` and `Flash` below `ParameterEncoding` to match `base.rb:246-249`.
The rest of `packages/actionpack/src/action-controller/base.ts:790-864` is still out of order:
`AllowBrowser` precedes `ImplicitRender` (`:802`), `Caching` follows `Flash` (`:846`),
`Redirecting`, `Instrumentation` and `RequestForgeryProtection` come after `DefaultHeaders`
(`:852-854`), `UrlFor` is last (`:864`), and many modules are assigned member by member
(`Base.prototype.x = x`) between the `include()` calls rather than included.

Include order is method-resolution order, so a module that overrides another's method resolves
differently from Rails wherever two of them define the same name.

## Acceptance criteria

- [ ] The `include()` / `extend()` calls in `base.ts` appear in `MODULES` order.
- [ ] A module moved only where the action-controller tests stay green; a move that cannot be
      made is filed with the method both modules define.
- [ ] No module is added or removed by this story.
