---
title: "Parameters#==, #eql?, #inspect and #to_s are not the Rails bodies"
status: ready
updated: 2026-10-06
rfc: "0162-actioncontroller-metal-parity"
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

Three bodies in
`packages/actionpack/src/action-controller/metal/strong-parameters.ts` are not
the Rails bodies in
`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/strong_parameters.rb`:

- `==` (`:301-307`) answers `permitted? == other.permitted? && parameters ==
other.parameters` when `other.respond_to?(:permitted?)`, else `super`.
  `equals` tests `other instanceof Parameters` and returns `false` otherwise,
  and compares through a file-local `deepEqualValue`.
- `eql?` (`:309-313`) is `self.class == other.class && permitted? ==
other.permitted? && parameters.eql?(other.parameters)`. `eql` returns
  `this.equals(other)`, so a subclass instance is `eql` to a `Parameters`.
- `inspect` (`:1055-1057`) interpolates `self.class`, `@parameters` and
  `permitted: @permitted`, always. The port hard-codes `ActionController::Parameters`, renders
  the hash with `JSON.stringify`, and prints `permitted:` only when it is true.
  `to_s` is delegated to `@parameters` (`:250-251`); `toString` is
  `JSON.stringify(this._data)`.

## Acceptance criteria

- [ ] `equals` ports the `respond_to?(:permitted?)` arm with `rbObjRespondTo`
      and compares `parameters` with `rbEqual`; `deepEqualValue` is deleted.
- [ ] `eql` compares the classes and uses `rbEql` on `parameters`.
- [ ] `inspect` renders the class through `rbModName`, the hash through
      `rbInspect` and `permitted:` unconditionally; `toString` is the hash's
      `to_s`.
- [ ] The Rails `inspect` and equality tests
      (`actionpack/test/controller/parameters/accessors_test.rb`,
      `equality_test.rb`) assert Rails' strings verbatim.
