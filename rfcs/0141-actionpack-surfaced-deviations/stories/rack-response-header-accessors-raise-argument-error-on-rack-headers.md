---
title: "Rack::Response#has_header? / get_header / set_header / delete_header raise ArgumentError unless String and act on a Rack::Headers"
status: ready
updated: 2026-10-19
rfc: "0141-actionpack-surfaced-deviations"
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

`Rack::Response`'s four header accessors each open with the same guard and
then act on `@headers`, a `Rack::Headers`
(`vendor/rack/v3.1.14/lib/rack/response.rb:160-175`):

```ruby
def has_header?(key)
  raise ArgumentError unless key.is_a?(String)
  @headers.key?(key)
end
def get_header(key)
  raise ArgumentError unless key.is_a?(String)
  @headers[key]
end
def set_header(key, value)
  raise ArgumentError unless key.is_a?(String)
  @headers[key] = value
end
def delete_header(key)
  raise ArgumentError unless key.is_a?(String)
  @headers.delete key
end
```

The port (`packages/rack/src/response.ts:375-398`) deviates three ways:

- The guard is `key === null || key === undefined`, so a Symbol-shaped or
  numeric key passes where Rack raises.
- It throws `new Error("ArgumentError: key cannot be nil")`: a bare `Error`
  with an invented message, where Rack raises `ArgumentError` with no message.
- `headers` is a plain `Record<string, any>` lowercased by hand with a local
  `downcaseKey`, where Rack holds a `Rack::Headers` that downcases in its own
  `[]` / `[]=` / `delete` / `key?`. `packages/rack/src/headers.ts` already
  ports that class. `deleteHeader` also adds a `?? null` and a separate read
  that `@headers.delete key` does not have.

Found while reviewing the native-hash-form credit for `delete_header`
(trails#8775); its `delete` baseline row in
`scripts/api-compare/call-mismatches-exclude/rack/response.json` is still open.

## Acceptance criteria

- [ ] Each of the four accessors raises ruby-compat's `ArgumentError`, with no
      message, unless `typeof key === "string"`.
- [ ] Each body is the one call Rack makes on `this.headers`
      (`hasKey` / `get` / `set` / `delete` of `Headers`), with no local
      `downcaseKey` and no `?? null`.
- [ ] Decide whether `Response#headers` becomes a `Headers` in this story or a
      dependency story; if it is split, record the dep with `tasks set-deps`.
- [ ] The `delete_header` row in `call-mismatches-exclude/rack/response.json`
      is deleted by hand and the mark tightened.
- [ ] Rack's `spec_response.rb` header-accessor examples are ported or already
      pass unchanged.
