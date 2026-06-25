---
title: "Converge duplicate AR module-config homes to canonical ar-config bindings"
status: claimed
updated: 2026-06-25
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 130
priority: null
pr: null
claim: "2026-06-25T11:22:33Z"
assignee: "converge-ar-module-config-duplicate-homes-to-canonical"
blocked-by: null
---

## Context

PR #4097 (converge-residual-ar-module-config-to-base) added canonical
`ar-config.ts` module-level bindings + `setX` setters for the 15 `ActiveRecord`
singleton config flags, mirroring `active_record.rb`. Several of these flags
were already ported in a non-matchable form and now have a SECOND, parallel
home — the canonical ar-config binding is not yet consulted; the old indirect
form still drives behavior. This is duplicate state to converge to a single
source of truth (the ar-config binding):

- `errorOnIgnoredOrder` — consulted as `activeRecordConfig.errorOnIgnoredOrder`
  object property in `relation/batches.ts:122`; `batches.test.ts:615` mutates
  that object. Rewire `actOnIgnoredOrder` to read `arConfig.errorOnIgnoredOrder`
  and update the test to use `setErrorOnIgnoredOrder`.
- `belongsToRequiredValidatesForeignKey` — read as `model.belongsToRequiredValidatesForeignKey`
  in `associations/builder/belongs-to.ts:334` and held in `trailtie.ts` config.
- `maintainTestSchema`, `generateSecureTokenOn`, `queues` — held in the
  `trailtie.ts` `ActiveRecordConfig` object (railtie-level), not read from the
  module global.
- `applicationRecordClass` — module-local `_applicationRecordClass` in
  `inheritance.ts:704`; the public `arConfig.applicationRecordClass` should
  track it (or be the single store).

Rails keeps `config.active_record.x` (railtie) and `ActiveRecord.x` (module);
the railtie copies into the module on boot. Converge so the framework consults
the module global (`ar-config.ts`) and the trailtie config assigns into it,
mirroring that copy — eliminating the parallel state without behavior change
(defaults already match).

## Acceptance criteria

- Each listed consult site reads the `ar-config.ts` canonical binding (directly
  or via a trailtie copy-into-module step), not a parallel object property /
  module-local / Base static.
- Existing tests updated to drive behavior through the `setX` setter.
- No behavior change (defaults already identical); test:compare delta >= 0.
