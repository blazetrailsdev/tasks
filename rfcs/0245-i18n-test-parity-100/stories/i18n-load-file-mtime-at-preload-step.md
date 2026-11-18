---
title: "i18n-load-file-mtime-at-preload-step"
status: claimed
updated: 2026-11-18
rfc: "0245-i18n-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-18T19:51:36Z"
assignee: "i18n-load-file-mtime-at-preload-step"
blocked-by: null
closed-reason: null
---

## Context

`I18n::Backend::CacheFile#load_file` (`vendor/i18n/v1.14.8/lib/i18n/backend/cache_file.rb:17-25`)
reads `File.mtime(filename).to_i` and `OpenSSL::Digest::SHA256.file(filename).hexdigest`
before deciding to call `super`. In trails `Base#loadFile`
(`packages/i18n/lib/backend/base.ts:502`) is synchronous: it reads contents that
`preloadTranslationFiles` (`base.ts:67`) fetched in the awaited load step. ruby-compat
offers only `File.mtimeAsync` (`packages/ruby-compat/lib/file.ts:960`; the sync
`File.mtime` is `statSync`, ruled out by the async-fs rule) and an async
`Digest#file` (`packages/ruby-compat/lib/digest.ts:54`). The digest can be taken
synchronously over the preloaded contents; the mtime has no synchronous source.

## Acceptance criteria

- [ ] Decide, with the operator, how the awaited load step makes a file's mtime
      available to a synchronous `loadFile` (e.g. `preloadTranslationFiles` also
      records `File.mtimeAsync`), with the call-site receipt it needs.
- [ ] Unblocks `i18n-port-backend-cache-file`.
