---
title: "schema-memo-read-through-guard's message sends mid-replay readers to ownSchemaMemo, which reds the suite"
status: done
updated: 2026-08-18
rfc: "0078-sti-schema-reflection-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 6720
claim: "2026-08-18T20:31:56Z"
assignee: "wave-4c-ar-core-residue-attributes"
blocked-by: null
closed-reason: null
---

## Context

`eslint/schema-memo-read-through-guard.mjs`'s `rawRead` message tells every
violator to route the read through `ownSchemaMemo`:

> Read it through `ownSchemaMemo(host, "{{name}}")` (or `isSchemaLoaded`), which
> applies the `schemaStaleAgainstAncestors` pull fallback.

For a call site that runs **inside its own class's decorator replay** that advice
is actively wrong, and following it ships a red suite. Measured on PR #6712 while
fixing the guard's one violation (`assertEnumTypeDeclared`,
`packages/activerecord/src/enum.ts`):

- `applyColumnsHash` (`packages/activerecord/src/model-schema.ts`) writes
  `_columnsHash`, then calls `replayOwnPendingDecorators`, and only stamps
  `host._schemaRevision = nextSchemaEpoch()` at the very END of the function.
- So during the replay the class's own `_schemaRevision` is still behind its
  ancestors', `schemaStaleAgainstAncestors` returns `true`, and `ownSchemaMemo`
  answers `undefined` — blanking the hash that was written three statements
  earlier.
- Concretely: routing `assertEnumTypeDeclared` through `ownSchemaMemo` reds 6
  `WithAnnotationsTest` cases in `packages/activerecord/src/associations.test.ts`
  with `Undeclared attribute type for enum 'breed' in LiveParrot`.

The correct primitive there is `ownProp` — the own-property half without the
staleness pull — which #6712 exported from `model-schema.ts` and used. The rule's
message names neither `ownProp` nor the replay caveat, so the next person to hit
this rule walks into the same red run.

Rails anchor for why the own-property check is the load-bearing half:
`vendor/rails/activerecord/lib/active_record/model_schema.rb:587-597` — Ruby class
ivars are not inherited, so a subclass never sees the base's `@columns_hash`; JS
statics are, which is the whole reason the guard exists. The
`schemaStaleAgainstAncestors` pull fallback is separately covering trails' missing
`inherited` hook (`model_schema.rb:553-568`), and is exactly the part a
mid-replay reader must NOT apply.

## Converged shape

Widen the `rawRead` message to name all three primitives and when each applies:

- `isSchemaLoaded` — for the loaded-flag read
- `ownSchemaMemo` — the default, for readers OUTSIDE a schema load
- `ownProp` — for readers running INSIDE the class's own `applyColumnsHash` /
  decorator replay, before `_schemaRevision` is stamped

Optionally add `ownProp` to the rule's `allowIn` default alongside
`ownSchemaMemo` / `schemaStaleAgainstAncestors`, and cover the new message in
`eslint/schema-memo-read-through-guard.test.mjs`.

## Note on lifetime

`delete-schema-revision-and-decorator-replay-machinery` (same RFC) deletes this
rule outright along with `_schemaRevision` / `ownSchemaMemo` / `ownProp`. If that
story lands first this one is moot and should be closed against it; until then the
misleading message is live and costs a full red test run per encounter.

## Acceptance criteria

- [ ] The `rawRead` message names `ownProp` and the mid-replay caveat, not just
      `ownSchemaMemo`.
- [ ] `eslint/schema-memo-read-through-guard.test.mjs` covers it.
- [ ] `pnpm eslint packages/activerecord/src` stays clean.
