---
title: "The ZlibAdapter seam is one-shot, so GzipWriter buffers the whole payload instead of streaming"
status: blocked
updated: 2026-09-06
rfc: "0135-platform-adapters-in-ruby-compat"
cluster: null
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: 220
priority: 48
pr: null
claim: "2026-09-06T22:42:57Z"
assignee: "zlib-seam-is-one-shot-so-gzipwriter-buffers-the-payload"
blocked-by: "No JS runtime offers a SYNCHRONOUS incremental zlib API, so the story's converged shape cannot be built. Verified on Node 20.19.6: (1) zlib.deflateSync/inflateSync are stateless one-shots - chaining them with Z_SYNC_FLUSH produces independent deflate streams, not a continuation, so the shape the story names ('zlib.deflateSync over chunks with Z_SYNC_FLUSH') does not concatenate into a valid stream; (2) the only incremental sync entry point, stream._processChunk(chunk, Z_SYNC_FLUSH), calls _close(self) unconditionally at the end of processChunkSync (node lib/zlib.js), nulling _handle - a second sync chunk throws 'Cannot read properties of null (reading writeSync)'; (3) createGzip/createGunzip and the browser CompressionStream are both asynchronous, so a browser backend cannot implement a sync handle either. The callers are sync and must stay sync (SchemaCache.read schema-cache.ts:107 and SchemaCache#open schema-cache.ts:467, mirroring Rails' sync schema_cache.rb:468), so the seam cannot be both streaming and sync. The two workarounds both relocate or worsen the deviation rather than converging it: buffering inside the adapter handle just moves the same retention behind the seam, and per-chunk multi-member gzip (gzipSync per write, concatenated - valid and genuinely non-buffering on the write side) emits a multi-member file where Ruby's rb_gzwriter_write/rb_gzfile_close (vendor/ruby/ext/zlib/zlib.c:3745,3524) emit ONE member with one header, which is a fidelity regression at a surface whose byte-identity SchemaCache depends on (the mtime=0 zeroing). Unblocking requires first making the GzipReader/GzipWriter callers async (SchemaCache.read / #dumpTo), which is a separate, larger story."
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
