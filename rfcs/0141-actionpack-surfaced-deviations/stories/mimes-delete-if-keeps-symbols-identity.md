---
title: "Mimes#deleteIf reassigns @symbols, staling Base.defaultFormats"
status: draft
updated: 2026-09-26
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Mime::Mimes#delete_if` mutates `@symbols` in place
(`vendor/rails/actionpack/lib/action_dispatch/http/mime_type.rb:28-37`,
`@symbols.delete(sym_type)`). Identity matters: `action_dispatch.rb:150`
sets `ActionView::Base.default_formats ||= Mime::SET.symbols`, aliasing the
live array, so a later `Mime::Type.unregister` also drops the format from
`default_formats`.

trails' `Mimes#deleteIf` (`packages/actionpack/src/action-dispatch/http/mime-type.ts`)
reassigns `this._symbols = this._symbols.filter(...)`, so the array
`Base.defaultFormats` aliases (seated by `packages/actionpack/src/namespaces.ts`'s
`onLoad("action_view")` since trails#8129) goes stale after an unregister.

## Converged shape

`deleteIf` removes entries from `_symbols` in place (splice), preserving
identity.

## Acceptance criteria

- After `MimeType.unregister(":foo")`, `Base.defaultFormats` no longer contains
  `":foo"` (same array as `MimeType.SET.symbols`).
