---
title: "Association errors hand-roll DidYouMean.formatter.message_for"
status: draft
updated: 2026-10-01
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8341, which ported `DidYouMean::Formatter` (`packages/did-you-mean/src/formatter.ts`) and `DidYouMean.formatter` / `formatter=` (`packages/did-you-mean/src/index.ts`).

`packages/activerecord/src/associations/errors.ts:6-9` hand-rolls the same string in a private `withCorrections` helper (`` `${message}\nDid you mean?  ${corrections.join("\n               ")}` ``), used at `:43`, `:114` and `:185`. Ruby builds it in one place: `DidYouMean.formatter.message_for(corrections)` (`vendor/did_you_mean/v1.6.3/lib/did_you_mean/core_ext/name_error.rb:15,40`, `formatter.rb:30-32`), which `DidYouMean::Correctable` appends for every error that includes it — the association errors do at `vendor/rails/v8.0.2/activerecord/lib/active_record/associations/errors.rb:17-18,46-47`. A formatter replaced through `DidYouMean.formatter=` therefore does not reach these three errors in trails.

Related: `port-did-you-mean-correctable-onto-name-error` (RFC 0154) ports `Correctable` itself.

## Acceptance criteria

- `withCorrections` is deleted; the three call sites build the suggestion with `formatter().messageFor(corrections)` from `@blazetrails/did-you-mean`.
- A formatter set with `setFormatter` shapes the suggestion on `AssociationNotFoundError`, and the existing association-error tests stay green.
