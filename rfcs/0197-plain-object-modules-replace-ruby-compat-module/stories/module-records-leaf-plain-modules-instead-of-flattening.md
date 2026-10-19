---
title: "A Module records every included plain module instead of copying it onto its carrier"
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

`appendPlainFeatures` in `packages/ruby-compat/src/include.ts` still copies the members of a plain module onto a `Module`'s carrier when that plain module includes no modules of its own. trails#9083 records only plain modules that do include modules.

Ruby keeps every included module as its own iclass. `rb_include_module` (`vendor/ruby/v3.3.11/class.c:1179`) and `include_modules_at` (`:1253`) never copy a module's methods into the includer's table. Because of the copying, a later method the `Module` defines can be overwritten, or can overwrite the copied one, depending on order.

In trails#9083, recording every plain module broke three tests in `include.test.ts`:

- "undefMethod stops lookup where removeMethod falls through to the superclass"
- "lets a later include replace an earlier included method, not an own one"
- "installs an ES module namespace's exports as methods, not accessors"

All three read the copied entry back through `Module#instanceMethod` or `#undefMethod`, which look only at the carrier. Ruby's `instance_method` and `undef_method` search the ancestry (`rb_method_entry`, `vm_method.c`).

## Acceptance criteria

- [ ] `appendPlainFeatures` records every plain module (the `recordPlainModule` path) instead of copying it onto the carrier.
- [ ] `Module#instanceMethod` and `#undefMethod` find a method from an included plain module through the module's ancestry, as Ruby does.
- [ ] The three tests above pass, unchanged.
