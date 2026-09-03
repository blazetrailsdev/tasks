---
title: "Response::FileBody is an object literal with a memo and yields the whole file as one chunk"
status: draft
updated: 2026-09-03
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::Response::FileBody` is a real class,
`vendor/rails/actionpack/lib/action_dispatch/http/response.rb:352-371`:

```ruby
class FileBody # :nodoc:
  attr_reader :to_path
  def initialize(path)
    @to_path = path
  end
  def body
    File.binread(to_path)
  end
  def each
    File.open(to_path, "rb") do |file|
      while chunk = file.read(16384)
        yield chunk
      end
    end
  end
end
```

and `send_file` (`response.rb:374-377`) is `commit!` then
`@stream = FileBody.new(path)`.

trails' `Response#sendFile`
(`packages/actionpack/src/action-dispatch/http/response.ts:483-500`) seats an
object literal with a closed-over memo instead of the class, and its `each`
yields the whole file as ONE chunk rather than Ruby's 16384-byte loop — so a
large file is fully resident before the first chunk reaches the client, which
is the opposite of what a streaming body is for.

PR #7455 flipped the read itself onto `File.open(path, "rb")` + `IO#read`, so the
byte semantics already match; the shape does not.

## Acceptance criteria

- `FileBody` is a class in `response.ts` with Rails' `to_path` reader, `body`
  and `each`, and `sendFile` is `commitBang()` then seating `new FileBody(path)`.
- `each` reads in 16384-byte chunks through `File.open(toPath, "rb")` and yields
  each chunk, stopping when `IO#read` answers `null` — Rails' `while chunk =
file.read(16384)`.
- The closed-over `cached` memo is gone; Ruby has no such memo, and `body` and
  `each` each open the file themselves.
