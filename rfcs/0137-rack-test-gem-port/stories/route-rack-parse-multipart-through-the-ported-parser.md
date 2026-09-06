---
title: "Route Rack::Multipart.parse_multipart through the ported Parser instead of a second inline scanner"
status: draft
updated: 2026-09-06
rfc: "0137-rack-test-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rack::Multipart.parse_multipart` (`vendor/rack/lib/rack/multipart.rb:53-71`)
builds a `Parser` and drives it:

```ruby
def parse_multipart(env, params = Rack::Utils.default_query_parser)
  io = env[RACK_INPUT]
  ...
  tempfile = env[RACK_MULTIPART_TEMPFILE_FACTORY] || Parser::TEMPFILE_FACTORY
  bufsize = env[RACK_MULTIPART_BUFFER_SIZE] || Parser::BUFSIZE
  parser = Parser.parse(io, content_length, content_type, tempfile, bufsize, params)
  ...
end
```

so every multipart body goes through the `Parser` / `Collector` / `MimePart`
state machine at `parser.rb:200-470`, which reads the input in `BUFSIZE` chunks
and advances `@state` through `FAST_FORWARD` / `CONSUME_TOKEN` / `MIME_HEAD` /
`MIME_BODY`.

trails ports that machine — `packages/rack/src/multipart/parser.ts` has
`Parser`, `Collector`, `MimePart`, `BufferPart`, `TempfilePart`, `BoundedIO`
and the `State` union — but `packages/rack/src/multipart.ts`'s `parseBody`
never calls it. It reads the whole body into one `Buffer` and re-implements
boundary scanning, header parsing, file-vs-text dispatch and the part limits
inline (`multipart.ts:110-310`), so the ported `Parser` is reachable only from
its own test. The two implementations have already drifted: the part limits,
the `content-type` charset handling and the tempfile handling each exist twice,
and #7541 had to converge the tempfile half in `multipart.ts` rather than in
the `Parser` that owns it.

Related: `rack-multipart-parser-tempfile-factory-constant` (0023, draft) covers
the `TEMPFILE_FACTORY` constant and the nullable `tmpfile` arm — its first
acceptance criterion landed in #7541. This story is the larger structural half
its Context names but does not gate: routing `parse_multipart` through `Parser`
at all.

## Converged shape

`parseMultipart` resolves the tempfile factory and bufsize the way
`multipart.rb:59-60` does, calls `Parser.parse(...)`, and returns
`parser.result`. `parseBody`'s inline scanner is deleted; anything it does that
the `Parser` does not is a gap in the `Parser` port and is fixed there.

## Acceptance criteria

- [ ] `Rack::Multipart.parseMultipart` drives `Parser.parse`, mirroring
      `multipart.rb:53-71`.
- [ ] `packages/rack/src/multipart.ts` no longer carries its own boundary
      scanner, header parser or part-limit accounting.
- [ ] `packages/rack/src/multipart.test.ts`, `multipart/parser.test.ts`,
      `request.test.ts`, `mock-request.test.ts` and
      `packages/rack-test/src/multipart.test.ts` stay green, as do the
      actionpack multipart lanes.
- [ ] `pnpm parity:api:calls` / `:calls:args` non-negative.
