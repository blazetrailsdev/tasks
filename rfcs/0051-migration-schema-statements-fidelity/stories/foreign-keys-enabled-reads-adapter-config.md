---
title: "isForeignKeysEnabled reads adapter._config, not nonexistent .config"
status: done
updated: 2026-07-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 25
priority: 10
pr: 4755
claim: "2026-07-07T19:37:53Z"
assignee: "foreign-keys-enabled-reads-adapter-config"
blocked-by: null
closed-reason: null
---

## Context

While adding the `use_foreign_keys?` guard to the abstract FK mutators (PR #4691),
found that `SchemaStatements#isForeignKeysEnabled()` reads the wrong field:

`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts:2454`

```ts
isForeignKeysEnabled(): boolean {
  const adapter = this.adapter as any;
  return adapter.config?.foreignKeys !== false;
}
```

`AbstractAdapter` stores its config in `_config` (`abstract-adapter.ts:648`,
`this._config = { ...config }` at :1135) and exposes **no** `config` getter. So
`adapter.config` is always `undefined` → `undefined !== false` → always `true`.
The config-driven disable path is inert: an adapter configured with
`foreign_keys: false` will still have `use_foreign_keys?` return true (as long as
`supportsForeignKeys()` is true), and FK mutators will emit `ADD/DROP CONSTRAINT`.

Rails: `foreign_keys_enabled?` is `@config.fetch(:foreign_keys, true)`
(`vendor/rails/.../abstract/schema_statements.rb:1545` region), i.e. it reads the
adapter's real config hash.

## Acceptance criteria

- [ ] `isForeignKeysEnabled()` reads the adapter's actual config
      (`_config.foreignKeys`, via the same accessor other config reads use) so a
      `foreignKeys: false` (or Rails `foreign_keys: false`) config makes
      `isUseForeignKeys()` return false.
- [ ] Add a test: an adapter constructed with `foreignKeys: false` no-ops
      `addForeignKey`/`removeForeignKey` even though `supportsForeignKeys()` is true.
- [ ] Verify the default (no key set) still returns true (Rails `fetch(..., true)`).
- [ ] api:compare / test:compare delta non-negative; no test-name changes.
