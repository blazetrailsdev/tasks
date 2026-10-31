---
title: "rake-file-list-full-array-delegation"
status: in-progress
updated: 2026-10-31
rfc: "0211-rake-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9524
claim: "2026-10-31T03:16:37Z"
assignee: "rake-file-list-full-array-delegation"
blocked-by: null
closed-reason: null
---

## Context

`packages/rake/src/file-list.ts` `ARRAY_CALLS` is a closed table; `vendor/rake/v13.2.1/lib/rake/file_list.rb:44` derives `Array.instance_methods - Object.instance_methods`. Missing: `each_slice`, `each_with_object`, `flat_map`, `sum`, `tally`, `group_by`, `take_while`, `pop(n)`, `shift(n)`, `[]` with a range or length, block arms of `count`/`any?`/`min`/`max`, and `grep`'s block.

## Acceptance criteria

- [ ] Every `Array` and `Enumerable` instance method delegates through `FileList`, and the `@noRailsEquivalent CONVERGEABLE` tag on `ARRAY_CALLS` is removed.
