---
title: "extract_parameterized_parts invents a fifth arm"
status: draft
updated: 2026-09-06
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
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

Surfaced by PR #7544, which cleared the `drop_while` / `delete_if` / `compact!`
lowering artefacts from this pair (audit row 35 of
`docs/infrastructure/arm-mismatch-noise-floor.md`). One invented `if` survives
and is not a spelling difference.

Rails: `vendor/rails/actionpack/lib/action_dispatch/journey/formatter.rb:78-142`
(`extract_parameterized_parts`), whose arms are the `parameterized_parts.each`
guard, the `keys_to_keep` `drop_while` test, the `delete_if` test and the
`each { |k, v| … }` `to_param` test — four.

The trails port
(`packages/actionpack/src/action-dispatch/journey/formatter.ts#extractParameterizedParts`)
projects five: after #7544's fold the arms streams are

```text
RB  ref:merge ref:parts loop loop if ref:key? or … ref:required_parts loop if ref:include? loop if ref:to_param loop if
TS  ref:parts ref:reverse new:Set loop if ref:hasOwn or … if and ref:add loop ref:requiredParts ref:add loop ref:keys if ref:has ref:get loop ref:entries if ref:get ref:get ref:toParam loop ref:keys if ref:get ref:get
```

## Converged shape

Read the Rails body line by line and remove the extra arm — it is most likely a
hoisted `nil` test on a value Rails reads directly, or an extra membership
guard around the `keys_to_keep` set. Keep Rails' branch order and guard
polarity; do not merge two Rails arms to make the count match.

## Acceptance criteria

1. `extractParameterizedParts` has exactly Rails' four arms, in Rails' order.
2. `pnpm parity:api:arms:report` no longer flags
   `actiondispatch/journey/formatter.ts#extractParameterizedParts`.
3. The journey / routing suites pass with no test renames.
