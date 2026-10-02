---
title: "SafeBuffer is not a String seat, so rbObjAsString accepts a to_s answer by toStr"
status: draft
updated: 2026-10-02
rfc: "0154-ruby-compat-surfaced-deviations"
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

Surfaced by trails PR 8415.

`ActiveSupport::SafeBuffer` is `class SafeBuffer < String`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/string/output_safety.rb:19`), and its
`to_s` returns `self` (`output_safety.rb:138-140`).

`packages/activesupport/src/core-ext/string/output-safety.ts` declares `export class SafeBuffer` with
no superclass: it is neither a JS string nor a class built on ruby-compat's `stringSuperclass`
(`packages/ruby-compat/src/string/method-table.ts`), the seat `Arel::Nodes::SqlLiteral` took in
trails PR 8409. So nothing can test it for `RB_TYPE_P(str, T_STRING)`.

That forces a deviation in `rbObjAsString` (`packages/ruby-compat/src/object.ts`). MRI's
`rb_obj_as_string_result` (`vendor/ruby/v3.3.11/string.c:1666`) accepts the `to_s` answer only when it
is a `T_STRING` and never calls `to_str`. The port tests the answer with `rbCheckStringType`, which
does call `toStr`, because a strict test rendered every SafeBuffer as `#<SafeBuffer>` (its `toS`
returns the buffer). A `toS` answering any `toStr`-bearing non-String object is therefore accepted
where MRI falls back to `rb_any_to_s`.

## Converged shape

`SafeBuffer extends stringSuperclass(...)`, so it is a `T_STRING` to ruby-compat, and
`rbObjAsString`'s `toS` arm tests the answer with the `T_STRING` predicate (`isTString`, today private
to `method-table.ts`) with no `toStr` call.

## Acceptance criteria

- [ ] `SafeBuffer` is built on `stringSuperclass`; `rbEql` / `rbHash` treat it as the String it wraps.
- [ ] `rbObjAsString`'s `toS` arm does not call `toStr`; a `toS` answering a `toStr`-bearing non-String falls back to `rbAnyToS`, with a trails test.
- [ ] `packages/activesupport/src/core-ext/string` and `packages/actionview/src/helpers` suites stay green.
