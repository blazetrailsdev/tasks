---
title: "actionview: content_for converges onto capture_helper.rb's arms"
status: draft
updated: 2026-10-05
rfc: "0176-actionview-helpers"
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

Surfaced by trails#8539. Once the arms extractor stopped counting `contentFor`'s leading block
rebinding guard, `pnpm parity:api:arms:report --package=actionview --direction=invented` lists
`actionview/helpers/capture-helper.ts#contentFor` at `+if +if +if` (and `+and +and` in the
short-circuit projection). The pair was hidden before only because splicing Ruby's `capture` helper
in made the arm counts match by coincidence.

Rails (`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/capture_helper.rb:172-186`):

```ruby
def content_for(name, content = nil, options = {}, &block)
  if content || block_given?
    if block_given?
      options = content if content
      content = capture(&block)
    end
    if content
      options[:flush] ? @view_flow.set(name, content) : @view_flow.append(name, content)
    end
    nil
  else
    @view_flow.get(name).presence
  end
end
```

trails (`packages/actionview/src/helpers/capture-helper.ts:37-72`) deviates in the body:

- `options` defaults to `undefined`, not `{}`, and the body keeps separate `opts` / `body` locals
  where Rails reassigns `options` and `content`.
- `options = content if content` is `if (options === undefined && isPlainOptions(content))`: an
  extra `options === undefined` test and an invented `isPlainOptions` helper Rails does not have.
- `if content` is `body !== undefined && body !== null`, which is not Ruby truthiness (`false`).
- The `else` arm branches on `stored instanceof Promise` and nests two `isPresent(...) ? … : null`
  ternaries where Rails has one `.presence` call.

## Acceptance criteria

- [ ] `contentFor` mirrors `capture_helper.rb:172-186` line for line: Rails' parameter defaults,
      `options` / `content` reassigned in place, the same branches in the same order, `presence`
      for the read arm.
- [ ] `isPlainOptions` is deleted, or the arm it guards is shown to be language-forced and receipted
      at the declaration.
- [ ] Any arm the async `viewFlow.get` forces carries an `@inventedArm` receipt; every other
      invented `if` is gone from `pnpm parity:api:arms:report --package=actionview`.
