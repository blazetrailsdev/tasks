---
title: "ruby-compat: give OptionParser::List short/long maps and seed DefaultList"
status: ready
updated: 2026-11-09
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`OptionParser::DefaultList` is ported as a bare `new List()` (`packages/ruby-compat/lib/optparse.ts`, landed in trails#9906). In MRI, `DefaultList` (`vendor/ruby/v3.3.11/lib/optparse.rb:1019-1021`) also seeds `short['-']` with a `Switch::NoArgument` and `long['']` with one that does `throw :terminate`. The port's `List` has only `list`. It has no `short` / `long` `OptionMap`s (`:800-821`), so `--` termination and a bare `-` are hard-coded in `_parseInOrder` instead of being looked up on the stack.

## Acceptance criteria

- `List` gains `short` / `long` maps (`optparse.rb:805-808`).
- `DefaultList` seeds `-` and `''` as MRI does (`:1020-1021`).
- `_search` / `_complete` read the stack's lists, not the flattened switch array, matching `OptionParser#search` / `#complete`.
