const http = require("http");
const { readFileSync, getFileStat } = require("./utils");

const DEFAULT_PATH = "index.html";

const server = http.createServer((req, res) => {
  const data = readFileSync(DEFAULT_PATH, { encoding: "utf-8" });
  res.setHeader("content-type", "text/html; charset=utf-8");

  console.log("请求资源：", req.url);

  // 强缓存
  if (req.url === "/cache1") {
    // 浏览器会阻止 index.html 的强缓存，会强行设置头部为 cache-control: max-age=0，其他资源不会
    res.setHeader("Cache-Control", "max-age=120");
    res.end(data);
  }

  // 协商缓存
  else if (req.url === "/cache2") {
    res.setHeader("Cache-Control", "no-cache");
    const ifModifiedSince = req.headers["if-modified-since"];
    const stat = getFileStat(DEFAULT_PATH);
    const mtimeStr = stat.mtime.toISOString();
    console.log("文件修改时间 ", mtimeStr);

    if (ifModifiedSince) {
      console.log("客户端传入时间 ", ifModifiedSince);
      res.setHeader("Last-Modified", mtimeStr);

      // 资源失效了 返回新的资源
      if (mtimeStr > ifModifiedSince) {
        res.statusCode = 200;
        res.end(data);
      } else {
        res.statusCode = 304;
        res.end();
      }
    } else {
      res.setHeader("Last-Modified", mtimeStr);
      res.end(data);
    }
  }

  // 其他资源，图片等 使用强缓存
  else {
    res.setHeader("cache-control", "max-age=60");
    res.setHeader("content-type", "image/png");
    res.end(readFileSync(req.url));
  }
});

server.listen(3333, () => {
  console.log("server listening on 3333");
});
