---
title: "FileList implicit Array conversion under async resolve"
status: done
updated: 2026-10-31
rfc: "0211-rake-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#9527
claim: "2026-10-31T03:36:54Z"
assignee: "rake-file-list-implicit-array-conversion"
blocked-by: null
closed-reason: null
---

## Context

`FileList#to_ary` is async in `packages/rake/src/file-list.ts` because `resolve` globs through async fs, so `rbCheckArrayType` cannot convert it: `flatten`, `Array(fl)` and splat need `await fl.toA()`. `include` (`vendor/rake/v13.2.1/lib/rake/file_list.rb:119-120`) cannot expand a nested FileList at include time, so `resolveAdd` carries an invented arm. `is_a?(Array)` (`file_list.rb:182`) is unported, and `claim to be a kind of array` is skipped.

## Acceptance criteria

- [ ] The repo owner rules on these limits, and `CLAUDE.md` records the ruling, or a converged shape restores implicit Array conversion and include-time expansion.
