---
title: "rack Response#buffered_body! reads respond_to?(:each) through rbObjRespondTo"
status: draft
updated: 2026-10-19
rfc: "0193-small-gem-ports-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rack::Response::Helpers#buffered_body!` branches on `@body.respond_to?(:each)`
(`vendor/rack/v3.1.14/lib/rack/response.rb:339`). trails' `bufferedBodyBang`
(`packages/rack/src/response.ts`) tests `typeof this._body.each === "function"`, because
`rbObjRespondTo(body, "each")` answers true for a plain object such as `{ push() {} }`
(the "#write calls #<< on non-iterable body" test), then `body.each` is not a function.
Its `Symbol.iterator` arm (a JS-only body shape) was removed in trails#9066.

## Acceptance criteria

- [ ] `bufferedBodyBang` reads `rbObjRespondTo(this._body, "each")`, after ruby-compat stops answering a Hash core method for a plain object that does not define it (see `core-method-tables-answer-respond-to-and-send-alike`).
- [ ] response.test.ts stays green.
