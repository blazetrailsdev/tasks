---
title: "Mime::Type / NullType ? predicates go through method_missing"
status: in-progress
updated: 2026-09-30
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: trails#8277
claim: "2026-09-30T13:32:24Z"
assignee: "mime-type-predicates-through-method-missing"
blocked-by: null
closed-reason: null
---

## Context

Rails answers every `?` predicate on a MIME type through `method_missing`:

- `Mime::Type` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/mime_type.rb:336-346`)
  answers `html?`, `xml?`, `json?` and every other `…?` name as
  `method[0..-2].downcase.to_sym == to_sym`.
- `Mime::NullType` (`mime_type.rb:379-385`) answers any `…?` name with `false`.

The trails port covers neither:

- `MimeType` (`packages/actionpack/src/action-dispatch/http/mime-type.ts`)
  hand-writes one predicate, `isHtml()`, as
  `this.symbol === ":html" || this.string.includes("html")`. That body is
  invented, not the `to_sym` comparison Rails makes.
- `NullType` (`packages/actionpack/src/action-dispatch/http/mime-negotiation.ts`)
  has no predicates at all.

So `format is not nil with unknown format`
(`actionpack/test/dispatch/request_test.rb:910-917`) ports only its
`assert_nil request.format` (trails#8272 gave `NullType` its `nil?` as
`isNil()`). The three `assert_not_predicate request.format, :html?` / `:xml?` /
`:json?` lines are missing from
`packages/actionpack/src/action-dispatch/dispatch/request.test.ts`.

The CLAUDE.md § "Ruby protocol methods with a different JS mechanism" table has
no `action_dispatch/http/mime_type.rb` row, so this story decides the class:
a Proxy trap as in `mime_responds.rb`'s row, or another mechanism, and adds the
row.

## Acceptance criteria

- [ ] `Mime::Type` and `Mime::NullType` answer `…?` predicates with Rails'
      `method_missing` / `respond_to_missing?` semantics. The invented
      `isHtml` body is replaced.
- [ ] The CLAUDE.md protocol table gains a `action_dispatch/http/mime_type.rb` row.
- [ ] `format is not nil with unknown format` ports all three
      `assert_not_predicate` lines.
