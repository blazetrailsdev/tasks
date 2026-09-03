---
title: "Collapse ActionController::TestCase's hand-rolled multipart encoder onto Rack::Test::Utils"
status: draft
updated: 2026-09-03
rfc: "0000-rack-test-gem-port"
cluster: null
packages: []
deps: ["port-rack-test-utils"]
deps-rfc: []
est-loc: 300
priority: 9
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActionController::TestCase::ENCODER`
(`vendor/rails/actionpack/lib/action_controller/test_case.rb:151-176`) is an
anonymous class that does exactly three things:

```ruby
ENCODER = Class.new do
  include Rack::Test::Utils
  def should_multipart?(params) ... end   # :155-169, comment: "FIXME: lifted from Rack-Test"
  public :build_multipart                 # :171
  def content_type
    "multipart/form-data; boundary=#{Rack::Test::MULTIPART_BOUNDARY}"   # :174
  end
end.new
```

trails reimplements all of it, because there was no gem in the tree to include:

- `packages/actionpack/src/action-controller/test-case.ts:671-696`
  `buildMultipartBody`, tagged `@internal Mirrors Rails
  Rack::Test::Utils.build_multipart`. It hand-rolls the part encoding **and
  invents its own boundary**: `:672` is `const boundary = "AaB03x"`, where
  Rails emits `Rack::Test::MULTIPART_BOUNDARY` =
  `'----------XnJLe9ZIbbGUYtzPQJ16u1'` (`vendor/rack-test/lib/rack/test.rb:36`).
  So a trails controller test posts a different boundary on the wire than every
  Rails controller test.
- `test-case.ts:698-708` `shouldMultipart`, a second recursion over
  `UploadedFile` values.
- Called from `test-case.ts:580`, the one call site.

Both are unmatched public-ish names in a `parity:api`-measured tree with no
`.rb` behind them. `port-rack-test-utils` puts the real `build_multipart` and
the real constant in the tree; this story deletes the stand-ins and points the
encoder at them.

`should_multipart?` stays in actionpack — Rails defines it there, not in the
gem (the "lifted from Rack-Test" FIXME is upstream's, and porting it as if it
had converged would be drift). Only `build_multipart` and the boundary come
from the gem.

## Acceptance criteria

- `buildMultipartBody` is deleted from
  `packages/actionpack/src/action-controller/test-case.ts`; the encoder calls
  `buildMultipart` from `@blazetrails/rack-test`.
- The boundary comes from `MULTIPART_BOUNDARY`; `grep -rn 'AaB03x' packages/`
  returns 0.
- `shouldMultipart` remains in `test-case.ts`, matching `test_case.rb:155-169`.
- `packages/actionpack`'s `parity:api:extra` novel count drops by the deleted
  names; `parity:api` / `parity:test` deltas non-negative for actioncontroller.
- Existing actionpack multipart tests pass with the new boundary; any test that
  asserted `AaB03x` is corrected to the Rails value — that is a value fix, not a
  test rename.
