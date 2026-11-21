---
title: "generate-tzinfo-data translates the Format 1 tree tzinfo-data actually ships"
status: done
updated: 2026-11-20
rfc: "0231-tzinfo-to-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#10454
claim: "2026-11-20T22:20:44Z"
assignee: "data-timezone-delegates-periods-to-info"
blocked-by: null
closed-reason: null
---

## Context

The tzinfo-data gem's released tree (tag `v1.2026.6`, `lib/tzinfo/data/version.rb`) is **Format 1**. It declares `Version::FORMAT = 1`. Its definition files `include TimezoneDefinition`, which resolves to `TZInfo::Format1::TimezoneDefinition` (`vendor/tzinfo/v2.0.6/lib/tzinfo/format1/timezone_definition.rb`). They call `tz.transition year, month, :oN, timestamp, num, den` (`format1/timezone_definer.rb`, `transition`). The indexes `include TimezoneIndexDefinition` / `CountryIndexDefinition`, which resolve to the Format1 modules.

`scripts/generate-tzinfo-data.ts` knows only `Format2::*` (`MIXINS`), and on that tree it throws `unknown mixin TimezoneDefinition`. Its documented invocation, `pnpm tsx scripts/generate-tzinfo-data.ts`, also fails: tsx transforms the file to CJS and rejects the top-level `await`. Running `node scripts/generate-tzinfo-data.ts` works.

## Acceptance criteria

- [ ] The generator translates the top-level `TimezoneDefinition`, `TimezoneIndexDefinition` and `CountryIndexDefinition` mixins to the Format1 modules (needs `tzinfo-format1-and-format2-definition-modules`), including the 6-argument `transition`.
- [ ] Running the generator on a tzinfo-data v1.2026.6 checkout succeeds.
- [ ] The documented run command works.
