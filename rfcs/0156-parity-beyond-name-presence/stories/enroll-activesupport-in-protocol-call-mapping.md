---
title: "enroll-activesupport-in-protocol-call-mapping"
status: draft
updated: 2026-09-24
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`PROTOCOL_CALL_ENROLLED_PACKAGES` (`scripts/parity/conventions.ts`) maps a Rails
body's calls to `PROTOCOL_DEFINITION_NAMES` (`inspect`, `dup`, `to_a`, `to_h`,
`to_hash`, …) into the call gate through `rubyCallToTs`, so a port that drops
a `.dup` or renders with `JSON.stringify` where Rails calls `inspect` is
flagged. `inspect` is credited by ruby-compat's `rbInspect`
(`Kernel#inspect` in `scripts/parity/ruby-compat.ts`), `to_a` by `toArray`.

The set is only-grow, and `activesupport` was left out because enrolling it adds these
17 rows (measured by adding `"activesupport"` to the set and running
`pnpm parity:api:calls`):

- `cache.ts` `default_serializer` omits `inspect`
- `cache/entry.ts` `dup_value!` omits `dup`
- `cache/serializer-with-fallback.ts` `load` omits `inspect`
- `callbacks.ts` `merge_conditional_options` omits `dup`
- `deep-mergeable.ts` `deep_merge` omits `dup`
- `execution-context.ts` `to_h` omits `dup`
- `isolated-execution-state.ts` `share_with` omits `dup`
- `json/encoding.ts` `encode` omits `dup`
- `multibyte/chars.ts` `initialize` omits `dup`
- `number-helper/number-converter.ts` `default_format_options` omits `dup`
- `number-helper/number-converter.ts` `i18n_format_options` omits `dup`
- `number-helper/number-to-phone-converter.ts` `convert` omits `dup`
- `ordered-hash.ts` `reject` omits `dup`
- `ordered-hash.ts` `select` omits `dup`
- `ordered-options.ts` `to_h` omits `merge`
- `time-with-zone.ts` `inspect` omits `strftime`
- `xml-mini/rexml.ts` `parse` omits `inspect`

## Acceptance criteria

- Each row above is converged in the TS body — the call Rails makes is made,
  `inspect` through `rbInspect` or the value's own ported `inspect`, `dup`
  as the receiver's `dup` — citing the Rails `file:line`. None is baselined.
- `"activesupport"` is added to `PROTOCOL_CALL_ENROLLED_PACKAGES`, and
  `pnpm parity:api:calls`, `pnpm parity:api:calls:args` and
  `pnpm parity:api:calls:ruby-compat` are green with it enrolled.
