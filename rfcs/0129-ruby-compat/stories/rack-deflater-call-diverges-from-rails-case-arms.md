---
title: "rack-deflater-call-diverges-from-rails-case-arms"
status: ready
updated: 2026-09-05
rfc: "0129-ruby-compat"
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

`Rack::Deflater#call` (`vendor/rack/lib/rack/deflater.rb:46-79`) is a `case
encoding` over the result of `Utils.select_best_encoding(%w(gzip identity),
request.accept_encoding)`, and its gzip arm hands the response a LAZY body:

```ruby
response[2] = GzipStream.new(body, mtime, @sync)
```

`packages/rack/src/deflater.ts`'s `call` diverges from that on five points, all
predating the zlib-seam flip (trails#7506, which ported `GzipStream` itself
alongside `deflater.rb:88-125`):

1. It hand-rolls `preferredEncoding` instead of calling
   `Utils.select_best_encoding` — the standing baseline row in
   `scripts/api-compare/call-mismatches-exclude/rack/deflater.json`. Rails also
   offers only `gzip` and `identity`; trails answers `"deflate"`, an encoding
   `Rack::Deflater` explicitly does not support (`deflater.rb:25-26`).
2. It has no `Request` — Rails reads `request.accept_encoding`, not
   `env["HTTP_ACCEPT_ENCODING"]`.
3. It never computes `mtime` from the `last-modified` header
   (`deflater.rb:66-67` `Time.httpdate(mtime).to_i`); trails#7506's
   `GzipStream` is constructed with `null` for it.
4. It drops the `else` (nil-encoding) arm entirely — Rails answers `406` with a
   `Rack::BodyProxy` message body (`deflater.rb:73-77`); trails returns the
   uncompressed response.
5. It materializes the compressed bytes in a private `compress` helper and sets
   `CONTENT_LENGTH`, where Rails deletes `CONTENT_LENGTH` and streams. `compress`
   has no Rails counterpart at all.

## Acceptance criteria

- [ ] `Deflater#call` mirrors `deflater.rb:46-79`: `Request.new(env)`,
      `Utils.selectBestEncoding(["gzip", "identity"], request.acceptEncoding)`,
      the vary join, and the three-arm `case`, including the 406 arm.
- [ ] The gzip arm sets `response[2]` to a `GzipStream` rather than a
      materialized string, and computes `mtime` from `last-modified`.
- [ ] The private `compress` helper is gone.
- [ ] The `select_best_encoding` row is deleted from
      `scripts/api-compare/call-mismatches-exclude/rack/deflater.json` and the
      mark tightened; `pnpm parity:api:calls` green.
- [ ] `packages/rack/src/deflater.test.ts` is re-pointed at Rails' own
      `deflater_test.rb` expectations — several of its cases today assert
      `content-encoding: deflate`, which Rails never emits.
