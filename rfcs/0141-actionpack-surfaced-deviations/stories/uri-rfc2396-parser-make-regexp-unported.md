---
title: "uri-rfc2396-parser-make-regexp-unported"
status: done
updated: 2026-11-14
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10102
claim: "2026-11-14T20:29:53Z"
assignee: "authentication-generator-e2e-request-cycle"
blocked-by: null
closed-reason: null
---

## Context

`Rack::Lint::REQUEST_PATH_ABSOLUTE_FORM` is
`/\A#{Utils::URI_PARSER.make_regexp}\z/` (`vendor/rack/v3.1.14/lib/rack/lint.rb:15`),
and `URI::RFC2396_Parser#make_regexp` (`vendor/ruby/v3.3.11/lib/uri/rfc2396_parser.rb`)
is not ported in `packages/ruby-compat/src/uri/rfc2396-parser.ts`. trails'
`packages/rack/src/lint.ts` spells the constant as a hand-written scheme regex
under `@missingRailsCall make_regexp — CONVERGEABLE uri-rfc2396-parser-make-regexp-unported`.

## Acceptance criteria

- [ ] `RFC2396Parser#makeRegexp` is ported (no-schemes arm at least).
- [ ] `Lint.REQUEST_PATH_ABSOLUTE_FORM` is built from `URI_PARSER.makeRegexp()` and the receipt is removed.
