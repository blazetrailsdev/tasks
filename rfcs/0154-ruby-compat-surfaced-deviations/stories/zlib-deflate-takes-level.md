---
title: "Zlib::Deflate.deflate takes MRI's level argument"
status: draft
updated: 2026-10-19
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Zlib.Deflate.deflate` in `packages/ruby-compat/src/zlib.ts` (added in trails#9092 for `Rack::Session::Cookie::Base64::ZipJSON`) takes only `src`. MRI's `rb_deflate_s_deflate(argc, argv)` (`vendor/ruby/v3.3.11/ext/zlib/zlib.c:1730`) takes `(src, level = Z_DEFAULT_COMPRESSION)`. `ZlibAdapter#deflate` (`zlib-adapter.ts`) has no level slot either.

## Acceptance criteria

- [ ] `ZlibAdapter.deflate(data, level)` forwards `level` to node's `deflateSync`.
- [ ] `Zlib.Deflate.deflate(src, level = Zlib.DEFAULT_COMPRESSION)` matches zlib.c:1730.
- [ ] `Zlib.deflate` / `Zlib.inflate` module functions (zlib.c:4715,4727) are seated as aliases if a caller needs them.
