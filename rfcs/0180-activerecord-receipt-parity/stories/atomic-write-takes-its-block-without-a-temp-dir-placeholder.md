---
title: "activesupport: File.atomic_write takes its block without a temp_dir placeholder"
status: draft
updated: 2026-10-02
rfc: "0180-activerecord-receipt-parity"
cluster: findings
packages: ["activesupport", "activerecord"]
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-ca-root` audit: the receipt below was `PERMANENT`, no CLAUDE.md section ratifies it, and it is re-tagged `CONVERGEABLE` onto this story.

`SchemaCache#open` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/schema_cache.rb:461-475`) calls `File.atomic_write(filename) do |file| … end` (`:464`), and `File.atomic_write` is `def self.atomic_write(file_name, temp_dir = dirname(file_name))` (`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/file/atomic.rb:21`).

`packages/activesupport/src/core-ext/file/atomic.ts` declares `atomicWrite(fileName, tempDir: string | undefined, block)`, with the block third and `tempDir` required. So `packages/activerecord/src/connection-adapters/schema-cache.ts` writes `atomicWrite(filename, undefined, async (file) => …)` and carries `@missingRailsArgs atomic_write` for the placeholder `undefined` Rails does not pass.

An optional positional followed by a block has a settled spelling elsewhere in the repo (ruby-compat's `fetch(hash, key, block(…))` reads the block off the last argument with `rbBlockGivenP`).

## Acceptance criteria

- [ ] `atomicWrite(fileName, block)` and `atomicWrite(fileName, tempDir, block)` are both accepted, with `tempDir` defaulting to `File.dirname(fileName)` as `atomic.rb:21` does; `pnpm parity:api:params` stays at 0 for activesupport.
- [ ] `SchemaCache#open` passes `filename` and the block only; the `@missingRailsArgs atomic_write` receipt is deleted.
- [ ] `pnpm parity:api:calls:args` green with no new row; `FileStore`'s `atomicWrite(key, cachePath, block)` call is unchanged.

## Verification

```bash
pnpm parity:api:calls:args && pnpm parity:api:params && pnpm vitest run packages/activesupport/src/core-ext/file.test.ts packages/activerecord/src/connection-adapters/schema-cache.test.ts
```
