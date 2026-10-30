---
title: "capture-subprocess-io-moves-to-minitest"
status: draft
updated: 2026-10-30
rfc: "0206-minitest-port-and-assertions-to-expect"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Minitest::Assertions#capture_subprocess_io` (`vendor/minitest/v5.27.0/lib/minitest/assertions.rb:569-596`) lives as the private `captureSubprocessIo` in `packages/rake/src/test-rake-file-utils.test.ts`, because trails#9497 landed before `@blazetrails/minitest` exists.

## Acceptance criteria

- `capture_subprocess_io` is exported from the minitest package at its Rails name.
- The Rake test imports it and the private copy is deleted.
