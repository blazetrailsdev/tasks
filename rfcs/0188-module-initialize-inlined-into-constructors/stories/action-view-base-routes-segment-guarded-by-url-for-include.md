---
title: "ActionView::Base sets _routes only where Routing::UrlFor is in the ancestry"
status: claimed
updated: 2026-10-19
rfc: "0188-module-initialize-inlined-into-constructors"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-10-19T20:57:55Z"
assignee: "rack-session-encryptor-drop-json-byte-form-arm"
blocked-by: null
closed-reason: null
---

## Context

`ActionView::Base`'s constructor (`packages/actionview/src/base.ts`) writes `this._routes = null;` at the `super()` position of `ActionView::Base#initialize` (`vendor/rails/v8.0.2/actionview/lib/action_view/base.rb:244-259`). `ActionView::Base` never includes `ActionDispatch::Routing::UrlFor`. A view reaches `UrlFor#initialize` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/url_for.rb:111-114`) only through `build_view_context_class`'s `include routes.url_helpers(supports_path)` (`vendor/rails/v8.0.2/actionview/lib/action_view/rendering.rb:59-67`), on a subclass built at run time. So for a bare `ActionView::Base` the assignment is invented. actionview has no dependency on actionpack and cannot guard it with `isModuleIncluded(new.target, UrlFor)`. Found on trails#9075.

## Acceptance criteria

- The `_routes = null` segment runs only for a view class whose ancestry includes `Routing::UrlFor`, per CLAUDE.md "A module installed at run time is inlined behind a guard". The likely shape is a guard on a namespace seat that actionpack fills, or the segment moves to the constructor of the class `build_view_context_class` builds.
- A bare `new ActionView::Base(...)` sets no own `_routes`.
