---
title: "Delete the invented action-dispatch respond-to and RequestForgeryProtection modules"
status: draft
updated: 2026-09-26
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8138, which removed the duplicate error classes from these files but left the modules themselves.
Rails has no ActionDispatch counterpart for either:

- `packages/actionpack/src/action-dispatch/respond-to.ts` (188 lines) has its own `Collector` and
  `respondTo`. Rails has one: `ActionController::MimeResponds#respond_to` and
  `ActionController::MimeResponds::Collector`
  (`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/mime_responds.rb`), already ported at
  `action-controller/metal/mime-responds.ts`. Only `action-dispatch/index.ts` and
  `action-controller/controller/mime/respond-to.test.ts` use it.
- `packages/actionpack/src/action-dispatch/request-forgery-protection.ts` (249 lines) has a
  `RequestForgeryProtection` class with an options object (`strategy`, `sessionKey`, ...). Rails has
  only the `ActionController::RequestForgeryProtection` concern
  (`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/request_forgery_protection.rb`), ported
  at `action-controller/metal/request-forgery-protection.ts`. `action-controller/base.ts:13,497-502`
  builds one as `_csrfProtection`, and `action-controller/controller/request-forgery-protection.test.ts`
  tests it.

## Acceptance criteria

- Both action-dispatch modules are deleted, along with their `action-dispatch/index.ts` exports.
- `ActionController::Base` gets CSRF protection through the metal concern only, as `base.rb` does.
- The respond-to and request-forgery test files exercise the metal ports.
