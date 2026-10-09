---
title: "api-compare: the skeleton writer drops ~500 top-level functions the synthesized file module re-lists"
status: done
updated: 2026-10-09
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#8729
claim: "2026-10-09T21:09:37Z"
assignee: "mysql2-perform-query-unboxes-the-float-carrier-in-the-ported-body"
blocked-by: null
closed-reason: null
---

## Context

`skeletonsOfOwner` (`scripts/api-compare/compare.ts`) reads a pair's TS skeletons by NAME whenever the
file holds fewer than two module / top-level bodies for it. The by-name list (`tsSkeletonByFileName`) is
appended once per extracted member, and the extractor's synthesized file module
(`synthesizedFileModule: true`, `scripts/api-compare/extract-ts-api.ts`, "also create a module entry from
the file name") re-lists every top-level function of a file that has exported functions and no class or
module. So one `export function` arrives twice, the by-name list has length 2, and the skeleton writer's
`tsSkeletons?.length === 1` guard drops the pair. `recordSkeletonBody` already dedupes the same
declaration by site (`tsSkeletonBodiesByFileName`), but `skeletonsOfOwner` only consults that map when
there are two or more distinct bodies.

Measured while working `marshalling-methods-bodies-are-not-arm-compared`: returning the single deduped body
when `skeletonsByOwner` holds exactly one (`const declared = [...byOwner.values()].flat(); if
(declared.length === 1) return declared;`) grows `call-skeletons.json` from 7554 rows to 8071. Among the
517 pairs that are invisible today: `abstractcontroller/deprecator.ts#deprecator`,
`actioncontroller/metal/content-security-policy.ts#contentSecurityPolicy`,
`actionview/helpers/javascript-helper.ts#escapeJavascript`, `actionview/helpers/csrf-helper.ts#csrfMetaTags`.
Every `@inventedArm` on one of those declarations is rejected as "declaration not compared", and none of
their arms reach `parity:api:arms:report`.

The fix was not shipped with that story because the newly compared pairs red the only-shrink arm-throw
gate: `pnpm parity:api:arms:throws` reports `activesupport total: mark 3 -> current 5`, from
`activesupport/inflector.ts#camelize` (`-throw +if`) and `activesupport/transliterate.ts#transliterate`
(`-throw -if -if -if -if -if`; Rails raises `ArgumentError` for a disallowed encoding,
`activesupport/lib/active_support/inflector/transliterate.rb:66`). `marshalling.ts` was reshaped onto
`new Module().include({ ... })` instead, which the extractor records as a real module.

## Acceptance criteria

- [ ] A top-level `export function` in a file whose only module is the synthesized file module gets a
      `call-skeletons.json` row (one body listed under two owners compares as one body).
- [ ] The two activesupport missing-throw rows the fix surfaces are converged, or receipted, before the
      writer change lands, so `pnpm parity:api:arms:throws` stays green without raising a mark.
- [ ] `pnpm parity:api:arms:report` is re-read for the newly compared pairs and any unreceipted invented
      arm is filed against its package.
