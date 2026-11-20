---
title: "locale-registration-keyed-on-shared-import-meta-url"
status: draft
updated: 2026-11-20
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Each package registers its English locale under `new URL("./locale/en.js", import.meta.url).pathname`: `packages/activerecord/lib/i18n.ts:4`, `packages/activemodel/lib/i18n.ts:4`, `packages/activesupport/lib/i18n.ts:7`; `packages/i18n/lib/backend/base.ts:64-65` keys `localeModules` on that filename. A bundler that gives every module one `import.meta.url` (Expo's `__ExpoImportMetaRegistry.url` is the bundle URL) makes the three keys equal, so the last registration replaces the others and every validation message reads "Translation missing".

Found building `examples/react-native-notes` (trails#10425), which works around it in the example; see its README row 4.

## Acceptance criteria

- Locale registration keys do not depend on `import.meta.url` being per-module (a package-unique key, e.g. `@blazetrails/activemodel/locale/en.js`).
- A single-bundle build (Metro) renders `Name can't be blank`.
