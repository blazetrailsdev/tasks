---
title: "parity:api records ViteRuby::CLI's Thor parent as a sanctioned divergence"
status: ready
updated: 2026-11-15
rfc: "0239-vite-assets-port"
cluster: null
packages: ["vite-assets"]
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Problem

`pnpm parity:api vite-assets` reports inheritance at 20/21. The one mismatch is `ViteRuby::CLI` (cli.rb): Ruby has `rubySuper: null`, and TS `CLI extends Thor` (`super-mismatch`). RFC 0239 rules that the CLI is built on `@blazetrails/thor` instead of dry-cli (meta RFC open question 4, operator 2026-11-12), so the extra superclass is intended.

## Fix

Record the Thor parent as a sanctioned divergence in the comparator's inheritance-exception mechanism, the way other ported-framework substitutions are recorded, citing the RFC ruling. Do not restructure `cli.ts`.

## Done when

`parity:api vite-assets` inheritance is at 21/21, or the mismatch is excluded from the denominator with a cited reason.
