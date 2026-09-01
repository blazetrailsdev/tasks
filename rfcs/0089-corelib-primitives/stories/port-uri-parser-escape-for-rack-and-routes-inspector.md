---
title: "Port URI::RFC2396_Parser#escape so escape_path and normalize_filter make the call Rails makes"
status: closed
updated: 2026-08-31
rfc: "0089-corelib-primitives"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "0089 superseded by 0129-ruby-compat, which lists URI as deferred; refile there when scheduled"
---

## Context

Two `"call": "escape"` rows survive in the call-mismatch baseline after PR #7169 removed the seven `Regexp.escape` ones. Both are the SAME unported
primitive — Ruby stdlib's URI parser escape, not `Regexp.escape`:

- `Rack::Utils.escape_path` is `URI_PARSER.escape s`
  (`rack/lib/rack/utils.rb:46-48`); baseline row in
  `scripts/api-compare/call-mismatches-exclude/rack/utils.json`.
- `ActionDispatch::Routing::RoutesInspector#normalize_filter` calls
  `URI::RFC2396_PARSER.escape(filter[:grep])`
  (`actionpack/lib/action_dispatch/routing/inspector.rb:104`); baseline row in
  `scripts/api-compare/call-mismatches-exclude/actiondispatch/routing/inspector.json`.

Both rows still carry the generic seeded text ("Baseline (RFC 0047): wide
call-set flag seeded when the wide ratchet landed"), i.e. neither has ever been
reviewed. They are real omissions, not comparator noise: the TS bodies do not
make the call under any name, so — unlike the `Regexp.escape` family — no
comparator alias can or should silence them.

`URI::RFC2396_Parser#escape` percent-encodes everything outside its `UNSAFE`
pattern. It is Ruby STDLIB, which is why this belongs with the other
interpreter/stdlib primitives this RFC collects (cf.
`port-ruby-mutex-for-check-pending`).

## Acceptance criteria

- One shared port of `URI::RFC2396_Parser#escape`, named for the Ruby method it
  ports, with a receipt in the shape RFC 0121 requires. `encodeURI` /
  `encodeURIComponent` are NOT it — their reserved sets differ from
  `RFC2396_Parser::UNSAFE`, so the port must be written against the Ruby
  pattern, and a test should pin at least one input where the three disagree.
- `Rack::Utils.escapePath` and
  `RoutesInspector#normalizeFilter` both call it, so the TS call-set
  contains the call Rails makes.
- Both baseline rows deleted by hand (only-shrink, no reseed);
  `rack/utils.json` keeps its other five rows,
  `actiondispatch/routing/inspector.json` keeps its other one.
- `pnpm parity:api:calls` green with the row count DOWN by two.
