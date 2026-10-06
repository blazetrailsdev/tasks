---
title: "AbstractController::Helpers' _helpers accessors, helper module include and Caching/Fragments instance halves take Rails' shapes"
status: done
updated: 2026-10-06
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: trails#8574
claim: "2026-10-06T13:09:39Z"
assignee: "abstract-controller-helpers-module-and-caching-instance-halves"
blocked-by: null
closed-reason: null
---

## Context

Left over after `abstract-controller-class-attributes-and-helper-resolution`
converged the class attributes and helper resolution in
`packages/actionpack/src/abstract-controller/helpers.ts`. Rails source:
`vendor/rails/v8.0.2/actionpack/lib/abstract_controller/helpers.rb`.

- **`_helpers` is an overloaded free function.** `_helpers(this)`,
  `_helpers(cls)` and `_helpers(cls, value)` share one body, beside an invented
  `_helpersInstance`. Rails has an instance reader
  (`helpers.rb:28-30`, `self.class._helpers`), a singleton reader installed by
  `redefine_singleton_method(:_helpers)` in the `included` block (`:17-23`,
  `@_helpers || superclass._helpers`) and `attr_writer :_helpers` (`:76`).
  trails keeps `_helpers` as a plain static data property and gets the
  superclass fallback from the static prototype chain, so `klass._helpers = nil`
  (`inherited`, `:70`) has to be spelled as a `delete`.
- **`helper_method` body.** Rails `class_eval`s `def meth(...) = controller.send(:meth, ...)`
  (`:126-143`). trails adds a getter arm and a `TypeError`
  ("helper_method: controller does not respond to ...") Rails does not have.
- **`helper`'s include.** `_helpers_for_modification.include(mod)` (`:196-203`)
  is a hand-rolled Proxy link plus two WeakMap registries
  (`makeIncludeLink`, `recordHelperIncluded`, `isHelperIncluded`), and
  `define_helpers_module` (`:228-236`) keeps its `HelperMethods` const in a
  WeakMap. ruby-compat's `Module` / `include()` / `rbModConstSet` are the
  settled shapes.
- **`ActionController::Helpers::ClassMethods#modules_for_helpers`**
  (`action_controller/metal/helpers.rb:112-115`) is a free function in
  `action-controller/metal/helpers.ts` that calls `Resolution.modulesForHelpers`
  directly where Rails calls `super`, still accepts a JS `Symbol("all")`, and
  reads application helpers from module-level state filled by
  `setApplicationHelpers`, which now `registerConstant`s each helper and never
  unregisters one.
- **`AbstractController::Caching` / `Fragments` instance halves.**
  `action-controller/base.ts` includes the two concerns for their `included`
  hooks but still assigns `viewCacheDependencies`, `cache`,
  `combinedFragmentCacheKey`, `writeFragment`, `readFragment`, `fragmentExist`,
  `expireFragment`, `fragmentCacheKey` and `viewCacheDependency` by hand.
  Rails gets them from `include AbstractController::Caching`
  (`abstract_controller/caching.rb:29-30,48-52`,
  `caching/fragments.rb:38-60`).
- **`Fragments.included`'s `respond_to?(:class_attribute)`**
  (`caching/fragments.rb:25-29`) is ported as `typeof base === "function"`.

## Acceptance criteria

- `_helpers` is an instance reader, a singleton reader/writer installed in
  `Helpers`' `included` hook, and nothing else; `_helpersInstance` is gone.
- `helperMethod` and `helper` have Rails' bodies over ruby-compat's module
  primitives; the WeakMap registries and the Proxy link are gone.
- `ActionController::Helpers::ClassMethods` is an extended module whose
  `modulesForHelpers` reaches the abstract one through `super`, with no JS
  `Symbol` arm.
- `Caching` and `Fragments` carry their instance and `ClassMethods` halves, and
  `action-controller/base.ts` assigns none of them by hand.
- `pnpm parity:api:extra --package abstractcontroller` lists no name from
  `helpers.ts`, `caching.ts` or `caching/fragments.ts`.
