---
title: "ruby-compat: port Kernel#sleep; AbstractAdapter#backoff calls it"
status: draft
updated: 2026-10-02
rfc: "0174-activerecord-api-parity-100"
cluster: receipts
packages: ["ruby-compat", "activerecord"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-ca-root` audit: the receipt below was `PERMANENT`, no CLAUDE.md section ratifies it, and it is re-tagged `CONVERGEABLE` onto this story.

`AbstractAdapter#backoff` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:1078-1080`) is `sleep 0.1 * counter` (`Kernel#sleep`, `vendor/ruby/v3.3.11/process.c:5055` `rb_f_sleep`).

`packages/activerecord/src/connection-adapters/abstract-adapter.ts`'s `backoff` is `new Promise((resolve) => setTimeout(resolve, 100 * counter))` and carries `@missingRailsCall sleep`. The timer is open-coded, the unit is milliseconds where Rails' argument is seconds, and nothing names the call. ruby-compat has no `sleep`; two activesupport cache behaviors (`cache/behaviors/cache-store-coder-behavior.ts`, `cache-increment-decrement-behavior.ts`) open-code the same promise for a Rails `sleep`.

A sleep in JS has to be awaited, so the port returns a promise. That is the only difference from the Ruby call, and it belongs in one ruby-compat export.

## Acceptance criteria

- [ ] ruby-compat exports the `Kernel#sleep` port (seconds in, a promise out), cited to `process.c:5055`, with its row in the ruby-compat call table and a fake-timer unit test.
- [ ] `backoff` is `sleep(0.1 * counter)`; the `@missingRailsCall sleep` receipt is deleted.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:ruby-compat` green; the two activesupport cache behaviors call the export too.

## Verification

```bash
pnpm parity:api:calls && pnpm parity:api:calls:ruby-compat
```
