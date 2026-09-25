---
title: "Enroll activesupport in NAMING_ENROLLED_PACKAGES"
status: ready
updated: 2026-09-24
rfc: "0153-naming-residue-ratchet-and-burndown"
cluster: null
packages: ["activesupport"]
deps:
  [
    "naming-activesupport-cache-coder-packed-header",
    "naming-activesupport-message-pack-time-seat",
    "naming-activesupport-twz-to-time-getlocal-zone-object",
    "naming-activesupport-array-to-xml-class-name",
  ]
deps-rfc: []
est-loc: 10
priority: 52
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split from `naming-residue-burndown-activesupport-structural`. That story's PR converged ten of activesupport's fourteen naming-gate rows:

- `multibyte/chars.ts` `compose` / `decompose`: ruby-compat `pack(…, "U*")` and `toA`.
- `string-utils.ts` `indent`.
- `module-ext.ts` `delegateMissingTo` and `core-ext/date/calculations.ts` `plusWithDuration`, both now `this`-typed.
- `values/time-zone.ts` `iso8601` / `rfc3339` / `partsToTime`, which now build a `@blazetrails/date` `Time` and take its new `utc()`.

It could not add `activesupport` to `NAMING_ENROLLED_PACKAGES` (`scripts/api-compare/lint-call-args.ts:101`). With activesupport enrolled, `pnpm parity:api:calls:args` reports four `unreceipted` rows, and each one belongs to a dep:

- `naming-activesupport-cache-coder-packed-header`: `cache/coder.ts` `load` `load_version` (`byteslice`)
- `naming-activesupport-message-pack-time-seat`: `message-pack/extensions.ts` `writeTimeWithZone` `write_time` (`utc`)
- `naming-activesupport-twz-to-time-getlocal-zone-object`: `time-with-zone.ts` `toTime` `getlocal` (`timeZone`)
- `naming-activesupport-array-to-xml-class-name`: `array-utils.ts` `toXml` `underscore` (`name`)

## Acceptance criteria

- [ ] `activesupport` is added to `NAMING_ENROLLED_PACKAGES`, and `pnpm parity:api:calls:args` is green with it enrolled.
- [ ] No row is receipted to get green unless its class is permanent.
