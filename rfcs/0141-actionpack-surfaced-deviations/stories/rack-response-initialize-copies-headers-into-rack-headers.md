---
title: "Rack::Response#initialize copies a Hash headers argument into Rack::Headers"
status: draft
updated: 2026-11-10
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

`Rack::Response#initialize` (`vendor/rack/v3.2.8/lib/rack/response.rb:57-65`) raises
unless `headers.is_a?(Hash)`, then copies with `headers.each { |k, v| @headers[k] = v }`
into a `Rack::Headers`. trails#9948 converged the guard in
`packages/rack/lib/response.ts` (`isPlainHash(headers) || headers instanceof Hash`),
but the copy is still `Object.entries(headers)` with `k.toLowerCase()`, so a
ruby-compat `Hash` / `Rack::Headers` instance (now accepted by the guard) is
iterated as a plain object and copies nothing, and `@headers` is a plain
object rather than `Headers.new` (`packages/rack/lib/headers.ts:96`).

## Acceptance criteria

- `@headers` is `new Headers()` and the copy iterates the input as Ruby's
  `each` does, for both a plain object and a `Hash` / `Headers` instance.
- A test passes a `Rack::Headers` to `Response.new` and reads its headers back.
