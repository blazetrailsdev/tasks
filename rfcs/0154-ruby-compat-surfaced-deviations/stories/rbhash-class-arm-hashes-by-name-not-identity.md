---
title: "rbHash hashes a class by its name; Ruby's Class#hash is identity (rb_obj_hash)"
status: draft
updated: 2026-09-25
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`rbHash` (`packages/ruby-compat/src/rb-hash.ts`, `case "function"`) hashes a class object as `stringHash(`class:${value.name}`)`. Ruby's `Class#hash` is `Kernel#hash`, the identity hash `rb_obj_hash` (`vendor/ruby/hash.c:344`). Two distinct classes with the same name, including every anonymous `class extends Base {}` (name `""`), therefore get the same hash in trails and different hashes in Ruby.

trails#8082 made `ActiveRecord::Core#hash` `rbHash(this.constructor) ^ rbHash(id)`, the port of `self.class.hash ^ id.hash` (`vendor/rails/activerecord/lib/active_record/core.rb:641-649`). So records of two same-named classes with the same id now hash alike. `eql?` still disambiguates them, so the answers stay correct, but the result is not Ruby's.

`rbObjHash` is now exported from the same file.

## Acceptance criteria

- `rbHash`'s class arm returns `rbObjHash(value)`, the identity hash, as `rb_obj_hash` does.
- A trails test: two distinct anonymous classes hash differently, and one class always hashes the same.
- Every ported `hash` body that folds a class (`rbHash(Column)`, `rbHash(TypeMetadata)`, arel node hashes) stays green.
