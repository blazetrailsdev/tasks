---
title: "trails build lists app/helpers in the boot file map"
status: done
updated: 2026-11-09
rfc: "0224-aot-boot-files"
cluster: null
packages: ["trails-tsc"]
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: trails#9901
claim: "2026-11-09T03:26:20Z"
assignee: "trails-build-lists-the-helpers-in-the-boot-file-map"
blocked-by: null
closed-reason: null
---

## Context

RFC 0224. trails#9876 made `helperConstants` load each helper through
`loadIseqEval`, which consults the compiled-file map. But `trails build`'s
`BOOT_PATHS` lists only routes, environments, initializers and seeds, so no
helper is ever registered.

## Found by

The perry native ladder, wall 34: a compiled rung 08 boots past every
initializer and then fails in `helperConstants` with
`Cannot find module '.../app/helpers/application-helper.ts'`.

## Change

`trails build` lists `app/helpers` for the application and each engine. It
walks every existent helpers directory the same way `helperConstants` does:
recursively, matching `-helper` / `_helper` files and skipping `.test.` and `.d.`.

## Acceptance

`build-autoload.trails.test.ts`: the boot file registers a top-level helper and
a nested helper, but not a non-helper file or a helper test.
