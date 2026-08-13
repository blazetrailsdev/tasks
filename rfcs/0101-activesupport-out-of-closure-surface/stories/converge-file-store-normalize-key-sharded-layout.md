---
title: "converge-file-store-normalize-key-sharded-layout"
status: done
updated: 2026-08-13
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6437
claim: "2026-08-13T13:25:19Z"
assignee: "converge-file-store-normalize-key-sharded-layout"
blocked-by: null
closed-reason: null
---

## Context

`converge-store-serialized-entry-hooks-and-file-store-paths` converged FileStore's
entry hooks and path-helper names (`cachePath`, `filePathKey`, `ensureCachePath`,
`searchDir`) but deliberately left the _layout_ Rails' `normalize_key` produces
unported.

Rails (`activesupport/lib/active_support/cache/file_store.rb:158-187`):

- `normalize_key` URI-encodes the whole key
  (`URI.encode_www_form_component`), falls back to
  `ActiveSupport::Digest.hexdigest(key)` past `FILEPATH_MAX_SIZE` (900), then
  shards the file under two `DIR_FORMATTER = "%03X"` directories derived from
  `Zlib.adler32(fname).divmod(0x1000)`, chunking the filename at
  `FILENAME_MAX_SIZE` (226).
- `file_path_key` inverts it: `path[cache_path.size..].split(File::SEPARATOR, 4).last.delete(File::SEPARATOR)`
  then `URI.decode_www_form_component`.

trails (`packages/activesupport/src/cache/file-store.ts`) instead keeps the key's
own `/` segments as directories, with no URI encoding, no digest fallback and no
adler32 sharding, so `filePathKey` only concatenates the chunked segments. That
divergence carries four rows in
`scripts/api-compare/call-mismatches-exclude/activesupport/cache/file-store.json`
(`normalize_key`/`hexdigest`, `file_path_key`/`delete`, `file_path_key`/`last`,
`file_path_key`/`split` args), each tagged with this story's slug.

Note trails has no `Zlib.adler32` analogue (`packages/activesupport/src/gzip.ts`
covers deflate/inflate only) and no `URI.encode_www_form_component`; both are
needed. Some trails-only tests in
`packages/activesupport/src/cache/stores/file-store.test.ts` (e.g. "delete prunes
empty parent directories") assert the current unsharded layout and will need to
follow Rails.

## Acceptance criteria

- `normalize_key` and `file_path_key` mirror file_store.rb:158-187, including the
  URI encoding, the `FILEPATH_MAX_SIZE` digest fallback, the `DIR_FORMATTER`
  adler32 sharding and `FILENAME_MAX_SIZE` = 226.
- The four deferred rows above are deleted from the call-mismatch baseline.
- `pnpm parity:api` delta non-negative.
