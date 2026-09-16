---
title: "Module#undefMethod blocks ancestor lookup like rb_undef"
status: draft
updated: 2026-09-16
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Module#undefMethod` (`packages/ruby-compat/src/include.ts`) is `delete carrier[name]`, which is `remove_method` semantics. Ruby's `undef_method` (`vendor/ruby/vm_method.c:1973` `rb_mod_undef_method`, via `rb_undef`) installs a VM_METHOD_TYPE_UNDEF entry that STOPS lookup, so a superclass/later ancestor definition is no longer reachable. In trails, after `undefMethod("m")` an instance still finds `m` on the superclass prototype. Surfaced while adding `removeMethod` in trails#7833, which now makes the two indistinguishable.

## Acceptance criteria

- `undefMethod` shadows the name on the carrier (and every includer link) so lookup does not fall through to the superclass, e.g. an own `undefined`-valued non-enumerable property, and `isMethodDefined` answers false for it.
- Raises `NameError` for a name not defined anywhere in the ancestry, as `rb_undef` does.
- ruby-compat test: class with superclass `greet`, include Module defining `greet`, `undefMethod("greet")` → `greet` unreachable; `removeMethod` in the same setup → superclass `greet` reachable.
- Audit existing `undefMethod` callers (`git grep undefMethod`) for ones that meant `removeMethod`.
