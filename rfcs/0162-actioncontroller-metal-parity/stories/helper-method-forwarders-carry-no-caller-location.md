---
title: "helper_method forwarders are not attributed to the helper_method call site"
status: done
updated: 2026-10-06
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#8593
claim: "2026-10-06T19:03:14Z"
assignee: "marshalling-methods-bodies-are-not-arm-compared"
blocked-by: null
closed-reason: null
---

## Context

Rails' `helper_method`
(`vendor/rails/v8.0.2/actionpack/lib/abstract_controller/helpers.rb:128-145`)
reads its caller's location and hands it to `class_eval`, so the generated
forwarder's frame is attributed to the line that called `helper_method`:

```ruby
location = caller_locations(1, 1).first
file, line = location.path, location.lineno

methods.each do |method|
  _helpers_for_modification.class_eval <<~ruby_eval.lines.map(&:strip).join(";"), file, line
    def #{method}(...)
      controller.send(:'#{method}', ...)
    end
  ruby_eval
end
```

trails' `helperMethod`
(`packages/actionpack/src/abstract-controller/helpers.ts`) makes neither call.
Its forwarder is a closure defined in `helpers.ts`, so an error raised through a
helper carries a `helpers.ts` frame and no frame at the `helperMethod` call
site.

`test_helper_method_with_error_has_correct_backgrace`
(`vendor/rails/v8.0.2/actionpack/test/controller/helper_test.rb:149-157`) asserts
exactly that frame. It is ported in
`packages/actionpack/src/action-controller/controller/helper.test.ts` as an
`it.skip` naming this story.

A V8 frame takes its file and line from the script that compiled the function.
The candidate mechanism is the one `class_eval(string, file, line)` itself is:
compile the forwarder from source with a `//# sourceURL=<file>` and `line - 1`
leading newlines. `excBacktraceLocations` / `rbFCaller`
(`packages/ruby-compat/src/backtrace-location.ts`) already read V8 frames for
the `caller_locations` half.

Sibling: `helper-method-forwarders-dispatch-through-send` converges the
forwarder body's arms; this story is only the location.

## Acceptance criteria

- `helperMethod` reads `caller_locations(1, 1).first` and the generated
  forwarder's frame reports that path and line.
- "helper method with error has correct backgrace" in
  `controller/helper.test.ts` is un-skipped and green.
