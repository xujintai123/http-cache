const fs = require("fs");
const path = require("path");

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
