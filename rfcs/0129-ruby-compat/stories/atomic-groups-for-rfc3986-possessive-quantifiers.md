---
title: "Restore RFC3986_Parser's possessive quantifiers as JS atomic groups"
status: draft
updated: 2026-09-04
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`URI::RFC3986_Parser`'s two whole-URI patterns are written with possessive
quantifiers throughout — `(?:%\h\h|[!$&-.0-9;=A-Z_a-z~])*+` for `reg-name`,
`\g<seg>++`, `[^\#]*+` for the query, `\h++` in `IPvFuture`
(`vendor/ruby/lib/uri/rfc3986_parser.rb:5-71`). Possessive quantifiers do not
backtrack, which is what keeps `split` linear on an input that fails to match.

The port in `packages/ruby-compat/src/uri/rfc3986-parser.ts` (#7491) renders
every one of them as an ordinary greedy quantifier, and says so in the module
comment: "The possessive quantifiers Ruby writes (`*+`, `++`) are greedy here;
JS has no possessive form, so the patterns backtrack where MRI's refuse to."

That comment is true about the JS syntax and wrong about the conclusion — JS
has no possessive quantifier, but it does have the standard emulation, an
atomic group spelled with a capturing lookahead and an immediate backreference:
`(?=(P))\1` matches `P` and then refuses to give any of it back. So the
divergence is convergeable and should not have been left as prose.

Reachability: `URI.parse` is called on attacker-shaped strings by design —
`Rack::Test::Session#parse_uri` (`vendor/rack-test/lib/rack/test.rb:272`) and
`follow_redirect!` (`test.rb:225`) both parse a `Location` header. A long
almost-matching input against the greedy `reg-name` / `seg` alternations is the
classic quadratic-backtracking shape.

## Converged shape

Wrap each formerly-possessive group as `(?=(...))\1` in the pattern builders in
`rfc3986-parser.ts` (`RFC3986_URI`, `RFC3986_relative_ref`, and the `regexp`
table entries built from the same sources), keeping the named groups `split`
reads outside the atomic wrapper so `m.groups` is unchanged. Numbered
backreferences and the named groups coexist, but the wrapper's own capture
group shifts every unnamed index — read groups by NAME only, which `split`
already does.

Then delete the "they backtrack where MRI's refuse to" sentence from the module
comment rather than rewording it.

## Acceptance criteria

- [ ] Every `*+` / `++` in `rfc3986_parser.rb:5-71` has an atomic counterpart
      in the port, cited to the Ruby line it mirrors.
- [ ] `split` still answers the same nine components for the whole existing
      `uri.trails.test.ts` corpus, plus the pinned MRI-verified cases.
- [ ] A test pins a long non-matching input (e.g. `"http://" + "a".repeat(50000)
      + "\\"`), asserting `URI.parse` throws `InvalidURIError` promptly rather
      than backtracking — the regression the atomic groups exist to prevent.
- [ ] The module comment's possessive-quantifier caveat is deleted.
