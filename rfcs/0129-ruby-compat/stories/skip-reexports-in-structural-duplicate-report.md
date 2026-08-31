---
title: "skip-reexports-in-structural-duplicate-report"
status: draft
updated: 2026-08-31
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:structural-duplicates:report` (#7294) reports a re-exported
declaration twice — once at its real file and once at the package barrel. Both
real findings in the first run showed up doubled:

```
except (4)
  activesupport/hash-utils.ts:147  except
  activesupport/index.ts:147  except        <- the same declaration
  i18n/utils.ts:12  except
  i18n/index.ts:12  except                  <- the same declaration
hasKey (2)
  activesupport/hash-utils.ts:120  isInclude
  activesupport/index.ts:120  isIncludeObj  <- the same declaration
```

`report-structural-duplicates.ts`'s header currently says this is "left visible
rather than guessed away", on the grounds that the extractor stamps the barrel
entry with the ORIGINAL line so a re-export cannot be told from a real
`index.ts` declaration. **That reasoning is now known to be wrong**: the
extractor already records `reExportedFrom` on exactly these entries
(`scripts/api-compare/extract-ts-api.ts`, and it is consulted there via
`fn.reExportedFrom` when deciding whether to synthesize a file module):

```json
{ "name": "except", "file": "index.ts", "line": 147,
  "reExportedFrom": "hash-utils.ts:except" }
```

So the barrel entry is precisely identifiable and needs no heuristic.

## Acceptance criteria

- `Decl` in `report-ruby-compat.ts` models `reExportedFrom`, and `declarations()`
  skips an entry that carries it — a re-export is not a declaration site.
- The `defaultProc`/`except`/`hasKey` buckets of
  `pnpm parity:structural-duplicates:report` each report one row per real
  declaration; the total falls by the number of re-export rows.
- The "left visible rather than guessed away" paragraph is removed from
  `report-structural-duplicates.ts`'s header, not reworded.
- `pnpm parity:api:calls:ruby-compat:report`'s credited count is re-measured and
  recorded in the PR body: a re-exported function's credit is counted today.
