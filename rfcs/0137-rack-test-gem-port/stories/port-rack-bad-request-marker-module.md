---
title: "port-rack-bad-request-marker-module"
status: ready
updated: 2026-09-06
rfc: "0137-rack-test-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 32
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rack::BadRequest` (`vendor/rack/lib/rack/bad_request.rb:6`) is an empty
marker module that Rack mixes into every error class meaning "the client
sent something malformed", so a handler can rescue the whole family with
one `rescue Rack::BadRequest`. trails has no port of it at all — `git grep
BadRequest packages/rack/src` finds only `Response#bad_request?` and
`Directory#check_bad_request`, neither related.

The error classes that `include BadRequest` upstream and are already ported
without it:

- `Multipart::MissingInputError` (`multipart.rb:19-21`) →
  `packages/rack/src/multipart.ts`
- `Multipart::Parser::EmptyContentError`, `BoundaryTooLongError`,
  `MultipartPartLimitError`, `MultipartTotalPartLimitError`
  (`multipart/parser.rb:15-31`) → `packages/rack/src/multipart/parser.ts`
- `QueryParser::ParamsTooDeepError`, `InvalidParameterError`
  (`query_parser.rb:11-19`) → `packages/rack/src/query-parser.ts`
- `Utils::InvalidParameterError` / `ParameterTypeError` aliases
  (`utils.rb`) → `packages/rack/src/utils.ts`

Surfaced while porting `parse_multipart` onto the ported `Parser` (#7572),
which rewrote `MissingInputError`'s message but left the missing `include`
alone as out of scope.

## Acceptance criteria

- [ ] `packages/rack/src/bad-request.ts` ports `Rack::BadRequest`
      (`bad_request.rb:6`) as a marker, using the settled trails idiom for a
      Ruby module mixed into a class (`include()` / `Included<>` from
      `@blazetrails/activesupport`, or the brand shape the repo already uses
      for a bodyless marker module — pick whichever makes
      `err instanceof BadRequest`-shaped dispatch work, and cite it).
- [ ] Every error class listed in Context carries it, at the same
      `include BadRequest` site Rack has.
- [ ] A test asserts the family can be caught as one, mirroring whatever
      `vendor/rack/test/` asserts about `BadRequest` (grep first; if Rack
      has no direct test, cover it in the `.trails.test.ts`).
- [ ] `pnpm parity:api:extra:gate` and `parity:api:calls` non-negative.
