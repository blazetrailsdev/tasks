---
title: "Port UriEncoder as Rails' class, with ENCODER and the composed pattern constants"
status: in-progress
updated: 2026-09-09
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: 60
pr: 7641
claim: "2026-09-09T13:02:34Z"
assignee: "journey-uri-encoder-class-shape"
blocked-by: null
closed-reason: null
---

## Context

Rails' URI escaping lives on a class:
`ActionDispatch::Journey::Router::Utils::UriEncoder`
(`actionpack/lib/action_dispatch/journey/router/utils.rb:33-80`) holds the
constants (`ENCODE`, `US_ASCII`, `UTF_8`, `EMPTY`, `DEC2HEX`, `ALPHA`, `DIGIT`,
`UNRESERVED`, `SUB_DELIMS`, `ESCAPED`, `FRAGMENT`, `SEGMENT`, `PATH`), three
public methods (`escape_fragment`, `escape_path`, `escape_segment`) plus
`unescape_uri`, and two private ones (`escape`, `percent_encode`). One instance
is memoized as `ENCODER = UriEncoder.new` (`utils.rb:80`), and the class methods
`Utils.escape_path` / `.escape_segment` / `.escape_fragment` / `.unescape_uri`
delegate to it with a `.to_s` on the argument (`:82-96`).

trails
(`packages/actionpack/src/action-dispatch/journey/router/utils.ts`) has no
`UriEncoder` at all. The methods are module-level functions — `escapePath`,
`escapeSegment`, `escapeFragment`, `unescapeUri`, plus the file-local `escape`
and `percentEncode` — and the pattern constants are inlined regexes
(`UNSAFE_PATH`, `UNSAFE_SEGMENT`, `UNSAFE_FRAGMENT`) rather than Rails'
`PATH` / `SEGMENT` / `FRAGMENT` composed from `UNRESERVED` and `SUB_DELIMS`.
There is no `ENCODER` singleton and no `Utils` class, so the two-level
delegation Rails has (class method -> instance method) is flattened to one.

`parity:api` scores the file 7/7 because it matches member names file-wide, so
this shape difference is invisible to every current gate. #7601 renamed
`escapeWith`/`pctEncode` to Rails' `escape`/`percent_encode` and introduced the
`DEC2HEX` table, but deliberately left the class structure alone as out of
scope.

The file also carries `rackEscape`, one of the two `journey/` novel names
`pnpm parity:api:extra --package actiondispatch` still reports; it has no Rails
counterpart in `utils.rb` and should be traced to whatever Rack method it stands
in for, or moved.

## Acceptance criteria

- `UriEncoder` exists as a class in `journey/router/utils.ts`, carrying the
  constants and the five methods Rails puts on it, with `escape` and
  `percent_encode` private as in Rails (`utils.rb:69-78`).
- The pattern constants are Rails' `FRAGMENT` / `SEGMENT` / `PATH`, composed
  from `UNRESERVED` and `SUB_DELIMS` (`utils.rb:42-49`), not three
  hand-inlined `UNSAFE_*` regexes.
- A single `ENCODER` instance is created as Rails creates it (`utils.rb:80`),
  and the exported `escapePath` / `escapeSegment` / `escapeFragment` /
  `unescapeUri` delegate to it, mirroring `utils.rb:82-96`.
- `rackEscape` is traced to its Rails/Rack counterpart and either renamed to it,
  relocated to the file that owns it, or given a
  `@noRailsEquivalent PERMANENT|CONVERGEABLE <story-id>` receipt.
- `pnpm parity:api --package actiondispatch` keeps `journey/router/utils.rb` at
  100% with 0 arity and 0 param-name mismatches, and
  `pnpm parity:api:extra --package actiondispatch` no longer lists
  `journey/router/utils.ts`.
- `pnpm parity:api:calls`, `:calls:args` and `:extra:gate` stay green;
  `pnpm vitest run packages/actionpack/src/action-dispatch/journey` passes.
