---
title: "Tempfile buffers writes in memory where tempfile.rb:89 delegates them to the open File"
status: done
updated: 2026-09-04
rfc: "0135-platform-adapters-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 240
priority: 19
pr: 7473
claim: "2026-09-04T02:19:05Z"
assignee: "tempfile-buffers-writes-instead-of-delegating-to-the-file"
blocked-by: null
closed-reason: null
---

## Context

Ruby's `Tempfile` is `class Tempfile < DelegateClass(File)`
(`vendor/ruby/lib/tempfile.rb:89`), so every `IO` method — `write`, `read`,
`flush`, `rewind` — is delegated straight to the open `File` it wraps. A write
reaches the descriptor when it is made.

trails' `Tempfile` (`packages/activesupport/src/tempfile.ts`) instead keeps a
`Buffer` field and writes the whole thing out on `close`:

```ts
write(contents: string | Buffer | Uint8Array): number {
  this.buffer = Buffer.concat([this.buffer, chunk]);
  this.flushed = false;
  return chunk.length;
}

private flush(): void {
  if (this.flushed) return;
  File.open(this.tmpname, "wb", (f) => f.write(this.buffer.toString("latin1")));
  this.flushed = true;
}
```

So the file on disk is empty until `close`, and `read()` has to `flush()` first
to answer anything. Anything that looks at the path between the write and the
close — another process, a `File.size?`, an adapter handed the path rather than
the object — sees a file Ruby would have already filled. `Tempfile#size`
(`tempfile.rb:214-222`) is exactly such a reader in Ruby: it flushes and stats
the real file.

The buffer was the only shape available while the descriptor was write-only
through `getFs()`. #7451 removed that constraint: `IO#write`
(`vendor/ruby/io.c:2263` `io_write_m`) and the no-length `IO#read`
(`io.c:3774` -> `read_all`, `io.c:3317`) now move bytes through the fd, and
`FsAdapter` carries `writeSync` beside the `readSync` they call. Nothing
structural stands in the way any more.

## Converged shape

`Tempfile` holds the open `File` its `File.open(tmpname, "wx")` already
returns, rather than closing it and keeping a `Buffer`. `write` is
`IO#write` on that handle (`tempfile.rb:89`'s delegation), `read` is
`IO#read`, and `close` (`tempfile.rb:208-211`) closes the descriptor instead of
being the thing that finally writes. The `buffer` / `flushed` fields and the
private `flush` disappear — none has a Ruby counterpart.

Watch `Tempfile.create`'s and `Tempfile.open`'s block forms: both must still
close the handle on the way out, including when the block throws, which is what
`withEnsure` already does.

## Acceptance criteria

- `Tempfile` carries the open `File` handle; `buffer`, `flushed` and the
  private `flush` are gone.
- `write` and `read` are `IO#write` / `IO#read` on that handle, so a reader of
  the path sees bytes before `close` (`vendor/ruby/lib/tempfile.rb:89`).
- The existing `tempfile.trails.test.ts` byte-exactness case still passes, and a
  case covers reading the path before `close`.
- `atomicWrite`, `EncryptedFile` and `PostgreSQLDatabaseTasks` still pass their
  own suites — all three hand a `Tempfile` to code that reads its `path`.
- `pnpm parity:api:extra:gate` green; ruby-compat / activesupport marks never
  raised.
