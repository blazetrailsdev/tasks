---
title: "Port Time.rfc2822 and parse with it instead of JS Date in ConditionalGet#to_rfc2822"
status: ready
updated: 2026-09-06
rfc: "0137-rack-test-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: 37
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rack::ConditionalGet#to_rfc2822` (`vendor/rack/lib/rack/conditional_get.rb:75-83`)
parses with `Time.rfc2822(since) rescue nil` — Ruby's RFC2822 parser, which accepts
the obsolete forms the comment above it calls out (`1 Nov 97 09:55 A`) and rejects
everything that is not RFC2822.

`packages/rack/src/conditional-get.ts`'s `toRfc2822` uses `new Date(since)` and
maps `NaN` to `null`. That is the JS engine's own permissive date parsing, not
`Time.rfc2822`: it accepts strings RFC2822 does not (ISO 8601, `"December 17, 1995"`)
and its handling of two-digit years and obsolete zone letters is implementation-
defined rather than RFC2822's.

Carried in the call-set baseline as
`scripts/api-compare/call-mismatches-exclude/rack/conditional-get.json`'s
`to_rfc2822 / rfc2822` row, whose reason is still the RFC 0047 wide-seed
placeholder. Left in place by #7553, which converged that method's guard shape
only.

## Converged shape

Port `Time.rfc2822` (`vendor/ruby/lib/time.rb`) into the `ruby-compat` `Time`
surface — the same way `URI.encode_www_form_component` was ported behind
`Rack::Utils.escape` in #7553 — and make `toRfc2822`'s body the
`Time.rfc2822(since)` call Rails makes, with the `rescue nil` arm as the catch.
Deleting the baseline row is part of the story.

## Acceptance criteria

- [ ] `toRfc2822` calls a ported `rfc2822`, not `new Date`.
- [ ] The parser accepts RFC2822's obsolete forms named at `conditional_get.rb:76`
      and rejects non-RFC2822 strings JS `Date` would accept.
- [ ] The `to_rfc2822 / rfc2822` row is deleted from
      `call-mismatches-exclude/rack/conditional-get.json` (only-shrink; do not
      reseed) and the resulting stale mark is narrowed with
      `pnpm parity:api:calls:tighten`.
- [ ] `packages/rack/src/conditional-get.test.ts` stays green with no test name
      reworded.
