---
title: "Behavior's attr_reader ports through rbModAttrReader on a plain module"
status: ready
updated: 2026-10-21
rfc: "0197-plain-object-modules-replace-ruby-compat-module"
cluster: null
packages: ["actionpack", "ruby-compat"]
deps: []
deps-rfc: []
est-loc: 60
priority: 10
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#9140 made `ActionController::TestCase::Behavior` a plain-object module (`packages/actionpack/src/action-controller/test-case.ts`). Rails declares `attr_reader :response, :request` (`vendor/rails/v8.0.2/actionpack/lib/action_controller/test_case.rb:377`).

`rbModAttrReader` (`packages/ruby-compat/src/object.ts:922`, through `rbAttr` and `defineAccessorHalf`, `:883-885`) defines the reader non-enumerably. `include()` copies only a plain module's enumerable members, so the reader never reached the includer. The port therefore hand-writes two enumerable getters reading `this._response ?? null`. `ActionDispatch::Assertions#html_document` (`action-dispatch/testing/assertions.ts`) uses the same workaround.

## Acceptance criteria

- [ ] `Behavior` declares its readers with `rbModAttrReader({ prototype: Behavior }, "response", "request")`, the port of `attr_reader`, with no hand-written getters.
- [ ] `rbAttr` on a plain-object module writes an accessor that `include()` copies. Either it writes the accessor enumerably on a plain module, or the plain-module copy admits accessors that `rbAttr` recorded.
- [ ] `test-case.trails.test.ts` and `controller/test-case.test.ts` stay green.
