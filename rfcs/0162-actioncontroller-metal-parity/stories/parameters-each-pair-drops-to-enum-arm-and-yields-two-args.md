---
title: "Parameters#each_pair drops the to_enum arm, bypasses @parameters.each_pair and yields two args"
status: ready
updated: 2026-10-07
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionController::Parameters#each_pair`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/strong_parameters.rb:402-409`):

    def each_pair(&block)
      return to_enum(__callee__) unless block_given?
      @parameters.each_pair do |key, value|
        yield [key, convert_hashes_to_parameters(key, value)]
      end

      self
    end
    alias_method :each, :each_pair

trails#8584 moved the body onto `eachPair` and made `each` the alias
(`packages/actionpack/src/action-controller/metal/strong-parameters.ts`,
`eachPair`), but left the body as it was:

- No `to_enum(__callee__)` arm: a block-less call is a `TypeError` on `fn`.
  `__callee__` matters because `each` and `each_pair` are one function, so the
  enumerator must name the alias it was called through.
- It iterates `Object.entries(this._data)` where Rails calls
  `@parameters.each_pair`; the sibling `eachValue` already goes through
  ruby-compat's `eachPair`.
- It calls `fn(k, v)` where Rails yields one `[key, value]` Array.

`each_value` (`:414-421`) and `each_key` (delegated, `:250`) have the same
missing `to_enum` arm.

The enumerator itself is `port-a-minimal-enumerator-for-to-enum-arms`; this
story depends on it for the block-less arm.

## Converged shape

`eachPair` returns `toEnum(...)` when no block is given, iterates through
ruby-compat's `eachPair(this._data, ...)`, and yields `[key, value]`, with
`each` still the same function object.

## Acceptance criteria

- [ ] `eachPair` has Rails' three arms in Rails' order.
- [ ] `parameters.each` / `eachPair` with no block answer an enumerator, as
      `test "each without a block returns an enumerator"` and
      `test "each_pair without a block returns an enumerator"`
      (`actionpack/test/controller/parameters/accessors_test.rb`) assert.
- [ ] `Parameters.prototype.each === Parameters.prototype.eachPair` still holds.
