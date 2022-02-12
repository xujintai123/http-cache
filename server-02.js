const http = require("http");
const { readFileSync, getFileStat } = require("./utils");

const DEFAULT_PATH = "index.html";

const server = http.createServer((req, res) => {
  // 图方便，在这直接读取了 index.html 文件内容
  const data = readFileSync(DEFAULT_PATH, { encoding: "utf-8" });
  res.setHeader("content-type", "text/html; charset=utf-8");

  console.log("请求资源：", req.url);

  // 路由 cache1 做强缓存处理
  if (req.url === "/cache1") {
    res.setHeader("Cache-Control", "max-age=120");
    res.end(data);
  }

  // 路由 cache2 做协商缓存处理
  else if (req.url === "/cache2") {
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
