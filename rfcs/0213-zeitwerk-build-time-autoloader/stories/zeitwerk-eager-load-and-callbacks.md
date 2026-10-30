---
title: "Port Zeitwerk eager load, callbacks and seating"
status: draft
updated: 2026-10-30
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: zw-gem
packages: ["zeitwerk"]
deps: ["zeitwerk-setup-walk"]
deps-rfc: []
est-loc: 650
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Sources: `vendor/zeitwerk/v2.7.2/lib/zeitwerk/loader/eager_load.rb`, `loader/callbacks.rb`. RFC 0213 § "Seating". `core_ext/module.rb`'s `const_added` becomes a call the loader makes.

## Acceptance criteria

- `eager_load`, `eager_load_dir`, `eager_load_namespace`, `load_file` are async and otherwise line for line.
- A file's constant is its named export; a miss raises "expected file … to define constant …".
- Implicit namespaces are plain-object modules; an explicit namespace is seated before its children.
- `on_load` and `on_setup` run as in Ruby.
- `test_eager_load.rb`, `test_on_load.rb`, `test_explicit_namespace.rb` and `test_autovivification.rb` are ported.
