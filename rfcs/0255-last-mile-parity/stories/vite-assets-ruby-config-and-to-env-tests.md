---
title: "vite-assets: port the ruby-config-file and to-env tests"
status: done
updated: 2026-11-22
rfc: "0255-last-mile-parity"
cluster: small-packages
packages: [vite-assets, vite-trails]
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: trails#10536
claim: "2026-11-22T00:07:32Z"
assignee: "actionview-port-atom-feed-helper"
blocked-by: null
closed-reason: null
---

## Context

"ruby config file": `load_ruby_config` is `Kernel#load`
(`vendor/vite_ruby/v3.11.1/vite_ruby/lib/vite_ruby/config.rb:65-67`), which
trails ports as `rbFLoad` over a `.ts` file (CLAUDE.md "A migration file is
loaded by `Kernel#load`"). "to env" reads the app's `asset_host`, which
vite-trails already reads (`packages/vite-trails/lib/config.ts:10-17`,
`vite_rails/config.rb:9`). Both carry truncated `PERMANENT-SKIP:` receipts.

## Acceptance criteria

- [ ] `loadRubyConfig` calls `rbFLoad` on the config file, as Rails' `load`.
- [ ] Both tests run and pass, and the receipts are removed.

## Verification

```sh
pnpm vitest run packages/vite-assets && pnpm parity:test --missing --package vite-assets
```
