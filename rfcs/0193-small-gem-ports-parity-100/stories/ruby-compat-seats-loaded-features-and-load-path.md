---
title: "Seat $0, $LOADED_FEATURES and $LOAD_PATH so Rack::Reloader#rotation sees loaded files"
status: draft
updated: 2026-10-19
rfc: "0193-small-gem-ports-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rack::Reloader::Stat#rotation` (`vendor/rack/v3.1.14/lib/rack/reloader.rb:61-75`) walks `[$0, *$LOADED_FEATURES]` against `['./', *$LOAD_PATH]`. trails#9071 ported it reading those through ruby-compat `rbGvGet("$0")`, `rbGvGet("$LOADED_FEATURES")`, `rbGvGet("$LOAD_PATH")` — but nothing in trails seats them, so outside its trails test (which seats them by hand) the reloader rotates nothing: `$0` is `nil`, and the two lists splat empty.

## Converged shape

ruby-compat seats `$0` (the entry script, `rb_progname`, `vendor/ruby/v3.3.11/ruby.c`) and maintains `$LOADED_FEATURES` / `$LOAD_PATH` (`vendor/ruby/v3.3.11/load.c`, `get_loaded_features` / `rb_get_load_path`) — appending each file `rbFLoad` / the trails `require` path loads — so `Rack::Reloader` sees the application's loaded files as Ruby's does.

## Acceptance criteria

- `rbGvGet("$LOADED_FEATURES")` lists files loaded through ruby-compat's load path; `$0` names the entry script.
- A `Rack::Reloader` with no hand-seated globals reloads a changed loaded file (trails test).
