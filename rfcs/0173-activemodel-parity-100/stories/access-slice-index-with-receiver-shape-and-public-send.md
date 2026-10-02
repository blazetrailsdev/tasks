---
title: "activemodel: Access#slice / #values_at call index_with and public_send as Rails does"
status: claimed
updated: 2026-10-02
rfc: "0173-activemodel-parity-100"
cluster: receipts
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-10-02T14:42:18Z"
assignee: "access-slice-index-with-receiver-shape-and-public-send"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `activemodel-audit-permanent-receipts-root`.
`vendor/rails/v8.0.2/activemodel/lib/active_model/access.rb:8-10`:

```ruby
def slice(*methods)
  methods.flatten.index_with { |method| public_send(method) }.with_indifferent_access
end
```

`packages/activemodel/src/access.ts` `slice` is
`withIndifferentAccess(Object.fromEntries(indexWith(methods.flat(), (method) => publicSend(this, method))))`
and carries `@missingRailsArgs index_with — PERMANENT`: ActiveSupport's `indexWith`
(`core_ext/enumerable.rb`) is a free function in trails, so the receiver `methods.flatten` moved into
the argument list and the block became a trailing argument.
`activemodel-converge-registration-json-date-comparability-rows` records the same receiver-first row
for ruby-compat's `mergeBang`. That is a spelling the gate does not credit, not a TypeScript
shortcoming, and no CLAUDE.md section ratifies it.

The file also carries a module-private `publicSend` where ruby-compat has `rbFPublicSend`
(`Kernel#public_send`), and `values_at` (`access.rb:12-14`) uses it the same way.

## Acceptance criteria

- [ ] `slice` reaches `index_with` in whichever shape `activemodel-converge-registration-json-date-comparability-rows` settles for a free-function receiver (a gate credit with a test in `scripts/api-compare/`, or a call spelling that raises no row); the `@missingRailsArgs` receipt is deleted.
- [ ] `slice` / `valuesAt` call `rbFPublicSend`; the private `publicSend` is deleted.
- [ ] `pnpm parity:api:calls:args` green.

## Verification

```bash
pnpm parity:api:calls && pnpm parity:api:calls:args && pnpm vitest run packages/activemodel/src/access.test.ts
```
