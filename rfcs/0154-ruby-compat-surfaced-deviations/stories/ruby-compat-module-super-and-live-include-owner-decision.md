---
title: "Owner ruling: module super, live include and plain-module naming without ruby-compat Module"
status: closed
updated: 2026-10-19
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: ["ruby-compat"]
deps: ["remove-ruby-compat-module-class"]
deps-rfc: []
est-loc: 0
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Answered by RFC 0197 (active 2026-10-19): module super is inlined per RFC 0188 with @inlinedFrom widened to methods; live-include sites and plain-module naming each have a 0197 story."
---

## Context

Removing ruby-compat's `Module` class (`packages/ruby-compat/src/include.ts`,
RFC 0154) leaves three Ruby behaviours with no carrier-free shape. The repo
owner ruled out any carrier-like replacement, so each needs a ruling before
the package stories that hit it can finish.

1. **`super` from a module method.** Ruby resumes the method search at the
   iclass the module contributed (`vm_search_super_method`,
   `vendor/ruby/v3.3.11/vm_insnhelper.c:4648`; `Method#super_method`,
   `vendor/ruby/v3.3.11/proc.c:3391`). Plain-object `include()` copies the
   methods onto the class prototype, so there is no next link. About 133
   non-test `Module#superMethod` calls depend on it: activerecord 76
   (`packages/activerecord/src/core.ts:840` `SuperMethods`), actionpack 29,
   actionview 13, activemodel 11 (`packages/activemodel/src/api.ts:30`,
   `attributes.ts:71`, `dirty.ts:207`, `validations.ts:403`), trailties 2
   (`packages/trailties/src/test-help.ts:48,57`), activesupport 1
   (`packages/activesupport/src/message-pack/cache-serializer.ts:9`) and
   did-you-mean 1 (`packages/did-you-mean/src/core-ext/name-error.ts:21`).
2. **Methods defined after inclusion.** Ruby's include shares the module's
   method table (`rb_include_module`, `vendor/ruby/v3.3.11/class.c:1179`), so a
   later `define_method` is visible to includers. Sites:
   - `packages/actionpack/src/abstract-controller/helpers.ts:164,192`
     (`_helpers` / `HelperMethods`, Rails
     `vendor/rails/v8.0.2/actionpack/lib/abstract_controller/helpers.rb`)
   - `packages/activesupport/src/code-generator.ts:23` (`MethodSet` caches)
   - `packages/activesupport/src/current-attributes.ts:229` and
     `packages/activemodel/src/attribute-methods.ts:360`
     (`generated_attribute_methods`)
   - `LazyRouteSet#generateUrlHelpers`' splice (CLAUDE.md § "Ruby protocol
     methods…")
3. **Naming a plain-object module.** `rb_mod_const_set`
   (`vendor/ruby/v3.3.11/object.c:2545`, `variable.c:3648-3668`) names a module
   bound to a constant. `rbModConstSet` paths only a `Module` or a class, so a
   plain-object namespace (`packages/ruby-compat/src/marshal.trails.test.ts:42`
   `Geo::Kind`, `psych-to-yaml.test.ts:12` `YAMLSpecs`) gets no classpath, and
   Marshal and YAML can't name it.

## Acceptance criteria

- The repo owner rules on each of the three, and the ruling is recorded in
  CLAUDE.md (or each one is closed `PERMANENT:` with its sites listed).
- The package stories it blocks are unblocked or rescoped to match.
