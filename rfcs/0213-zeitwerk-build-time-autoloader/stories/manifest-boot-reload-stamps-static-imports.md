---
title: "Stamp static imports on reload after a manifest boot"
status: in-progress
updated: 2026-11-02
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#9632
claim: "2026-11-02T16:46:44Z"
assignee: "autoloader-receipts-recheck-after-scan-retires"
blocked-by: null
closed-reason: null
---

## Context

With `Loader#manifest` set, `Config#pushDir` (`packages/zeitwerk/src/loader/config.ts`) records no `_realRoots` entry, so `_installResolveHook` (`packages/zeitwerk/src/core-ext/kernel.ts`) stamps no generation on static imports after `reload`, and `require` skips `imports` past generation 1. `Loader#reload` (`vendor/zeitwerk/v2.7.2/lib/zeitwerk/loader.rb:233-246`) has no such split: a reloaded file and its static edges are all new.

## Acceptance criteria

- A manifest-booted loader with reloading enabled gets new classes through both `require` and a static import after `reload`, in a real `node` subprocess test.
- Or `reload` raises a Zeitwerk error naming the limit when no file system is available.
