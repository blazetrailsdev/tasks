---
title: "load_yaml alias is a class field — arity 0 vs (filename)"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 6051
claim: "2026-08-04T12:38:26Z"
assignee: "i18n-load-yaml-alias-arity"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api` reports i18n `arity: 74/76`, and both mismatches are the same
member:

```json
{
  "rubyFile": "backend/base.rb",
  "tsFile": "backend/base.ts",
  "rubyName": "load_yaml",
  "tsName": "loadYaml",
  "rubySig": "(filename)",
  "tsSig": "()",
  "rubyRange": { "min": 1, "max": 1 },
  "tsRange": { "min": 0, "max": 0 }
}
```

(the second row is the same member seen through `backend/simple.rb`'s
`include Base`.)

Cause: `packages/i18n/src/backend/base.ts:551` spells the gem's
`alias_method :load_yaml, :load_yml` (`vendor/i18n/lib/i18n/backend/base.rb:272`)
as a **class field** bound at construction:

```ts
/** Mirrors: `alias_method :load_yaml, :load_yml` (base.rb:251). */
protected loadYaml = this.loadYml;
```

A class field has no signature, so the extractor reads arity 0 while
`loadYml(filename: string)` at `base.ts:542` takes one. The field form also
carries the usual aliasing hazards (per-instance copy, invisible to prototype
overrides — a subclass overriding `loadYml` would not be seen by `loadYaml`,
which is exactly the extension point `Backend::Simple`'s mixin design exists
for). The JSDoc line number is also stale (`base.rb:251` → `:272`).

## Acceptance criteria

- `loadYaml` is a real method delegating to `this.loadYml(filename)` with the
  Rails parameter name, so a subclass override of `loadYml` is honoured.
- `pnpm parity:api` reports i18n `arity: 76/76`.
- The JSDoc cites `base.rb:272`.
