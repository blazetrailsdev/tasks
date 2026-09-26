---
title: "parity:api does not credit Mime's object-literal singleton methods"
status: draft
updated: 2026-09-26
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Mime` is a Ruby module with singleton methods `[]`, `symbols`,
`valid_symbols?`, `fetch`
(`vendor/rails/actionpack/lib/action_dispatch/http/mime_type.rb:50-67`).
trails ports them as members of an object literal,
`export const Mime = { get, symbols, isValidSymbols, fetch }`
(`packages/actionpack/src/action-dispatch/http/mime-type.ts`), since trails#8129.

`parity:api --package actiondispatch` still reports `Mime.symbols` and
`Mime.valid_symbols?` as missing from `http/mime_type.rb` (33/35): the TS API
extractor does not read methods off an exported object literal, although the
call gate does pair them (`tsClass: "Mime"` rows in `call-mismatches.json`).

## Converged shape

Either the extractor credits object-literal module members (as the call-gate
extractor already does), or `Mime` becomes a construct the API extractor reads
— whichever matches how other Ruby modules-with-singleton-methods are ported.

## Acceptance criteria

- `http/mime_type.rb` scores 35/35 in `pnpm parity:api --package actiondispatch`.
