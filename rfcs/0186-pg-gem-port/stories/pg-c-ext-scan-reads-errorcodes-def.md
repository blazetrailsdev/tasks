---
title: "pg C extension scan reads errorcodes.def's error classes"
status: draft
updated: 2026-11-21
rfc: "0186-pg-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`PG::FeatureNotSupported` and the other SQLSTATE classes are built from `vendor/pg/v1.5.9/ext/errorcodes.def`, through `register_error_class( "0A000", klass = define_error_class( "FeatureNotSupported", NULL ) )`. `define_error_class` (`ext/pg_errors.c:20-26`) calls `rb_define_class_under( rb_mPG, name, baseclass )` with a computed name, and defaults the base to `rb_eServerError`. The trails#10504 C scan reads only literal names in `*.c`. So `exceptions.ts::FeatureNotSupported` stays in `constant-residue.json`'s pg `excluded` list with a `@noRailsEquivalent PERMANENT` receipt.

## Acceptance criteria

- [ ] The C scan reads `define_error_class( "Name", parent )` from `errorcodes.def`, with a `NULL` parent meaning `PG::ServerError`, and records the classes under `exceptions.rb`.
- [ ] The receipt on `FeatureNotSupported` is removed, and its `excluded` row becomes a class path.
