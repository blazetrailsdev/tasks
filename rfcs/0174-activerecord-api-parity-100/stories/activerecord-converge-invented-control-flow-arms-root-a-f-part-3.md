---
title: "activerecord: remove or credit the 77 invented branches in root-a-f part 3"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: arms
packages: ["activerecord"]
deps: ["activerecord-converge-missing-control-flow-arms-root"]
deps-rfc: []
est-loc: 542
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:arms:report --package=activerecord --direction=invented` — branches the TS body takes
that Rails' does not. RFC 0113 measured the `if` token ~70% non-real at repo scale (type narrowing,
`?.`, argument normalisation), so each row is either a real invented guard to delete (CLAUDE.md
§ "No extra abstraction", § "Control flow") or an extractor false positive to fix with a test:

- `counter-cache.ts#_foreignKeysEqual` — `+if +if +if +if +if`
- `counter-cache.ts#resetCounters` — `+loop +if +if +if`
- `database-configurations.ts#configsFor` — `+if +if`
- `database-configurations.ts#findDbConfig` — `+if +if`
- `database-configurations.ts#buildConfigurationSentence` — `+loop`
- `database-configurations.ts#buildDbConfigFromHash` — `+throw`
- `delegated-type.ts#delegatedType` — `+if +if`
- `delegated-type.ts#defineDelegatedTypeMethods` — `+if +throw +if +if`
- `disable-joins-association-relation.ts#constructor` — `+if`
- `disable-joins-association-relation.ts#limit` — `+if +if`
- `disable-joins-association-relation.ts#first` — `+if +if`
- `disable-joins-association-relation.ts#load` — `+if +if +if`
- `enum.ts#cast` — `+if +if`
- `enum.ts#assertValidValue` — `+if +if`
- `enum.ts#_enum` — `-loop -loop +if +if +if +if +if +if +if +if +if +if +if +if +if +if +if +if +if +if +if +if +if +if +if +if +if +if +if +if`
- `enum.ts#_enumMethodsModule` — `+if`
- `enum.ts#assertValidEnumDefinitionValues` — `+if +if`
- `enum.ts#assertValidEnumOptions` — `+if`
- `explain-subscriber.ts#ignorePayload` — `+if +if +if +if`
- `explain.ts#execExplain` — `+loop`
- `future-result.ts#executeOrWait` — `+if`
- `base.ts#update` — `+loop +if`
- `base.ts#updateBang` — `+loop +if`

## Acceptance criteria

- [ ] Every real invented guard is removed so the body matches Rails' control flow.
- [ ] Every false positive is fixed in `scripts/api-compare/` (skeleton extraction) with a unit test, not by editing the port; the fix's effect on the other packages is recorded in the PR body.
- [ ] The invented-direction report shows 0 activerecord rows in these files.
