---
title: "Port thor v1.4.0's utf-8 collision diff spec"
status: draft
updated: 2026-11-22
rfc: "0191-rails-8-0-5-1-upgrade-workflow"
cluster: null
packages: ["thor"]
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

The thor pin moved v1.3.2 → v1.4.0 in the dependent-source bump bundle (RFC 0191 § 1). That PR
ported `gsub_file!` / `actually_gsub_file` and their 17 specs, `show_diff`'s `binmode: true`, and
`merge` / `merge_tool`. One new spec was not ported:
`vendor/thor/v1.4.0/spec/actions/file_manipulation_spec.rb:84-105`,
"shows the diff when there is a collision and source has utf-8 characters". It needs the
`encoding_with_utf8.thor` fixture from `vendor/thor/v1.4.0/spec/fixtures/doc/` and sets
`Encoding.default_internal`.

## Acceptance criteria

- [ ] The spec is ported into `packages/thor/test/actions/file-manipulation.test.ts` with its fixture,
      or parked as `it.skip` under a `PERMANENT-SKIP:` line if `Encoding.default_internal` has no port
      (CLAUDE.md, "A String has no encoding tag either").
