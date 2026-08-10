---
title: "parity:api:extra red — encryption/config.ts getSharedConfig tag states no permanence claim"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6139
claim: "2026-08-05T19:53:07Z"
assignee: "date-package-scaffold"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:extra` exits non-zero on main:

````text
extra-surface: 1 @noRailsEquivalent tag(s) state no permanence claim.
  - activerecord  encryption/config.ts  getSharedConfig
```text

The tag landed in #6127 (`packages/activerecord/src/encryption/config.ts:179`) and
its reason is written out in full but does not open with `PERMANENT` or
`CONVERGEABLE`, which is what the gate requires. Surfaced while running
`pnpm parity:api:extra` on PR #6131; the file was untouched by that PR so it was left
alone.

The reason given is an ESM load-order fact: Ruby resolves
`ActiveRecord::Encryption.config` at call time (encryption/configurable.rb:9,
`mattr_reader :config, default: Config.new`), so `Encryptor`, `Context`,
`Scheme`, `KeyProvider` and `KeyGenerator` can all name it with no load-order
consequence, while an ESM `import` of `configurable.js` from those files puts
`Contexts` — and therefore `EncryptingOnlyEncryptor extends Encryptor` — inside a
module cycle.

## Converged shape

Re-read the cycle claim against the current import graph rather than trusting the
tag: if the cycle is still real, the reason opens with `PERMANENT` and the tag
stays; if the cycle has since been broken (PR #6127 moved `Configurable` to read
its context through `Contexts`), `getSharedConfig` is redundant surface and the
callers should name `Configurable.config`, the reader Rails declares, with
`getSharedConfig` deleted.

## Acceptance criteria

- [ ] `pnpm parity:api:extra` exits zero.
- [ ] Either `getSharedConfig` is gone and its callers read `Configurable.config`,
      or its `@noRailsEquivalent` reason opens with `PERMANENT` and names the
      concrete cycle edge that forces it.
````
