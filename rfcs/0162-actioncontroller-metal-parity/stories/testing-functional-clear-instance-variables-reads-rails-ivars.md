---
title: "Testing::Functional#clear_instance_variables_between_requests and #recycle! read and write the ivars Rails does"
status: draft
updated: 2026-10-07
rfc: "0162-actioncontroller-metal-parity"
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

Seen while trails#8632 turned `ActionController::Testing` and `Testing::Functional` into `Module`s. The two `Functional` bodies were left as they were, and neither reads the ivars Rails reads.

`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/testing.rb:9-22`:

```ruby
def clear_instance_variables_between_requests
  if defined?(@_ivars)
    new_ivars = instance_variables - @_ivars
    new_ivars.each { |ivar| remove_instance_variable(ivar) }
  end

  @_ivars = instance_variables
end

def recycle!
  @_url_options = nil
  self.formats = nil
  self.params = nil
end
```

`packages/actionpack/src/action-controller/metal/testing.ts`:

- `clearInstanceVariablesBetweenRequests` tests `Object.hasOwn(this, "_ivars")`, lists `Object.getOwnPropertyNames(this)`, filters with `includes`, and removes with `delete this[ivar]`. Rails' calls are `defined?(@_ivars)`, `instance_variables`, `Array#-` and `remove_instance_variable`. ruby-compat has `rbObjIvarDefined` and `rbObjInstanceVariables` (`packages/ruby-compat/src/object.ts`); check whether `remove_instance_variable` (`vendor/ruby/v3.3.11/object.c`, `rb_obj_remove_instance_variable`) is ported there, and port it if not.
- Own property names are not the ivar set: a declared ivar seated through `rbDeclareIvar` and an own accessor both differ from what `instance_variables` answers.
- `recycleBang` assigns `this._urlOptions = null`, `this.formats = null` and `this.params = null` on a `Record<string, unknown>` receiver. Rails assigns the ivar `@_url_options` and calls the `formats=` and `params=` writers. Confirm that each of the two property writes reaches the writer Rails calls (`action_controller/metal/rendering.rb` / `abstract_controller/rendering.rb` for `formats=`, `action_controller/metal.rb:219-221` for `params=`), and type the receiver as the controller instead of a bare record.

## Acceptance criteria

- `clearInstanceVariablesBetweenRequests` is written with `rbObjIvarDefined(this, "@_ivars")`, `rbObjInstanceVariables(this)`, ruby-compat's array difference and ruby-compat's `remove_instance_variable`, in Rails' order, and seats `@_ivars` through `rbObjIvarSet`.
- `recycleBang` seats `@_url_options` as an ivar and calls the `formats=` / `params=` writers Rails calls.
- `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green with no new baseline row, and `controller/test-case.test.ts` passes.
