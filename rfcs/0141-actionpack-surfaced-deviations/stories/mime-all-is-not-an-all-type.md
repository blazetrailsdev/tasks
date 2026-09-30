---
title: "mime-all-is-not-an-all-type"
status: in-progress
updated: 2026-09-30
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8277
claim: "2026-09-30T13:46:11Z"
assignee: "mime-all-is-not-an-all-type"
blocked-by: null
closed-reason: null
---

## Context

Rails' `Mime::ALL` is `AllType.instance`, a `Singleton` subclass of `Mime::Type`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/mime_type.rb:349-362`) that
answers `all?` and `html?` with `true`. trails' `MimeType.ALL`
(`packages/actionpack/src/action-dispatch/http/mime-type.ts`) is a plain
`new MimeType("*/*", null)`, so `MimeType.ALL.isAll()` and `MimeType.ALL.isHtml()`
answer `false`. Surfaced by `mime-type-predicates-through-method-missing`, which ported
`Mime::Type#all?` (`mime_type.rb:324`) as `isAll()`.

## Acceptance criteria

- `AllType extends MimeType` in `mime-type.ts`, constructed as `super("*/*", null)`,
  with `isAll()` and `isHtml()` returning `true`; `MimeType.ALL` is its instance.
- `ALL` is not registered for lookup, as Rails' comment at `mime_type.rb:364-366` says.
- A test asserts `Mime::ALL.all?` / `html?` (port the Rails `mime_type_test.rb` coverage if any).
