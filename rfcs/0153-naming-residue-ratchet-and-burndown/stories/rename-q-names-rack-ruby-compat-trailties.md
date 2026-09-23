---
title: "Rename the rack / ruby-compat / trailties Q names (NullLogger family, compareByIdentity, lstat!, File.size?, sessionStore)"
status: ready
updated: 2026-09-23
rfc: "0153-naming-residue-ratchet-and-burndown"
cluster: null
packages: ["rack", "ruby-compat", "trailties"]
deps: []
deps-rfc: []
est-loc: 70
priority: 34
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The `Q` predicate spelling is rejected: predicates port as `isX` (or the bare
camel / the quoted literal `"x?"` where a sibling collides), never `xQ`. The
drop-q-predicate-suffix PR removed the `Q` candidate from `rubyMethodToTs`
(`scripts/parity/conventions.ts`).

`has*` is a candidate only for a bare predicate that Rails itself aliases to a
`has_*?` method (trails#7981's `HAS_PREDICATE_ALIASES`: `key?` → `hasKey`,
`value?` → `hasValue`). Everything else takes the `is*` / camel / literal
target in the tables below.

This slice collects the small remainders in rack, ruby-compat and trailties:

| trails                                                                                                         | Ruby                                                                                                                                                 | target                                                                                                                                                                                          |
| -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NullLogger#infoQ/debugQ/warnQ/errorQ/fatalQ` — `packages/rack/src/null-logger.ts:23-37`                       | `info?` / `debug?` / `warn?` / `error?` / `fatal?` — `vendor/rack/lib/rack/null_logger.rb:22-26`; `info` / `debug` / … are siblings in the same file | quoted literal `get "debug?"` etc., matching the settled Logger precedent in `activesupport/src/broadcast-logger.ts:102-110` (conventions offer the literal first when the bare sibling exists) |
| `Headers#compareByIdentityQ` (getter) — `rack/src/headers.ts:393`                                              | Ruby core `Hash#compare_by_identity?`, which `Rack::Headers < Hash` inherits; `compare_by_identity` is defined at `rack/lib/rack/headers.rb:123`     | `isCompareByIdentity`                                                                                                                                                                           |
| `Entry_#lstatQ` — `packages/ruby-compat/src/file-utils.ts:309` (callers `:246-288`)                            | `Entry_#lstat!` — `vendor/ruby/lib/fileutils.rb:2200-2204` (its own JSDoc cites this). This is a **bang**, ported as `Q` by mistake.                 | `lstatBang`                                                                                                                                                                                     |
| `File.sizeQ` — `ruby-compat/src/file.ts:295` (caller `rack/src/files.ts:211`)                                  | `File.size?` — `vendor/ruby/file.c:2047` `rb_file_size_p`; `File.size` is the bare sibling                                                           | `isSize`                                                                                                                                                                                        |
| `Configuration#sessionStoreQ` — `packages/trailties/src/application/configuration.ts:409`; `finisher.ts:31,71` | `session_store?` — `railties/lib/rails/application/configuration.rb:559`; `session_store` is the bare sibling                                        | `isSessionStore`                                                                                                                                                                                |

Tests: `rack/src/headers.test.ts`, `ruby-compat/src/file.trails.test.ts`,
`trailties/src/application.test.ts`, `application/finisher.trails.test.ts`.

## Acceptance criteria

- No `*Q` identifiers remain in `packages/rack/src`, `packages/ruby-compat/src`
  or `packages/trailties/src` (source or tests). Each member is renamed to its
  target above.
- `pnpm parity:api` coverage for rack / trailties does not drop, and
  `pnpm parity:api:extra:gate` stays green for ruby-compat (pinned).
- `pnpm parity:api:calls`, `parity:api:calls:args` are green.
