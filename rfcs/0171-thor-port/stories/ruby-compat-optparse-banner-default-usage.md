---
title: "OptionParser#banner defaults to 'Usage: prog [options]'"
status: ready
updated: 2026-11-07
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`OptionParser#initialize` stores `@banner = banner` (nil by default), and the `banner` reader computes the default `"Usage: #{program_name} [options]"` when it is unset (`vendor/ruby/v3.3.11/lib/optparse.rb:1143-1146`, `def banner` in the same file). ruby-compat's constructor (`packages/ruby-compat/src/optparse.ts`, added in trails#9793) does `this.banner = banner ?? ""`, so a parser built without a banner prints an empty first line.

## Acceptance criteria

- `banner` defaults to null and its reader answers `Usage: ${programName} [options]` when unset, as MRI does.
- `toString` reads through the reader; rackup `parseBang` output unchanged.
