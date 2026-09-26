---
title: "Headers lacks the include? alias and merge builds a fresh Request instead of dup"
status: draft
updated: 2026-09-26
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::Http::Headers` (`actionpack/lib/action_dispatch/http/headers.rb`):

- `alias :include? :key?` (`:80`) — trails' `headers.ts` has `isKey` only.
- `merge(headers_or_env)` is `headers = @req.dup.headers; headers.merge!(headers_or_env); headers`
  (`:104-108`); trails builds `Headers.fromHash(this.env)`, a fresh
  `ActionDispatch::Request` over a copied env instead of a dup of the request.

## Converged shape

`headers.ts` declares the `include?` alias at its conventions spelling
(`isInclude`/`includes` per `docs/ruby-ts-conventions.md`), and `merge` dups
the request and reads its `headers`.

## Acceptance criteria

- `headers.isInclude("Content-Type")` (or the conventions spelling) answers like `isKey`.
- `merge` goes through `Request#dup` + `#headers`; `header.test.ts` green.
