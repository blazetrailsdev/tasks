---
title: "Three ArgumentError raises ported as TypeError"
status: ready
updated: 2026-09-06
rfc: "0111-error-class-message-parity"
cluster: duplicate-error-classes
packages: ["actiondispatch", "actioncontroller"]
deps: []
deps-rfc: []
est-loc: 60
priority: 10
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the RFC 0113 arm report's third verdict, `raise-class`
(`scripts/api-compare/report-arms.ts#ArmVerdict`): the two bodies' arm multisets
agree only once the raised CLASS is erased, so the port raises where Rails
raises but names a different error. That is RFC 0111's "same error class"
population, surfaced without a second extractor — the report's own doc comment
says so.

The whole verdict is **26 rows**, regenerable at any time with
`pnpm parity:api --calls && pnpm parity:api:arms:report`, under "Raise class
mismatches", which prints them as `Rails -> trails` pairs.

Two of the 26 are already filed — `verify-readonly-attribute-error-class`
(`ActiveRecordError -> ReadonlyAttributeError`) and
`rack-bounded-io-raises-emptycontent-not-eof` (`EOFError -> EmptyContentError`)
— and are NOT repeated here. The remaining 24 are split across four sibling
stories by family; this is one of them.

This verdict is advisory and stays that way. The RFC 0113 ratchet that landed in
trails#7554 gates only the missing-`throw` stratum — whether the port raises AT
ALL — never which class it raises. So nothing turns red while these sit here and
nothing turns green when they are fixed; the evidence is the Rails `file:line`.

## The rows

| divergence                   | trails site                                                                  | Rails site                                                    |
| ---------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `ArgumentError -> TypeError` | `actiondispatch/http/content-security-policy.ts#applyMappings`               | `http/content_security_policy.rb#apply_mappings`              |
| `ArgumentError -> TypeError` | `actioncontroller/metal/request-forgery-protection.ts#protectionMethodClass` | `metal/request_forgery_protection.rb#protection_method_class` |
| `ArgumentError -> TypeError` | `actioncontroller/metal/request-forgery-protection.ts#storageStrategy`       | `metal/request_forgery_protection.rb#storage_strategy`        |

Three sites where Rails raises `ArgumentError` and the port raises `TypeError`
— a different class rather than a missing one, so a `rescue ArgumentError`
written against Rails' contract never catches it. Two are the same
`request_forgery_protection.rb` pair. See `shared-ruby-typeerror-mirror` and
`two-argumenterror-classes-for-rubys-one` first: whichever `ArgumentError` those
settle on is the class these three should raise.

## Acceptance criteria

- [ ] Every row above raises the Rails class at the Rails site, with the Rails
      message string, per CLAUDE.md's "Same error class, same message string,
      same raise site".
- [ ] Where the ported class does not exist yet it is added in the file Rails
      declares it in, not re-declared module-locally — `one-shared-nomethoderror-class`
      records what that costs.
- [ ] `pnpm parity:api:arms:report` no longer lists these under "Raise class
      mismatches"; the verdict total drops by the number converged.
- [ ] No `eslint/rails-error-parity-exclude.json` row is widened to cover any of
      them.
