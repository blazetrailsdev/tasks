---
title: "Ruby extractor reads module_eval heredoc params so edit_/new_polymorphic_* arity rows clear"
status: draft
updated: 2026-10-15
rfc: "0156-parity-beyond-name-presence"
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

RFC 0163's Verification requires "no routing arity row" from
`pnpm parity:api --package actiondispatch --arity`. On main @ 9dfedbba23 it
reports `editPolymorphicUrl`, `editPolymorphicPath`, `newPolymorphicUrl`,
`newPolymorphicPath` as `ruby()` vs `ts(recordOrHash, options = …)` on
`routing/polymorphic-routes.ts`, `routing/routes-proxy.ts` and
`routing/url-for.ts`.

Rails defines them in a `%w(edit new).each { module_eval <<-EOT ... EOT }`
heredoc (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/polymorphic_routes.rb:154-166`)
as `def #{action}_polymorphic_url(record_or_hash, options = {})`. The Ruby
extractor credits the names but records no parameters, so the TS side (which is
faithful) shows as an arity mismatch.

## Acceptance criteria

- The Ruby API extractor reads the parameter list of a `def` inside a
  `module_eval` heredoc, so the four rows above disappear from `--arity`.
- No TS signature changes.
