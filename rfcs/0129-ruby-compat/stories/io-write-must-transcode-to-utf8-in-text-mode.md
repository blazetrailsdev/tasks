---
title: "io-write-must-transcode-to-utf8-in-text-mode"
status: in-progress
updated: 2026-09-04
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 9
pr: 7501
claim: "2026-09-04T23:26:00Z"
assignee: "io-write-must-transcode-to-utf8-in-text-mode"
blocked-by: null
closed-reason: null
---

## Context

`IO#write` (`packages/ruby-compat/src/io.ts:216-225`) is unconditionally
byte-oriented: it builds `new Uint8Array(string.length)` and fills it with
`string.charCodeAt(i) & 0xff`. `IO#readAll` (`io.ts:197-206`) is its mirror,
accumulating `String.fromCharCode(byte)`. That is exactly right for a stream
opened in binary mode, and `IO#write`'s own JSDoc says so — "`string` is a
binary String — one character per byte".

Ruby splits the two. `rb_io_write` (`vendor/ruby/io.c:2263`) writes through
`do_writeconv`, which transcodes to the stream's **external encoding**; a
stream opened `"w"` / `"a"` carries `Encoding.default_external` (UTF-8), and
only `"wb"` / `"rb"` give ASCII-8BIT. So Ruby's `File.open(f, "a") { |io|
io.write("héllo") }` puts two UTF-8 bytes on disk where trails puts one, and
`File.open(f, "r", &:read)` decodes them back where trails does not.

`File.open` (`file.ts:153`) already strips the `b` from the mode before handing
it to `FsAdapter.openSync`, so the binary flag is dropped on the floor rather
than reaching the `IO` it constructs — the one place that could tell the two
apart.

Every text-mode `File.open` write site in the repo is affected, and each one
is Rails-faithful in its call shape — the gap is under them, in `IO`:

- `trailties/src/generators/base.ts:84` — `File.open(fullPath, "a", (file) => file.write(content))`, appending generated source.
- `activerecord/src/tasks/database-tasks.ts:627` — `dump_schema`'s `File.open(filename, "w")` (`database_tasks.rb:441`, where Rails spells the mode `"w:utf-8"` explicitly).
- `activerecord/src/tasks/database-tasks.ts:941` — the `schema_migrations` INSERT tail.
- `activerecord/src/tasks/postgresql-database-tasks.ts:109` — `SET search_path TO #{connection.schema_search_path}` (`postgresql_database_tasks.rb:77`).

The binary sites (`"rb"` / `"wb"`) are correct as they stand and must keep
their current behaviour — `schema-cache.ts:109,387` round-trips gzip bytes
through them, and `send-file.ts`, `upload.ts`, `rack/files.ts` and
`tempfile.ts` all depend on one character per byte.

## Acceptance criteria

- `File.open` records whether the mode carried `b` and passes it to the `IO` it
  constructs, instead of discarding it.
- `IO#write` transcodes to UTF-8 in text mode and keeps the current
  `charCodeAt & 0xff` path in binary mode; `IO#readAll` is the mirror.
- `IO#read(length)` is UNCHANGED — Ruby's length form answers ASCII-8BIT
  regardless of the stream's external encoding (`io.c:3774`).
- A test writes and reads back a non-ASCII string through `File.open(f, "a")` /
  `File.open(f, "r")` and gets it intact, and the existing binary round-trip
  tests still pass unchanged.
- `File.write` / `File.read` (already UTF-8 via the adapter) and
  `File.binwrite` / `File.binread` are untouched by this story.
