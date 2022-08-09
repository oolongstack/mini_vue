// 开发 esbuild  生产 rollup
const args = require("minimist")(process.argv.slice(2)); // 解析命令行参数
const { resolve } = require("path");
const { build } = require("esbuild");
const target = args._[0] || "reactivity"; // 默认打包 reactivity模块
const format = args.f || "global"; // 默认打包模式是global

// 开发环境只打包某一个
const pkg = require(resolve(__dirname, `../packages/${target}/package.json`));
// 判断打包类型
const outputFormat = format.startsWith("global")
  ? "iife"
  : format === "cjs"
  ? "cjs"
  : "esm";
// 打包后的文件
const outfile = resolve(
  __dirname,
  `../packages/${target}/dist/${target}.${format}.js`
);

build({
  entryPoints: [resolve(__dirname, `../packages/${target}/src/index.ts`)],
  outfile,
  bundle: true,
  sourcemap: true,
  format: outputFormat,
  globalName: pkg.buildOptions?.name,
  platform: format === "cjs" ? "node" : "browser",
  watch: {
    onRebuild(error) {
      if (!error) console.log("rebuild~~~~~~");
    },
  },
}).then(() => {
  console.log("watching~~~~~~");
});
