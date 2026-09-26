---
title: "Mapper#match defaults a missing via to :all where Rails' check_via raises"
status: ready
updated: 2026-09-26
rfc: "0139-actiondispatch-journey-parity"
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

Rails' `Mapper#map_match` computes
`via = Mapping.check_via Array(options.delete(:via) { @scope[:via] })`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/mapper.rb`,
`map_match`). `Mapping.check_via` (`mapper.rb:104-113`) raises `ArgumentError`
("You should not use the `match` method in your router without specifying an
HTTP method. ...") when that list is empty. `mount` passes `via: :all`
explicitly.

trails' `Mapper#match` and `Mapper#mapMatch`
(`packages/actionpack/src/action-dispatch/routing/mapper.ts`) quietly fall back
to `":all"` when there is no `via:`. trails#8126 swapped the `"ALL"` sentinel
for the Rails Symbol spelling there but kept the fallback. So `match "/x", to:
"a#b"` routes every verb where Rails raises.

## Acceptance criteria

- `Mapping.checkVia(via)` is ported with Rails' message, and `match` /
  `mapMatch` go through it, so a `via`-less `match` (with no scope `via`) raises
  `ArgumentError`.
- `mount` keeps passing `via: ":all"` explicitly, as Rails does.
- Callers and tests that relied on the implicit `":all"` pass `via:`
  explicitly; the Rails test covering the raise (`dispatch/routing_test.rb`,
  grep `without specifying an HTTP method`) is ported.
