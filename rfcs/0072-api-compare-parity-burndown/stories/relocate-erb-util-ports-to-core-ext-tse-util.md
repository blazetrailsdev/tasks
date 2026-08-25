---
title: "relocate-erb-util-ports-to-core-ext-tse-util"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6120
claim: "2026-08-05T09:14:57Z"
assignee: "relocate-erb-util-ports-to-core-ext-tse-util"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api` reports `activesupport core_ext/erb/util.rb` as
0/7 — the whole file is unported at its Rails location. Its expected TS path is
`core-ext/tse/util.ts` (via `PATH_SEGMENT_ALIASES`' `erb -> tse`), and that file
does not exist. Five of the seven methods ARE implemented, just elsewhere:

- `html_escape` (`vendor/rails/activesupport/lib/active_support/core_ext/erb/util.rb:25`)
  and `unwrapped_html_escape` (`:18`) → `packages/activesupport/src/core-ext/string/output-safety.ts`
- `html_escape_once` (`:63`) → same file, `htmlEscapeOnce`
- `h` (`:28`, `alias h html_escape`) → `packages/actionview/src/helpers/output-safety-helper.ts:13`
  (`export const h = htmlEscape;`)
- `json_escape` (`:134`) → `packages/actionview/src/helpers/output-safety-helper.ts:26`

`h` and `htmlEscapeOnce` were triaged under
`triage-newly-visible-object-literal-accessors` (PR for
`credit-mixin-methods-ported-in-their-own-file`): both score as **moved** extra
surface in actionview, i.e. genuine Rails methods sitting in the wrong package
and file. They were deliberately NOT allowlisted — the relocation is the fix,
and it is a port, not a triage, so it was split out here.

`xml_name_escape` (`:157`) and `tokenize` are genuinely unported.

## Acceptance criteria

- `packages/activesupport/src/core-ext/tse/util.ts` exists and hosts the
  ERB::Util methods trails implements, at the Rails names and in Rails' source
  order.
- actionview's `helpers/output-safety-helper.ts` no longer declares `h` /
  `htmlEscapeOnce` / `jsonEscape` of its own; call sites import them from
  `@blazetrails/activesupport`.
- `pnpm parity:api` shows `core_ext/erb/util.rb` moving off 0/7, and
  `pnpm parity:api:extra --package actionview` drops the corresponding moved extras.
- No exclusion-file rows added.
