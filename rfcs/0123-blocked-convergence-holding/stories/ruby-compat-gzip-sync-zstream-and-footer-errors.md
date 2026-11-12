---
title: "ruby-compat-gzip-sync-zstream-and-footer-errors"
status: draft
updated: 2026-11-12
rfc: "0123-blocked-convergence-holding"
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

ruby-compat's `Zlib::GzipWriter` / `GzipReader` (`packages/ruby-compat/lib/zlib.ts`,
`lib/zlib-adapter.ts`) run over Node's asynchronous gzip stream and a one-shot
`gunzipSync`, which leaves three gaps against MRI (surfaced in trails#10042 review):

- `gzfile_write` (`vendor/ruby/v3.3.11/ext/zlib/zlib.c:2808-2820`) runs the deflate
  and `gzfile_write_raw` in the same call, so under `sync = true` the IO holds the
  bytes when `write` returns. The port queues the flush and the bytes reach the IO
  only on an awaited `flush` / `close`.
- `gzfile_read` (`zlib.c:2894`) pulls from the IO incrementally (`gzfile_fill`,
  `gzfile_read_more`, `zlib.c:2823`); the adapter drains the IO on the first `read`.
- The footer checks in `gzfile_check_footer` (`zlib.c:2795-2805`) raise
  `Zlib::GzipFile::NoFooter` / `CRCError` / `LengthError`; the port surfaces Node's
  own zlib error instead, and those classes are unported.

## Acceptance criteria

- A synchronous streaming deflate/inflate (e.g. a sync zstream over Node's zlib
  binding or a JS inflater) backs the gzip handles, so `write` under sync mode and
  `read(len)` match MRI.
- `NoFooter`, `CRCError`, `LengthError` are ported and raised at MRI's sites.
- The `@missingRailsCall gzfile_write_raw` receipt on `GzipWriter#write` is removed.
