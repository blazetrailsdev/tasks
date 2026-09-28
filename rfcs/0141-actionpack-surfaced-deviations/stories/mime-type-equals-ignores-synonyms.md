---
title: "mime-type-equals-ignores-synonyms"
status: ready
updated: 2026-09-27
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
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

Rails' `Mime::Type#==` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/mime_type.rb:297-302`)
returns false for a nil operand, then compares against `@synonyms + [self]`,
each by `to_s` or `to_sym`. trails' `MimeType#equals`
(`packages/actionpack/src/action-dispatch/http/mime-type.ts`) compares only
`string` / `symbol` and never walks `synonyms`.

`respond_to` (`mime_responds.rb:218`, `media_type != format`) reaches it
through `rbEqual` (trails#8194). So a response whose media type is a
registered synonym of the negotiated type (for example `text/x-json` for
`:json`) raises `RespondToMismatchError` where Rails does not.
`negotiateMime` (`mime_negotiation.rb:143-153`, `order.include?(priority)`) uses
the same `equals` and is affected the same way. Raised in review of trails#8194.

## Acceptance criteria

- `MimeType#equals` mirrors `Mime::Type#==` line by line: the nil guard, then the
  synonyms-plus-self walk comparing `to_s` / `to_sym`.
- A cover: `respond_to` with `format.json` and a response media type of
  `text/x-json` does not raise `RespondToMismatchError`.
