---
title: "controller-respond-to-shadows-rb-obj-respond-to"
status: done
updated: 2026-09-28
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8209
claim: "2026-09-28T02:00:53Z"
assignee: "authentication-generator-cookie-session-end-to-end"
blocked-by: null
closed-reason: null
---

## Context

Ruby's `ActionController::Base` answers two different methods, `respond_to`
(MimeResponds, `vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/mime_responds.rb:211`)
and `respond_to?` (Object). trails spells both `respondTo`: the controller's
`respondTo = respondTo` (`packages/actionpack/src/action-controller/base.ts`), and
`rbObjRespondTo` (`packages/ruby-compat/src/object.ts`, the port of
`rb_obj_respond_to`, `vendor/ruby/v3.3.11/vm_method.c:2934`) treats any `respondTo`
found on the prototype chain as a Ruby `respond_to?` override and calls it.

So `rbObjRespondTo(controller, "request")` calls the controller's mime
`respond_to("request")`: it negotiates a format for the mime `"request"`, and
with a real request it throws. The first reader to hit it is
`ActionView::Helpers::UrlHelper#_filtered_referrer`
(`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/url_helper.rb:822-828`,
`packages/actionview/src/helpers/url-helper.ts` `_filteredReferrer`), so
`url_for(:back)` from a dispatched controller's view context raises
`TypeError: Cannot read properties of undefined (reading 'equals')` instead
of answering the referer. Found while covering
`url-for-included-hook-includes-url-for-modules` (its `url_for(:back)` AC arm
could not be covered for this reason).

## Acceptance criteria

- `rbObjRespondTo(controller, "request")` answers `true` for a dispatched
  `ActionController::Base` without invoking MimeResponds' `respond_to`.
- A dispatched controller's view context answers `urlFor(":back")` with the
  request's `HTTP_REFERER` (`routing_url_for.rb:87-88`, `url_helper.rb:822-828`).
- The resolution is a repo-wide spelling decision for Ruby's `respond_to?`
  override vs a Rails method named `respond_to`, recorded where the other
  protocol-method decisions live (CLAUDE.md § "Ruby protocol methods with a
  different JS mechanism"), not a per-class special case.
