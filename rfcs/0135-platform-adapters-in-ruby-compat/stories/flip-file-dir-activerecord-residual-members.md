---
title: "flip-file-dir-activerecord-residual-members"
status: done
updated: 2026-09-04
rfc: "0135-platform-adapters-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 17
pr: 7470
claim: "2026-09-04T00:19:14Z"
assignee: "extra-surface-gate-blocks-new-file-dir-members"
blocked-by: null
closed-reason: null
---

## Context

`flip-file-dir-call-sites-activerecord` flipped `packages/activerecord/src` and
`packages/activerecord-cli/src` off `getFs()` / `getPath()`. Five call sites did
not flip, because ruby-compat's `File` / `Dir` have no member for what they do.
Each is listed with the Ruby member the body actually wants.

1. **`File.open(filename, "a")`** — appending to an already-written file.
   Rails: `activerecord/lib/active_record/tasks/database_tasks.rb:447`
   (`File.open(filename, "a") { |f| f.puts(...) }`).
   Trails: `packages/activerecord/src/tasks/database-tasks.ts:941` and
   `packages/activerecord/src/tasks/postgresql-database-tasks.ts:113`, both on
   `getFs().appendFileSync`. Needs a `File.open`-with-mode member, or the
   narrower `File.write(name, string, { mode: "a" })` arm Ruby's `IO.write`
   already takes (`vendor/ruby/io.c:12377`).

2. **Byte-accurate `File.binread` / `File.binwrite`.**
   `packages/activerecord/src/connection-adapters/schema-cache.ts:110,388`
   read and write gzip bytes through `getFs()` with a `"latin1"` encoding,
   because ruby-compat's `binread` / `binwrite` decode as UTF-8
   (`packages/ruby-compat/src/file.ts`) and would mangle them. Ruby's ASCII-8BIT
   is exactly latin1 — one byte, one code point — so the pair should use it.
   The blocker is that `ActiveSupport::Cache::FileStore` already round-trips
   through `File.binread` against a `Tempfile#write` that encodes UTF-8
   (`packages/activesupport/src/cache/file-store.ts:172`,
   `packages/activesupport/src/tempfile.ts`); both halves have to move together
   or a non-ASCII cache entry breaks. Rails' own calls are
   `schema_cache.rb:246` (`Zlib::GzipReader.open`) and `:466`
   (`Zlib::GzipWriter.new file`), so the converged shape may instead be a
   `Gzip` that takes and answers bytes.

3. **`path.pathToFileURL`** — `packages/activerecord/src/tasks/database-tasks.ts:658`,
   in `loadSchema`. Ruby is `load file` (`database_tasks.rb`), which has no URL
   step at all; the `file://` href exists only because ESM `import()` needs one.
   It is the one member here with no Ruby counterpart to converge to, so it
   needs a decision rather than a member: keep `getPath()` for it, or give the
   `PathAdapter` a seat that `File` does not have to mirror.

## Acceptance criteria

- 1 and 2 land as `File` members with MRI citations, and their four call sites
  flip; the `"latin1"` reads and `appendFileSync` calls are gone.
- 3 is either flipped or written up in RFC 0135 as the sanctioned residue, with
  the reason above.
- No `getFs()` / `getPath()` call remains in `packages/activerecord/src` or
  `packages/activerecord-cli/src` outside tests exercising the backend.
- `pnpm parity:api:calls` and `pnpm parity:api:calls:args` show no new rows.
