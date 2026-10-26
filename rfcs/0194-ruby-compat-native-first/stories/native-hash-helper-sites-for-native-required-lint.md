---
title: "Native hash-helper sweep: converge hasKey/merge/eachPair/update/mergeBang sites and list them in ruby-compat-native-required"
status: done
updated: 2026-10-26
rfc: "0194-ruby-compat-native-first"
cluster: substitution
packages: []
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: trails#9346
claim: "2026-10-26T19:18:13Z"
assignee: "native-fetch-two-arg-literal-key-sites"
blocked-by: null
closed-reason: null
---

## Context

`blazetrails/ruby-compat-native-required` (`eslint/ruby-compat-native-required.mjs`, trails#9287)
landed with only `hashDelete` in `eslint/ruby-compat-native-required.json`. Running the rule
with every RFC 0190 hash helper listed found these sites on a native-typed receiver:

- `hasKey` — 12 (e.g. `activerecord/src/connection-adapters/abstract/schema-statements.ts:1085`, `mysql2/client.ts:561,568,602`, `i18n/src/backend/base.ts:404,556`, `rack/src/response.ts:399`, `rack/src/cascade.ts:28`, `trailties/src/thor/parser/option.ts:44`, `argument.ts:58`)
- `merge` — 12 (e.g. `actionpack/src/action-dispatch/journey/router.ts:88`, `routing/route-set.ts:499,1108`, `activerecord/src/relation/query-methods.ts:971`, `mini-magick/src/tool.ts:75`)
- `eachPair` — 12 (e.g. `actionpack/src/action-dispatch/http/headers.ts:95`, `request/utils.ts:39`, `rack/src/lint.ts:558`, `trailties/src/trailties/active-job.ts:111,127`)
- `update` — 8 (e.g. `activerecord/src/fixtures.ts:101,266`, `schema-definitions.ts:833`, `actionview/src/helpers/form-tag-helper.ts:512`)
- `mergeBang` — 3 (`actionpack/src/action-controller/renderer.ts:92`, `parameters-permit.test.ts:571`, `trailties/src/thor/actions.ts:384`)

Many receivers are `as Record<…>` casts over a value that may be a `Hash`/`HashWithIndifferentAccess`; those keep the helper behind an `eslint-disable-next-line` naming the dispatching receiver.

## Acceptance criteria

- [ ] Each listed site converges to its native form (`"k" in h` / `Object.hasOwn`, `{ ...h, ...other }`, `for…of Object.entries`, `Object.assign`), or carries a disable naming the dispatching receiver or semantic difference.
- [ ] `hasKey`, `merge`, `eachPair`, `update`, `mergeBang` are added to `eslint/ruby-compat-native-required.json` and to `LISTED_FLOOR` in its test.
- [ ] `pnpm lint` and the call gates stay green.
