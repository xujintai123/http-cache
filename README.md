## 启动

```bash
node server.js
```

## 访问

1. 强缓存demo:

`localhost:3333/cache1`

2. 协商缓存demo:

`localhost:3333/cache2`
# 参考 https://juejin.cn/post/7063768338844876814


# 浏览器缓存

[代码传送门](https://github.com/mkolp11597753/http-cache)

### 概念

#### 一、强缓存

**在向服务端发送请求之前**，浏览器会根据请求头部携带的`Cache-Control`或者`Expires`来尝试命中强缓存，如果命中则直接返回资源，不会再向服务器发送请求

强缓存的原理是为资源文件设置一个时间，只要没超过这个时间，都使用缓存，不管服务器文件是否更新。

- Expires：HTTP/1.0 表示资源过期时间，缺点是采用的是本机时间，容易被篡改（绝对时间）
- Cache-Control：HTTP/1.1 为了解决Expires时间不准的问题（相对时间）

**Cache-Control**

- `Cache-Control: max-age=300`  表示服务器再次获取该资源时没有超过300s 则命中缓存
- `Cache-Control: no-cache` 表示每次使用缓存之前都要交给服务器验证（走协商缓存）
- `Cache-Control: no-store` 表示不使用缓存 
- `Cache-Control: private` 代理服务器不能缓存资源，只有客户端本地可以缓存
- `Cache-Control: public` 大家都可以缓存这个资源

> tips：客户端可以在头部配置 no-cache 和 no-store 来跳过强缓存



#### 二、协商缓存

如果服务器携带如下响应头，则会进行协商缓存，协商缓存需要发送请求，其原理就是**客户端会发送请求询问服务器本地的文件是否过期**，如果服务端说没过期，你可以使用本地缓存，则客户端会使用缓存，否则服务端会重新发送资源文件给客户端。

响应头

- **ETag** 根据文件内容生成的代码
- **Last-Modified** 服务器的文件最后修改时间

请求头

- **If-None-Match** 对应ETag，第一次请求后，客户端会储存 ETag 并在下一次请求时赋给`If-None-Match`
- **If-Modified-Since** 对应Last-Modified，第一次请求后，客户端会储存 Last-Modified 并在下一次请求时赋给`If-Modified-Since`



### 实战

1. ##### 目录结构

   ```
   |-- http-cache
   |---- static     静态资源文件夹
   |-------- index.html  html
   |-------- queue.png   测试图片
   |---- server.js  服务器入口文件
   |---- utils.js   文件读取之类的工具类
   ```

   

![image-20220212171039609](/Users/lz/Library/Application Support/typora-user-images/image-20220212171039609.png)

2. ##### 直接使用http来启动一个服务

```js
// server.js
const http = require("http");

const server = http.createServer((req, res) => {
  // 测试一下
  res.statusCode=200;
  res.end("Hello World");
});

server.listen(3333, () => {
  console.log("server listening on 3333");
});
```

服务器的启动很简单就不赘述了，服务启动后在浏览器访问`localhost:3333`就可以看到效果

![image-20220212171926091](/Users/lz/Library/Application Support/typora-user-images/image-20220212171926091.png)

##### 3. html

非常简单，展示 Hello World 以及一张图片。

```html
<html lang="en">
  <head>
    <title>Document</title>
  </head>
  <body>
    <div>Hello World</div>
    <img src="./queue.png" width="200" />
  </body>
</html>
```



##### 4.  工具类

对服务器来说，读取文件的操作是必不可少的，协商缓存还需要获取文件的修改时间，我们简单写几个工具函数

工具函数写的很粗糙，但是对测试来说够用了。

```js
// utils.js
const fs = require("fs");
const path = require("path");

// 读取文件
exports.readFileSync = function readFileSync(filePath, options) {
  const absPath = path.resolve(__dirname, "./static", normalizePath(filePath));

  try {
    fs.accessSync(absPath, fs.constants.W_OK);

    return fs.readFileSync(absPath, options);
  } catch (err) {
    console.log(`${absPath} 文件访问受限！`, err);
    return;
  }
};

// 使用 fs.statSync 获取文件的stat，stat包含了一系列文件修改时间、创建时间等统计信息
exports.getFileStat = function getFileStat(filePath) {
  const absPath = path.resolve(__dirname, "./static", normalizePath(filePath));

  try {
    fs.accessSync(absPath, fs.constants.W_OK);

    return fs.statSync(absPath);
  } catch (err) {
    console.log(`${absPath} 文件访问受限！`, err);
    return;
  }
};

// 处理绝对路径
function normalizePath(path) {
  return path.replace(/^\/+/, "");
}

```

##### 开始测试缓存！

我们来使用两个路由分别模拟`强缓存`和`协商缓存`

- /cache1 强缓存
- /cache2 协商缓存

修改 server.js，为了方便起见，我直接在请求开始就读取了 `index.html`文件内容，免得后面判断里要写重复内容

```js
// server.js
const DEFAULT_PATH = "index.html";

const server = http.createServer((req, res) => {
  // 图方便，在这直接读取了 index.html 文件内容
  const data = readFileSync(DEFAULT_PATH, { encoding: "utf-8" });
  res.setHeader("content-type", "text/html; charset=utf-8");

  console.log("请求资源：", req.url);

  // 路由 cache1 做强缓存处理
  if (req.url === "/cache1") {

  }

  // 路由 cache2 做协商缓存处理
  else if (req.url === "/cache2") {

  }

  // 其他资源，图片等 使用强缓存
  else {

  }
});
```



1. **强缓存逻辑**

以`Cache-Control` 为例，对`index.html`做强缓存处理

```js
// 路由 cache1 做强缓存处理
if (req.url === "/cache1") {
	res.setHeader("Cache-Control", "max-age=120");
  res.end(data);
}
```

对图片资源做缓存处理

```js
// 其他资源，图片等 使用强缓存
else {
  res.setHeader("cache-control", "max-age=60");
  res.setHeader("content-type", "image/png");
  res.end(readFileSync(req.url));
}
```



2. **测试 - index.html强缓存失效的原因！**

代码很完美，打开浏览器输入 `localhost:3333/cache1` 来试试看！

结果不对呀，图片确实被缓存了，配置的`Content-Type`生效了，但是 `index.html` 并没有被缓存，明明是相同的配置，为什么两种资源一个有缓存一个没有缓存？

![image-20220212175322839](/Users/lz/Library/Application Support/typora-user-images/image-20220212175322839.png)

点进详情看一看，浏览器为`index.html`资源文件配置了`Cache-Control: max-age=0`，但是我并没有在浏览器开启停用缓存的配置。

我做了几次实验发现，浏览器在加载url栏输入地址的根资源时，会默认配置`Cache-Control: max-age=0`避免对根资源文件使用强缓存，当你的url栏输入了 `http://localhost:3333/cache1`时，这个 `cache1` 就是根资源文件。

你也可以试试直接输入 `http://localhost:3333/queue.png`，会导致图片缓存失效。

![image-20220212174219844](/Users/lz/Library/Application Support/typora-user-images/image-20220212174219844.png)

3. **协商缓存逻辑**

使用`Last-Modified`配置为例，在访问资源的时候，客户端发起的请求是由浏览器代理的，所以我们不需要设置客户端请求的头部，都交给浏览器来就行了。

如果要开启协商缓存，服务器只需要在响应头加上 `Last-Modified` 即可，浏览器收到之后会自动配置请求头`if-modified-since`，要注意客户端第一次请求的时候，请求头是不会`if-modified-since`的，只有第二次之后会有，看代码实现：

 ```js
//路由 cache2 做协商缓存处理
else if (req.url === "/cache2") {
  // 配置 "Cache-Control: no-cache" 关闭强缓存，需要浏览器发送请求来进行协商缓存
  res.setHeader("Cache-Control", "no-cache");
  
  // 拿到客户端的 "if-modified-since" 头部配置
  const ifModifiedSince = req.headers["if-modified-since"];
  const stat = getFileStat(DEFAULT_PATH);
  const mtimeStr = stat.mtime.toISOString();
  console.log("文件修改时间 ", stat.mtime);

  if (ifModifiedSince) {
    console.log("客户端传入时间 ", ifModifiedSince);
    res.setHeader("Last-Modified", mtimeStr);

    // 资源失效了 返回新的资源，状态码 200，重新返回新的资源文件给浏览器
    if (mtimeStr > ifModifiedSince) {
      res.statusCode = 200;
      res.end(data);
    } else {
      // 资源没失效，浏览器可以使用本地资源，状态码 304，返回空资源就可以了
      res.statusCode = 304;
      res.end();
    }
  } else {
		// 第一次访问该资源
    res.setHeader("Last-Modified", mtimeStr);
    res.end(data);
  }
}
 ```

4. **测试协商缓存是否生效**

   访问 `localhost:3333/cache2`，刷新一次，就能看到`cache2`资源返回状态码是304

   ![image-20220212180627986](/Users/lz/Library/Application Support/typora-user-images/image-20220212180627986.png)

看这段代码，状态304时，服务器`res.end()`返回了空资源，浏览器却正确的获取到了资源，说明协商缓存生效！

```js
// 资源没失效，浏览器可以使用本地资源，状态码 304，返回空资源就可以了
res.statusCode = 304;
res.end();
```



代码贴在文章顶部了，代码本身也不复杂，感兴趣的可以拷贝下来自己添加响应头来做其他测试。

