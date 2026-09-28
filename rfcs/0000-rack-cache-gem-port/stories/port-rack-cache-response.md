---
title: "Port Rack::Cache::Response"
status: draft
updated: 2026-09-28
rfc: "0000-rack-cache-gem-port"
cluster: null
packages: ["rack-cache"]
deps: ["port-rack-cache-cache-control-request-and-headers"]
deps-rfc: []
est-loc: 420
priority: 30
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rack-cache/v1.17.0/lib/rack/cache/response.rb` (268 lines). `Response`
(`:21`) is not a `Rack::Response` subclass. It `include`s
`Rack::Response::Helpers` (`:22`), which trails has as the abstract `Helpers`
at `packages/rack/src/response.ts:20`. Use `include()` as that file does
(`response.ts:429`), not a hand-copied method list.

Surface:

- `attr_accessor :status, :headers, :body` (`:25`), `attr_reader :now` (`:28`).
- `initialize` (`:32-38`): `@status = status.to_i`,
  `@headers = Rack::Cache::Headers(headers)`, `@now = Time.now`, and
  `@headers['date'] ||= @now.httpdate`. `initialize_copy` (`:40-44`) re-dups
  headers and clears `@cache_control`, and `Context` depends on that through
  `clone`. `to_a` (`:47-49`).
- `CACHEABLE_RESPONSE_CODES` (`:55-63`), `NOT_MODIFIED_OMIT_HEADERS` (`:227-235`).
- Freshness: `cache_control` / `cache_control=` (`:69-90`), `fresh?` (`:93`),
  `cacheable?` (`:103`), `validateable?` (`:111`), `private=` (`:117`),
  `must_revalidate?` (`:127`), `expire!` (`:133`), `date` (`:139`), `age` (`:152`),
  `max_age` (`:161`), `expires` (`:169`), `max_age=` / `shared_max_age=` /
  `reverse_max_age=` (`:177-193`), `ttl` / `ttl=` / `client_ttl=` (`:197-213`),
  `last_modified` (`:215`), `etag` (`:220`), `not_modified!` (`:242`), `vary` /
  `vary?` / `vary_header_names` (`:251-267`).

Several writers are Ruby `x=` methods. A writer that is a plain field assignment
can be a TS setter. One that must stay a method keeps the Rails name as
`setX()` (CLAUDE.md "Fidelity is the job"). `private=` collides with a TS
keyword only as a bare identifier. `docs/ruby-ts-conventions.md` gives its
spelling.

`date`, `expires` and `last_modified` parse HTTP dates (`Time.httpdate`).
`now` is a wall-clock `Time`. Use the trails `Time` / `httpdate` ports that
`packages/rack/src/conditional-get.ts` already uses, not `Date.parse`. The
suite stubs the clock, so check how `test/response_test.rb` freezes `now` before
choosing the seam.

Tests: `test/response_test.rb` (215 lines, 37 cases) →
`packages/rack-cache/src/response.test.ts`.

## Acceptance criteria

- [ ] `src/response.ts` ports `Response` with `include(Response, Helpers)`, and
      every member above is at its Ruby name.
- [ ] `response.test.ts` ports all 37 cases with Rails-identical names.
- [ ] `pnpm parity:api` reports `response.rb` complete, and the call and
      call-args gates add no row.
