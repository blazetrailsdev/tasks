---
title: "call-gate-credits-typed-fetch-on-plain-object-config-receivers"
status: done
updated: 2026-10-28
rfc: "0194-ruby-compat-native-first"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9411
claim: "2026-10-28T16:19:26Z"
assignee: "call-gate-credits-typed-fetch-on-plain-object-config-receivers"
blocked-by: null
closed-reason: null
---

## Context

The call-gate-credits-native-form-on-unproven-hash-receivers bundle taught the call gate to credit `merge` / `merge!` / `update` from a checker-proven plain-object receiver (`merge@typed`, `merge!@typed` in `scripts/api-compare/enumerable-idioms.ts` `TYPED_NATIVE_FORM`, emitted in `extract-ts-api.ts` `addHashForm`), and converted `test-request.ts` `create`, `transactions.ts` `setOptionsForCallbacksBang` and `test-case.ts` `paramsParsers`. The `fetch` sites the story also listed were left on the helper, because whether `{ k: undefined }` can reach each one is the forwarded-keyword question in `native-fetch-ternary-sites-audit-forwarded-undefined-keywords`:

- `packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:672` `fetch(this._config, "flags", 0)` (`sqlite3_adapter.rb`).
- `packages/activerecord/src/connection-adapters/abstract-mysql-adapter.ts:852` `fetch(this._config, "strict", true)`, `:1196` `fetch(this._config, "variables", {})` (`abstract_mysql_adapter.rb`).
- the postgresql adapter's `@config.fetch` site.
- `packages/activerecord/src/connection-adapters/abstract/schema-definitions.ts:210` `ForeignKeyDefinition#defined_for?` / `validate?` `options.fetch(:validate, …)`.
- thor `packages/thor/src/line-editor/basic.ts` `echo?` and `actions.ts` `apply`'s `config.fetch(:verbose, true)`.

## Acceptance criteria

- [ ] Add a `fetch@typed` arm (`Object.hasOwn(h, "k") ? h.k : d` over a checker-proven plain object) to `TYPED_NATIVE_FORM` / `TYPED_CREDITED_CALLS`.
- [ ] Each site above traces whether a caller can pass `{ k: undefined }`; where none can, it converts to the native ternary, else it keeps the helper with the absent-keyword disable.
- [ ] `parity:api:calls` and `parity:api:calls:args` stay green with no new rows.
