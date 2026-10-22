---
title: "Zlib::GzipReader.wrap over a StringIO is unported"
status: draft
updated: 2026-10-22
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rack/v3.1.14/test/spec_static.rb:132` reads a gzipped response body with
`Zlib::GzipReader.wrap(StringIO.new(res.body), &:read)`. ruby-compat's `GzipReader`
(`packages/ruby-compat/src/zlib.ts:40-71`) only has `open(filename)` over a `File`, so
`packages/rack/src/static.test.ts` ("serves gzipped files if client accepts gzip encoding and
gzip files are present") calls the adapter directly: `getZlib().gunzip(Uint8Array.from(res.body, …))`.
`deflater.trails.test.ts` does the same. MRI: `rb_gzfile_s_wrap` / `gzfile_wrap`
(`vendor/ruby/v3.3.11/ext/zlib/zlib.c:3178`), `rb_gzreader_initialize` takes any IO answering `read`.

## Acceptance criteria

- [ ] `GzipReader` accepts any IO answering `read` (a `StringIO` included), and `GzipFile.wrap(io, &block)` is ported at its MRI name.
- [ ] `static.test.ts` reads the body with `Zlib.GzipReader.wrap(new StringIO(res.body), (gz) => gz.read())`, as spec_static.rb:132 does; no direct `getZlib().gunzip` in that test.
