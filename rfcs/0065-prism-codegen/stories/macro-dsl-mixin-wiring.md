---
title: "macro-dsl-mixin-wiring"
status: draft
updated: 2026-07-16
rfc: "0065-prism-codegen"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/prism-codegen/out/base.js` shows class-macro calls emitted verbatim
inside the class body: `include(Core)`, `extend(Querying)`, `hasMany("posts")`.
That is not valid JS class syntax and not the repo's mixin wiring
(`Model.staticMethod = fn` / `include()` from `@blazetrails/activesupport`,
per CLAUDE.md). Rails source:
`vendor/rails/activerecord/lib/active_record/base.rb:283-332` (the
include/extend list) and `associations.rb` (`has_many`/`belongs_to` macros).

## Acceptance criteria

- Add handlers that recognize `include`/`extend`/`prepend` at class-body level
  and emit the repo's mixin runtime shape instead of a bare call.
- Recognize the association macros (`has_many`, `has_one`, `belongs_to`,
  `has_and_belongs_to_many`) and emit the trails declaration surface.
- Golden test over `base.rb` output asserting no `include(...)` call survives in
  a class body.
