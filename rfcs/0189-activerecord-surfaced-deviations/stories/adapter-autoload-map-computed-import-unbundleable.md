---
title: "adapter-autoload-map-computed-import-unbundleable"
status: draft
updated: 2026-11-20
rfc: "0189-activerecord-surfaced-deviations"
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

`packages/activerecord/lib/namespaces.ts:161-173` loads seven adapters with `import(new URL("./connection-adapters/<x>.js", import.meta.url).href)`. Metro rejects any non-literal `import()` ("Invalid call") at bundle time, so no Metro app can include `namespaces.ts` unpatched.

Found building `examples/react-native-notes` (trails#10425), which works around it in the example; see its README row 5.

## Acceptance criteria

- Each autoload entry is a literal `import("./connection-adapters/<x>.js")`, keeping the opt-out the computed URL was protecting (bundlers that should not follow them) by a documented mechanism.
- Metro bundles `@blazetrails/activerecord` with no Babel rewrite of these calls.
