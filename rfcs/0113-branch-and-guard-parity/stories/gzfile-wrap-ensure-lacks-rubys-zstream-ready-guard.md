---
title: "gzfile_wrap's ensure closes unconditionally, where Ruby guards on ZSTREAM_IS_READY"
status: draft
updated: 2026-09-07
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in review of #7586 (`make-schema-cache-gzip-callers-async`), which
turned `GzipFile#close` into `Promise<void> | void` and routed both
`GzipReader.open` and `GzipWriter.open` through a new `gzfileWrap`
(`packages/ruby-compat/src/zlib.ts`), the port of `gzfile_wrap`
(`vendor/ruby/ext/zlib/zlib.c:3178`).

Ruby's `ensure` there is not a bare close. `gzfile_wrap` ends with

    rb_ensure(rb_yield, obj, gzfile_ensure_close, obj)

and `gzfile_ensure_close` (`vendor/ruby/ext/zlib/zlib.c:3165-3175`) closes only
when the stream is still live:

    if (ZSTREAM_IS_READY(&gz->z)) {
        gzfile_close(gz, 1);
    }

trails' `gzfileWrap` calls `gz.close()` unconditionally, so a block that closes
the file itself — which is legal in Ruby and is what `SchemaCache#open` does
with `zipper.close` (`schema_cache.rb:470`) before the wrap's ensure fires —
gets a second close. Today that is invisible: `GzipWriter#close` re-gzips its
buffer and re-writes it, and `File#close` on an already-closed fd is tolerated.
It stops being invisible once the seam streams (the deflate handle is finished
twice) and wherever a double `IO#close` raises.

The deviation predates #7586 (verified with `git log -S`) — the two `open`
bodies each inlined the same unguarded `try`/`finally` before the extraction —
so it is inherited debt, not new.

## Converged shape

Give `GzipFile` the `ZSTREAM_IS_READY` half: a closed-state flag set by
`close`, checked by `gzfileWrap`'s ensure the way `gzfile_ensure_close` checks
it, so an explicit close inside the block is not repeated on the way out. Keep
the guard in the ensure, not in `close` — Ruby's `rb_gzfile_close`
(`zlib.c:3524`) is unconditional and an explicit double `close` still raises
there.

## Acceptance criteria

- [ ] `gzfileWrap` closes only a stream that has not been closed already,
      mirroring `gzfile_ensure_close`'s `ZSTREAM_IS_READY` guard
      (`vendor/ruby/ext/zlib/zlib.c:3171`).
- [ ] `Zlib::GzipWriter#close` still writes exactly one gzip payload when the
      block closes it explicitly, as `SchemaCache#open` does.
- [ ] A trails-only test covers the block-closes-it-itself path; it fails on
      baseline (today the payload is written twice).
- [ ] No test name changes; `zlib.trails.test.ts` keeps its names and passes.
