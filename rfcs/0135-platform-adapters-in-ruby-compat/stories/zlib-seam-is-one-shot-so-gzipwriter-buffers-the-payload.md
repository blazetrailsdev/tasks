---
title: "The ZlibAdapter seam is one-shot, so GzipWriter buffers the whole payload instead of streaming"
status: draft
updated: 2026-09-05
rfc: "0135-platform-adapters-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while landing PR #7505
(`port-zlib-gzipreader-open-for-schema-cache-read`), which added
`Zlib::GzipReader` / `Zlib::GzipWriter` to `packages/ruby-compat/src/zlib.ts`.

Ruby's `Zlib::GzipWriter` is a streaming deflate: `rb_gzwriter_write`
(`vendor/ruby/ext/zlib/zlib.c:3745`) feeds each String into the zstream as it
arrives, and `rb_gzfile_close` (`zlib.c:3524`) finishes it. `GzipReader#read`
(`zlib.c:3968`) inflates incrementally off the associated IO.

The trails `ZlibAdapter` seam (`packages/ruby-compat/src/zlib-adapter.ts`) is
one-shot — `gzip` / `gunzip` / `deflate` / `inflate` each take a whole
`Uint8Array` and answer a whole one. So the port deviates:

- `GzipWriter#write` appends to a private `buffer` string and `close` gzips the
  whole accumulation in one call.
- `GzipReader#read` reads the entire file and gunzips it in one call.

Both are cited at the class in `zlib.ts`, and both hold the whole payload in
memory. That is invisible for a schema cache and wrong for anything large —
`Rack::Deflater` is the caller that will notice, and
`flip-rack-deflater-onto-the-zlib-seam` is already queued to route it here.

## Converged shape

`ZlibAdapter` grows a streaming pair alongside the one-shot four — a deflate
and an inflate handle with `write` / `read` / `finish`, which `node:zlib`'s
`createGzip` / `createGunzip` back and which a browser backend can implement
over `CompressionStream`. `GzipWriter#write` then feeds the handle per call and
`close` finishes it, and `GzipReader#read` pulls from the inflate handle, so
neither holds the payload.

Note the seam's callers are synchronous (`SchemaCache.read` /
`#dumpTo` are sync and Rails' are too), so the streaming handle has to be a
sync push/pull pair rather than a Node stream — `zlib.deflateSync` over chunks
with `Z_SYNC_FLUSH` is the shape that fits, not `pipeline`.

## Acceptance criteria

- [ ] `ZlibAdapter` declares a streaming deflate/inflate handle, with the node
      backend implementing it and `registerZlibAdapter`'s contract updated.
- [ ] `GzipWriter#write` feeds the deflate stream per call rather than
      concatenating into a field; the private `buffer` is gone.
- [ ] `GzipReader#read` pulls through the inflate handle rather than reading the
      whole file first.
- [ ] The deviation note on the `GzipWriter` class in `zlib.ts` is deleted, not
      reworded.
- [ ] `zlib.trails.test.ts` and `schema-cache.test.ts` keep their names and pass.
