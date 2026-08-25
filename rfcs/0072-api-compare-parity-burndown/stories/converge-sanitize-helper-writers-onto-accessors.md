---
title: "converge-sanitize-helper-writers-onto-accessors"
status: closed
updated: 2026-07-27
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Out of scope for AR-focused 0072 burndown: actionview is in the web/framework stack, not ActiveRecord's dependency graph (activerecord, activerecord-cli, arel, activemodel, activesupport, globalid, did-you-mean, trails-tsc). Reopen/re-home under a web-stack parity RFC if desired."
---

## Context

From the `audit-set-prefixed-writers-for-accessor-convergence` inventory.
`scripts/api-compare/conventions.ts` maps a Ruby writer `foo=` onto the SAME
camelCase name as its reader, so an `export function setFoo` sibling is TS
surface Rails does not have.

`packages/actionview/src/helpers/sanitize-helper.ts` exports four such
writers. Rails declares each as a `class_attribute`-backed reader/writer pair
on `ActionView::Helpers::SanitizeHelper::ClassMethods` in
`vendor/rails/actionview/lib/action_view/helpers/sanitize_helper.rb`:

- `setSanitizerVendor` (line 190) — Rails `sanitizer_vendor=`
- `setFullSanitizer` (line 209) — Rails `full_sanitizer=`
- `setLinkSanitizer` (line 220) — Rails `link_sanitizer=`
- `setSafeListSanitizer` (line 231) — Rails `safe_list_sanitizer=`

Note the TS readers are not currently in the same file for these four (the
audit flagged `readerSameFile = false`), so converging also means checking
where the reader half lives and whether it belongs in the Rails-layout file.

The converged shape is an exported class module holding the pair under the
Rails name — a plain assignable static property, or a `get`/`set` pair when
the writer has logic. Exemplar:
`packages/actionpack/src/action-dispatch/http/mime-negotiation.ts`.

## Acceptance criteria

- All four `set`-prefixed exports replaced by the accessor shape under the
  Rails name, with the reader half in the same Rails-layout file.
- Call sites in actionview updated.
- No new extra-surface allowlist entries or `@noRailsEquivalent` tags.
- Existing actionview tests stay green.
