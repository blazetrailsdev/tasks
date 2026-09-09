---
title: "ruby-compat Module#include overwrites the module's own methods"
status: draft
updated: 2026-09-09
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby's `Module#include` splices the included module BELOW the includer in the
ancestor chain (`vendor/ruby/class.c:1179` `rb_include_module`), so the
including module's own methods outrank the included module's. That is what
makes `ActionView::RoutingUrlFor.include(ActionDispatch::Routing::UrlFor)`
(`actionview/lib/action_view/railtie.rb:100`) work: `RoutingUrlFor#url_for`
still wins, and `super` reaches `UrlFor#url_for`.

ruby-compat has two `include` paths and only one of them honours that.

`include(klass, mod)` (`packages/ruby-compat/src/include.ts:488`) is correct —
the plain-object branch skips a key the target already owns
(`include.ts:551-553`), and the `Module`-instance branch splices a carrier into
the prototype chain (`:502-507`).

`Module#include(mod)` (`packages/ruby-compat/src/include.ts:69-79`), the
module-into-module path, is not:

```ts
include(mod: ModuleObject): void {
  const carrier = carrierOf(this);
  const members = mod as Record<string, unknown>;
  for (const key of Object.keys(members)) {
    if (typeof members[key] !== "function" || /^[A-Z]/.test(key)) continue;
    Object.defineProperty(carrier, key, { ... });   // unconditional
  }
}
```

It copies every member onto the carrier unconditionally, so an included
module's method REPLACES one the module defined itself — the opposite of
Ruby's precedence. A module that defines `url_for` and then includes a module
that also defines `url_for` ends up answering the included one.

Found while porting `RoutingUrlFor` in PR #7649: this is why the module could
not be modelled as a ruby-compat `Module` and was reshaped as a class module
that `include(klass, mod)` mixes into instead.

## Converged shape

`Module#include` should not overwrite a member the module owns. That needs the
carrier to distinguish own definitions (`defineMethod`, `moduleEval`) from
included ones, the way `include(klass, mod)` already does with `trackedKeys`
(`include.ts:514`) — reuse that mechanism rather than adding a second one.

## Acceptance criteria

- `mod.defineMethod("x", own); mod.include({ x: other })` leaves `x` answering
  `own`, mirroring `rb_include_module`'s precedence.
- A member the module does NOT define is still installed by `include`.
- Re-including the same module is idempotent, as it is on the class path.
