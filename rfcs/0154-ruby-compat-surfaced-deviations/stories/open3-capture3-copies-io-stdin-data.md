---
title: "Open3.capture3 copies an IO stdin_data with IO.copy_stream"
status: draft
updated: 2026-10-22
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Open3.capture3` (`packages/ruby-compat/src/open3.ts`, trails#9251) writes `stdinData` as a String only. MRI's `capture3` (`vendor/ruby/v3.3.11/lib/open3.rb:667-672`) copies an IO-like `stdin_data` (one that `respond_to?(:readpartial)`) with `IO.copy_stream(stdin_data, i)`, and only writes it as a String otherwise.

## Acceptance criteria

- `capture3` takes an IO-like `stdinData`: where `rbObjRespondTo(stdinData, "readpartial")` is true, its contents reach the child's stdin as `IO.copy_stream` would copy them. A String is written as it is today.
- The `stdinData` type is widened to match, and the JSDoc no longer says the arm is unported.
- A ruby-compat test pipes a `StringIO` through `cat`.
