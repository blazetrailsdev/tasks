---
title: "negotiate_mime's order.include? crashes on a nil Mime[mime] entry"
status: draft
updated: 2026-09-28
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `negotiate_mime`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/mime_negotiation.rb:143-153`)
tests `order.include?(priority)`. `Array#include?` sends `==` from each element
(`rb_equal(e, obj)`, `vendor/ruby/v3.3.11/array.c` `rb_ary_includes`), so a nil
element answers false and the loop moves on.

`respond_to(*mimes)` seeds `@responses` with `Mime[mime] => nil`
(`action_controller/metal/mime_responds.rb:253-258`), and `Mime[mime]` is nil
for an unregistered name. So `order` can hold nil, and Rails then raises
`ActionController::UnknownFormat` when nothing else matches.

trails' `negotiateMime` (`packages/actionpack/src/action-dispatch/http/mime-negotiation.ts`)
tests `order.some((o) => o.equals(priority))`. Since trails#8194,
`MimeResponds::Collector` stores `Mime.get(mime)`'s `undefined` as a key, as
Rails stores nil, so `respondTo("unregistered")` throws
`TypeError: Cannot read properties of undefined (reading 'equals')` instead of
`UnknownFormat`.

## Acceptance criteria

- `negotiateMime`'s membership test is `Array#include?`'s: each element
  compared with `rbEqual(element, priority)`, so a nil/undefined element
  answers false.
- A cover: `respondTo("unregistered_format")` on a controller raises
  `UnknownFormat`, as `mime_responds.rb:223-224` does.
