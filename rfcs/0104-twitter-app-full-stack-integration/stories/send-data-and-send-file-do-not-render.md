---
title: "send_data does not render and send_file reads the file into memory instead of installing the stream"
status: ready
updated: 2026-09-04
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: 30
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `send_data` and `send_file` both end in a render or a response write
(`vendor/rails/actionpack/lib/action_controller/metal/data_streaming.rb`):

```ruby
def send_file(path, options = {})
  raise MissingFile, "Cannot read file #{path}" unless File.file?(path) and File.readable?(path)
  options[:filename] ||= File.basename(path) unless options[:url_based_filename]
  send_file_headers! options
  self.status = options[:status] || 200
  self.content_type = options[:content_type] if options.key?(:content_type)
  response.send_file path
end

def send_data(data, options = {})
  send_file_headers! options
  render options.slice(:status, :content_type).merge(body: data)
end
```

PR #7376 routed both trails methods through `sendFileHeadersBang`, which is the
half that sets Content-Type / Content-Disposition / Content-Transfer-Encoding.
The tail is still bespoke
(`packages/actionpack/src/action-controller/base.ts`):

```ts
this.sendFileHeadersBang(options);
this.body = buf.toString();
this.setHeader("content-length", String(buf.length));
this.markPerformed();
```

So relative to Rails:

- `send_data` does not `render`, so `:status` and `:content_type` in the
  options are ignored, and none of the render pipeline (`_process_options`,
  `_set_vary_header`) runs;
- `send_file` does not `response.send_file path`
  (`action_dispatch/http/response.rb:428-448` installs the file stream so
  `Rack::Sendfile` can serve it via `to_path`); it reads the file into memory
  with `readFileSync` and assigns the string;
- neither raises `ActionController::MissingFile` for an unreadable path;
- `content-length` is set by hand, where Rails leaves it to the response.

Reading the whole file into memory is the sharpest of these: the `to_path`
body that `RackBody` now forwards (`response.rb:512-536`, ported in #7376) is
exactly what this path defeats.

## Converged shape

Both methods become their Rails bodies. `send_file` needs
`Response#send_file` — `sendFile` already exists on trails' Response and
installs the stream — and `MissingFile`. `send_data` needs `render` to accept
`body:` with `status:` / `contentType:`, which it already does.

## Acceptance criteria

- `Base#sendFile` and `#sendData` match `data_streaming.rb` line for line,
  including the `MissingFile` raise and the `options[:filename] ||=` default.
- `send_file` installs the file stream rather than reading the file into a
  string; a `send_file` response's Rack body answers `toPath()`.
- `send_data` honours `status:` and `contentType:` through `render`.
- The hand-set `content-length` goes away with them.
