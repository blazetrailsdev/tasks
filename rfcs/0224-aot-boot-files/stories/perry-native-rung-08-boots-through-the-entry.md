---
title: "The perry native ladder boots through the generated entry and /up answers 200"
status: draft
updated: 2026-11-08
rfc: "0224-aot-boot-files"
cluster: null
packages: []
deps: ["trails-build-writes-the-boot-file-map"]
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

RFC 0224. Run r63 on the perry native ladder already boots rung 08 through
`.trails/entry.generated.js`. It compiled the app classes in and still
answered 404, because routes were missing.

## Change

Rungs 07 and 08 of `examples/perry-native` import `.trails/entry.generated.js`
instead of `config/environment`. The ladder runs `trails build` first.
Update FINDINGS for wall 30.

## Acceptance

The compiled binary prints `[08] env=production status=200 len=73`.
