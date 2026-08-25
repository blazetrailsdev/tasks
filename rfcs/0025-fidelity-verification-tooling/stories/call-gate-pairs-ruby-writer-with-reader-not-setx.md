---
title: "pair a Ruby writer with setX rather than the reader in the call gates"
status: closed
updated: 2026-08-17
rfc: "0025-fidelity-verification-tooling"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Superseded by precise-call-pairing-key-for-owner-static-and-accessor (2026-08-17 sweep): all five are one root cause — the <package,tsFile,rubyName> row key cannot name the member on either side. Every citation and baselined row from this story is carried into that body as an acceptance criterion."
---

## Context

Surfaced in PR #6441 (`port-xml-mini-backend-and-parsing-half`).

`rubyMethodToTs` maps a Ruby writer `foo=` to the candidate list
`[camel, "set" + Camel]`, bare-camel first
(`scripts/parity/conventions.ts:1210-1223`). The bare name is the READER, so
whenever a pair is ported as reader `foo()` + awaitable writer `setFoo()` — the
sanctioned shape for a writer whose Rails body blocks on I/O, per that same
comment and CLAUDE.md — the call gate compares the Ruby WRITER's call set
against the READER's body. Every call the writer makes is then reported missing
from a body that obviously never makes it.

The artifact rows are identifiable by `tsName` being the reader:

```json
{
  "rubyName": "backend=",
  "tsName": "backend",
  "missing": ["cast_backend_name_to_module → castBackendNameToModule"]
}
```

In #6441 both `backend=` (`activesupport/lib/active_support/xml_mini.rb:105-109`)
and `current_thread_backend=` (`:196-198`) flagged
`cast_backend_name_to_module` even though `setBackend` /
`setCurrentThreadBackend` call it on exactly the line Ruby does. They ship as
two `@missingRailsCall` receipts on the readers
(`packages/activesupport/src/xml-mini.ts:151`, `:521`), which is the wrong place
for them — the tag is meant to record a real omission, not paper over a mispair.

Inherited rows of the same shape are already sitting in the baseline, filed as
genuine debt when they are not: `scripts/api-compare/call-mismatches-exclude/
activerecord/scoping.json` (`current_scope=` → `set_current_scope`,
`global_current_scope=` → `set_global_current_scope`) and
`activerecord/model-schema.json` (`table_name=`). Fixing the pairing retires
those rows and the two tags together.

## Converged shape

When resolving a Ruby writer `foo=`, prefer the `setFoo` candidate if a
`setFoo` member exists in the same TS container — or, equivalently, consume
candidates so that a reader already matched to Ruby `foo` is not re-matched to
`foo=`. Ruby readers and writers are distinct members and should pair to
distinct TS members whenever both exist; today they collide on one.

Keep the current fallback intact: a plain-value writer ported as a property
setter or a same-named method (`table_name=` → `tableName`) must still match the
bare name when no `setFoo` exists, or a large number of AR rows regress.

## Acceptance criteria

- A Ruby `foo=` whose TS container has BOTH `foo` and `setFoo` pairs with
  `setFoo` for arity, call-set and call-arg comparison.
- A Ruby `foo=` whose container has only `foo` still pairs with `foo`
  (no matched-count regression: `pnpm parity:api` delta non-negative overall and
  per package).
- The two `@missingRailsCall cast_backend_name_to_module` tags in
  `packages/activesupport/src/xml-mini.ts` are deleted, and the gate stays green
  without them.
- The stale `scoping.json` / `model-schema.json` writer rows this un-flags are
  deleted by hand (only-shrink; never `--write`/reseed).
- `scripts/parity/conventions.test.ts` covers both arms, and
  `docs/ruby-ts-conventions.md` regenerates to match.
