---
title: "ExceptionWrapper's four tables carry bare-name duplicates Rails does not have"
status: done
updated: 2026-09-10
rfc: "0111-error-class-message-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 34
pr: trails#7677
claim: "2026-09-10T21:00:07Z"
assignee: "exception-wrapper-tables-carry-bare-name-duplicate-keys"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #7615 (RFC 0111), which made ActiveRecord error classes carry
Ruby's fully-qualified `e.class.name` (`"ActiveRecord::StatementInvalid"`).

`ExceptionWrapper`'s four lookup tables are keyed in Rails **only** on
fully-qualified class names
(`vendor/rails/actionpack/lib/action_dispatch/middleware/exception_wrapper.rb:12-46`):

```ruby
cattr_accessor :rescue_responses, default: Hash.new(:internal_server_error).merge!(
  "ActionController::RoutingError"                     => :not_found,
  ...
cattr_accessor :rescue_templates, default: Hash.new("diagnostics").merge!(
  "ActionView::MissingTemplate"            => "missing_template",
  "ActiveRecord::StatementInvalid"         => "invalid_statement",
  ...
cattr_accessor :wrapper_exceptions, default: ["ActionView::Template::Error"]
cattr_accessor :silent_exceptions, default: [
  "ActionController::RoutingError",
  "ActionDispatch::Http::MimeNegotiation::InvalidType",
]
```

trails' port (`packages/actionpack/src/action-dispatch/middleware/exception-wrapper.ts:55-99`)
carries a **bare-name duplicate beside each qualified key** — a workaround from
when ported error classes exposed only the bare constructor name on `.name`:

- `RESCUE_TEMPLATES` (`:78-90`) has all six Rails keys plus `MissingTemplate`,
  `RoutingError`, `ActionNotFound`, `StatementInvalid`, `MissingExactTemplate`.
- `WRAPPER_EXCEPTIONS` (`:93`) adds `"TemplateError"`.
- `SILENT_EXCEPTIONS` (`:96-99`) keys `"RoutingError"` bare where Rails keys
  `"ActionController::RoutingError"`.
- `STATUS_MAP` (`:55-76`) is the worst of the four: it is not Rails' name
  (`rescue_responses`), its values are HTTP integers where Rails' are Symbols
  (`:not_found`, `:bad_request`), and ~15 of its ~21 keys are bare.

Since #7615 the AR half of this is dead weight — `ActiveRecord::StatementInvalid`
now matches the qualified key directly — but the actionpack/actionview/
abstractcontroller halves still depend on the bare aliases wherever those
packages' own error classes have not been qualified, so the aliases cannot just
be deleted without checking each one.

`classNameOf` (`:75` in the pre-#7615 numbering, the canonical reader) already
prefers `e.name` when set, so qualifying the remaining error classes is the
convergence path, not a new lookup mechanism.

## Converged shape

Each table keyed only on the fully-qualified names Rails uses, in Rails' order,
with `rescue_responses` restored as the name and Symbol values (`":not_found"`
per the repo's Ruby-Symbol-as-colon-prefixed-string convention) rather than a
`STATUS_MAP` of integers. Any error class whose bare alias is load-bearing gets
its `.name` qualified first, the way #7615 did for `ActiveRecord::*` and the way
`ActionDispatch::ParamError` (`action-dispatch/http/param-error.ts:28`) and
`ActionDispatch::Http::MimeNegotiation::InvalidType` (`mime-negotiation.ts:38`)
already do.

## Acceptance criteria

- [ ] `RESCUE_TEMPLATES`, `WRAPPER_EXCEPTIONS` and `SILENT_EXCEPTIONS` carry only
      Rails' fully-qualified keys, matching exception_wrapper.rb:30-46 key for key.
- [ ] `STATUS_MAP` is renamed to `rescueResponses` and holds Rails' Symbol values
      and qualified keys (exception_wrapper.rb:12-28), or the deviation is
      narrowed to whatever genuinely cannot convert.
- [ ] Every error class that a deleted bare alias was covering carries its
      fully-qualified Rails `.name`, so the qualified key still matches.
- [ ] Coverage pins at least one lookup per table through a real raised error
      rather than a hand-built string.
- [ ] `pnpm parity:api` deltas non-negative; actionpack suites green.
