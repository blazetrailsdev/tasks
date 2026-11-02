---
title: "Port Kernel#require's foreign-file arm in zeitwerk"
status: draft
updated: 2026-11-02
rfc: "0213-zeitwerk-build-time-autoloader"
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

`packages/zeitwerk/src/core-ext/kernel.ts` `require` drops the `else` arm of `vendor/zeitwerk/v2.7.2/lib/zeitwerk/core_ext/kernel.rb:32-40` and returns `false` early. `rbFRequireFile` (`packages/ruby-compat/src/load.ts`) loads under a query URL and hands back no exports, so `on_file_autoloaded` has nothing to seat. No receipt is accepted: `parity:api:calls` calls `@missingRailsCall` stale and `parity:api:arms:throws` rejects `@inventedArm` (declaration not compared). The only record was the PR body of trails#9591.

## Acceptance criteria

- `require`'s foreign-file arm is ported, with the `$LOADED_FEATURES.last` re-check, over a load that yields the file's exports.
- `core_ext/kernel.rb` is compared by the call and arm gates, or carries the `SCOPED_SKIP_GROUPS` row RFC 0213 names.
