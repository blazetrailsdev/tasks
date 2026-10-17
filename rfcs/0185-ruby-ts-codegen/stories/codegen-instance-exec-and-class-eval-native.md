---
title: "Generated instance_exec, class_eval and block super go native"
status: ready
updated: 2026-10-17
rfc: "0185-ruby-ts-codegen"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby's `instance_exec`, `instance_eval`, `class_eval` and `super` from a block lower in the codegen generator to generated-runtime shim helpers: `jsInstanceExec`, `jsInstanceEval`, `jsClassEval` and `rbCallSuper` (`scripts/codegen/src/runtime-shim.ts`). The repo owner ruled that no generated runtime ships.

The Ruby sources are:

- `BasicObject#instance_exec` is `rb_obj_instance_exec` (`vendor/ruby/v3.3.11/vm_eval.c:2089`);
- `Module#class_eval` / `module_eval` is `rb_mod_module_eval` (`vm_eval.c:2128`); ruby-compat's `Module#moduleEval` (`include.ts`) covers a ruby-compat `Module` but not a JS class;
- `super` from inside a block is `rb_call_super` (`vm_eval.c:366`); ruby-compat's `superMethod` resolves the next method in the chain.

With a block (not a string), `instance_exec` is natively `fn.call(obj, ...args)` on a non-arrow function. The generator should emit that, and give `class_eval` with a block the existing `moduleEval` or `fn.call(klass)`.

## Acceptance criteria

- [ ] The generator emits `fn.call(obj, ...args)` for block-form `instance_exec` / `instance_eval`, the existing `moduleEval` / `fn.call(klass)` for block-form `class_eval`, and the existing `superMethod` for `super` in a block.
- [ ] Anything left that needs a new ruby-compat port gets one, with the `vm_eval.c` citation and tests.
- [ ] `jsInstanceExec`, `jsInstanceEval`, `jsClassEval` and `rbCallSuper` are deleted from `runtime-shim.ts`.
