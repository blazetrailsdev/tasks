---
title: "Value-equivalent constant spellings should not count as argument divergence"
status: done
updated: 2026-08-29
rfc: "0126-fidelity-tooling-continuation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: 3
pr: 7210
claim: "2026-08-29T14:33:51Z"
assignee: "association-helpers-extracted-for-the-collection-proxy"
blocked-by: null
closed-reason: null
---

# Value-equivalent constant spellings should not count as argument divergence

## Context

Found while working `0108/converge-remaining-call-arg-shape-rows` (PR #6699).

Ruby and JavaScript spell the same numeric constant differently, and the
call-argument comparator scores the spelling rather than the value, so a port
that passes exactly the right value is flagged and has to carry a permanent
baseline row.

Confirmed instance:

- `activesupport/cache/coder.ts` — `active_support/cache/coder.rb:17` is
  `dump_compressed(entry, Float::INFINITY)`, extracted as `const:INFINITY`. The
  port passes JS `Infinity` (`cache/coder.ts:264`), which is the identical IEEE-754
  value under the only spelling JavaScript has. Baselined in
  `call-mismatches-exclude/activesupport/cache/coder.json` with a reason that
  says exactly this.

The row can never converge by changing the port: `Infinity`,
`Number.POSITIVE_INFINITY` and any other spelling are all equally not the token
`INFINITY`, so the fix belongs in the comparator.

## Converged shape

Normalise a small, closed table of value-equivalent Ruby/TS constant spellings
before comparing argument tokens:

- `Float::INFINITY` / `const:INFINITY` <-> `Infinity`, `Number.POSITIVE_INFINITY`
- `-Float::INFINITY` <-> `-Infinity`, `Number.NEGATIVE_INFINITY`
- `Float::NAN` <-> `NaN`, `Number.NaN`

Keep the table closed and explicit — this is a spelling table, not a general
value-equivalence engine, and it must not start folding together constants that
differ in value (`Float::MAX` and `Number.MAX_VALUE` are NOT equal, for one).
`scripts/api-compare/literals.ts` already does adjacent normalisation work and
is the natural home.

## Acceptance criteria

- [ ] The listed spellings compare equal in the call-argument comparator, and
      the table is closed, explicit and unit-tested.
- [ ] The `cache/coder.json` row is DELETED by hand (only-shrink; no reseed) and
      any stale unreviewed mark tightened with `pnpm parity:api:calls:tighten`.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green, and
      the change surfaces no new rows elsewhere.

_Moved from RFC 0108 on 2026-08-18. 0108 is closing: it delivered its four named
done-conditions (exclude tree 1,637 -> 1,266 rows) and is finishing only the
stories already in flight. This one had not started, so it returns to 0025, the
parent tooling backlog, where the remaining call-gate false-positive classes
live. It is unchanged otherwise — the finding and its citations stand._
