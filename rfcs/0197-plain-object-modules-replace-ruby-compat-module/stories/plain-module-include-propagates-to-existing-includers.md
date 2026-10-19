---
title: "ruby-compat: an include into a plain module reaches classes that already include it"
status: draft
updated: 2026-10-19
rfc: "0197-plain-object-modules-replace-ruby-compat-module"
cluster: null
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#9050 added a record of module-includes-module for plain-object modules
(`packages/ruby-compat/src/include.ts`, `moduleIncludesKey`, read by
`rbModAppendFeatures` and `appendPlainFeatures`). The record is read once, when
the outer module is appended to a class. So `include(outer, inner)` made after
a class has already included `outer` never reaches that class.

Ruby 3.0+ does propagate it. `rb_include_module`
(`vendor/ruby/v3.3.11/class.c:1179-1215`) walks the module's subclass list
(`rb_class_foreach_subclass` over iclasses) and includes the new module into
every class that already includes `outer`.

## Acceptance criteria

- An `include(outer, inner)` after `outer` has been included into a class makes
  `inner`'s methods and `isModuleIncluded(Klass, inner)` reach that class. There
  is no carrier and no re-splice: the include writes to the recorded includers,
  in the same way as RFC 0197's "methods defined after inclusion" sites.
- A ruby-compat test mirrors Ruby's behaviour: `module M; end; class C; include M; end; module N; def n; end; end; M.include N; C.new.n`.
