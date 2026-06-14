$root = "D:\crypto-wallet"
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8123/")
try {
  $listener.Start()
  "listening on 8123" | Out-File -FilePath "$root\_serve.log" -Encoding ascii
} catch {
  $_.Exception.Message | Out-File -FilePath "$root\_serve.log" -Encoding ascii
  exit 1
}
$types = @{ ".html"="text/html; charset=utf-8"; ".js"="text/javascript"; ".css"="text/css"; ".json"="application/json"; ".svg"="image/svg+xml"; ".png"="image/png"; ".jpg"="image/jpeg"; ".ico"="image/x-icon" }
while ($listener.IsListening) {
  try {
    $ctx = $listener.GetContext()
    $p = $ctx.Request.Url.LocalPath
    if ($p -eq "/" -or $p -eq "") { $p = "/index.html" }
    $fp = Join-Path $root ($p.TrimStart("/").Replace("/", "\"))
    if (Test-Path $fp -PathType Leaf) {
      $bytes = [System.IO.File]::ReadAllBytes($fp)
      $ext = [System.IO.Path]::GetExtension($fp).ToLower()
      if ($types.ContainsKey($ext)) { $ctx.Response.ContentType = $types[$ext] }
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $ctx.Response.StatusCode = 404
    }
    $ctx.Response.Close()
  } catch {}
}
