---
title: "Module#include drops a class module's accessors where include() keeps them"
status: closed
updated: 2026-10-23
rfc: "0154-ruby-compat-surfaced-deviations"
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
closed-reason: "Superseded by RFC 0197: the gap is in Module#include (the ruby-compat Module class), which 0197 retires in favour of plain-object and class modules (delete-ruby-compat-module-class-final). The surviving accessor-halves gap on the plain-object path is plain-module-include-merges-accessor-halves."
---

## Context

trails#8577 taught `Module#include` (`packages/ruby-compat/src/include.ts`) to
take a TS class module: it copies the class prototype's function-valued
members into the including module's carrier. The free `include()` in the same
file handles a class module differently: it copies every prototype descriptor,
accessors included, and merges accessor halves. So a class helper module with
a getter loses the getter when it reaches a controller's helpers module through
`helper(KlassHelper)`
(`vendor/rails/v8.0.2/actionpack/lib/abstract_controller/helpers.rb:200-207`),
though it keeps it when included into a class directly.

## Acceptance criteria

- `Module#include` of a class module carries accessor descriptors the way the
  free `include()` does, through one shared code path.
- A test includes a class module with a getter into a `Module`, includes that
  into a class, and reads the getter.
