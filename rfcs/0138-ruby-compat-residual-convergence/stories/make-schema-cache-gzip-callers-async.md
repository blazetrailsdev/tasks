---
title: "Make the SchemaCache gzip callers async so the Zlib seam can stream"
status: done
updated: 2026-09-07
rfc: "0138-ruby-compat-residual-convergence"
cluster: null
packages: ["activerecord", "ruby-compat"]
deps: []
deps-rfc: []
est-loc: 260
priority: 48
pr: 7586
claim: "2026-09-07T00:55:49Z"
assignee: "zlib-seam-is-one-shot-so-gzipwriter-buffers-the-payload"
blocked-by: null
closed-reason: null
---

## Context

Filed while blocking `zlib-seam-is-one-shot-so-gzipwriter-buffers-the-payload`,
which cannot converge until this lands.

That story asks `ZlibAdapter` to grow a streaming deflate/inflate pair so
`Zlib::GzipWriter#write` stops accumulating the whole payload in a private
`buffer` field (`packages/ruby-compat/src/zlib.ts`) and `Zlib::GzipReader#read`
stops gunzipping the whole file in one call. It specified a **synchronous**
push/pull handle, because the callers are synchronous. That shape is not
buildable — no JS runtime exposes a synchronous incremental zlib API, verified
on Node 20.19.6:

- `zlib.deflateSync` / `inflateSync` are stateless one-shots. Chaining them with
  `Z_SYNC_FLUSH` produces independent deflate streams rather than a
  continuation, so the concatenation is not a valid stream.
- The one incremental sync entry point, `stream._processChunk(chunk,
Z_SYNC_FLUSH)`, ends `processChunkSync` (node `lib/zlib.js`) with an
  unconditional `_close(self)`; the second sync chunk throws
  `Cannot read properties of null (reading 'writeSync')`.
- `createGzip` / `createGunzip` are asynchronous, and so is the browser
  `CompressionStream` — so no backend, node or web, can satisfy a sync contract.

The two sync workarounds do not converge anything: buffering inside the adapter
handle relocates the same retention behind the seam, and per-chunk multi-member
gzip (`gzipSync` per write, concatenated — valid, and genuinely non-buffering on
the write side) emits a multi-member file where Ruby's `rb_gzwriter_write` /
`rb_gzfile_close` (`vendor/ruby/ext/zlib/zlib.c:3745,3524`) emit ONE member with
one header. That is a fidelity regression at a surface whose byte-identity
`SchemaCache` depends on — `zipper.mtime = 0`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/schema_cache.rb:468`)
exists precisely so two dumps of the same cache compare equal.

So the streaming seam is only reachable through an asynchronous handle, and that
is blocked by its callers, all of which are synchronous today:

- `SchemaCache.read` (`packages/activerecord/src/connection-adapters/schema-cache.ts:107`),
  mirroring `schema_cache.rb:246`'s `Zlib::GzipReader.open(filename) { |gz| ... }`,
  and its caller `SchemaCache._loadFrom` (`schema-cache.ts:94`, `schema_cache.rb:238`).
- `SchemaCache#open` (`schema-cache.ts:467`, `schema_cache.rb:461`), which
  constructs `new Zlib.GzipWriter(file)` and calls `flush` / `close`
  synchronously inside `atomicWrite`, and its caller `SchemaCache#dumpTo`
  (`schema_cache.rb:406`).

Rails' own bodies are synchronous, so this is a JS-runtime deviation of exactly
the kind `CLAUDE.md` sanctions the `setX()` / `Promise<void> | void` idioms for —
but it has to be taken deliberately at the caller layer, not smuggled in under
the seam.

The `ZlibAdapter` seam already carries an **async** streaming handle for the
other caller: `gzipWriter(io)` returning a `GzipWriterHandle` whose `finish()`
is awaited (`packages/ruby-compat/src/zlib-adapter.ts`), which
`Rack::Deflater::GzipStream` uses (`packages/rack/src/deflater.ts:133`). That is
the precedent this story generalises — it is the existing proof the async shape
works and that only the `SchemaCache` callers stand in the way.

## Acceptance criteria

- [ ] `SchemaCache.read`, `SchemaCache._loadFrom`, `SchemaCache#open` and
      `SchemaCache#dumpTo` are async (or `Promise<T> | T`-returning) far enough
      that a `GzipReader` / `GzipWriter` backed by an asynchronous streaming
      handle can be awaited at the `.gz` arms of `read` and `open`. The non-`.gz`
      arms keep their current shape.
- [ ] Every call site is updated and awaited — including
      `schema-cache.ts:603,643,649,763`,
      `packages/activerecord/src/tasks/database-tasks.ts:491,522` (whose
      `dumpTo` cast to `Promise<void> | void` can then be a real type rather
      than a cast) and
      `packages/activerecord/src/support/schema-cache-dump.ts:39,136`.
- [ ] Method, parameter and local NAMES stay Rails' — this changes return types
      only, per the repo's settled async-setter/async-return idiom. No renames,
      no new helper, no wrapper layer.
- [ ] `schema-cache.test.ts` and `zlib.trails.test.ts` keep their names and pass;
      the schema-cache dump stays byte-identical across two dumps (the
      `mtime = 0` invariant, `schema_cache.rb:468`).
- [ ] `zlib-seam-is-one-shot-so-gzipwriter-buffers-the-payload` is unblocked —
      note in the PR body that it becomes buildable, but do NOT do its work here.
