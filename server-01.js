const http = require("http");

const DEFAULT_PATH = "index.html";

const server = http.createServer((req, res) => {
  // 测试一下
  res.statusCode = 200;
  res.end("Hello World");
});

server.listen(3333, () => {
  console.log("server listening on 3333");
});
