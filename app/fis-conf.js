fis.media("dist").match('::packager', {
  spriter: fis.plugin('csssprites')
});


fis.media("dist").match('*.{js,css,png,jpg,gif,less,es6}', {
  useHash: true
});

fis.set('project.md5Connector ', '.');
fis.set('project.ignore', [
  '*.json',
  '*.md',
  '*.markdown',
  'fis-conf.js',
  'demo/**',
  'dist/**',
  'output/**',
  '*.log',
  'node_modules/**'
]);

fis.media("dist").match('*.{js,es6}', {
  optimizer: fis.plugin('uglify-js', {
    // 文档：http://lisperator.net/uglifyjs/compress
    compress: {
      // 去除console的代码
      drop_console: true,
      // discard unreachable code
      dead_code: true,
      unused: true,
      // 变量提前
      hoist_vars: true,
      hoist_funs: true,

      evaluate: true,
      booleans: true,
      conditionals: true
    }
  })
});

fis.media("dist").match('scripts/*.{js,es6}', {
  postprocessor: fis.plugin('jswrapper', {
    type: 'amd',
    template: '!function(window, document, undefined){${content}}(window, document);',
    wrapAll : true
  })
});

fis.media("dist").match('*.{css,less}', {
  useSprite: true,
  optimizer: fis.plugin('clean-css')
});

fis.media("dist").match('*.png', {
  optimizer: fis.plugin('png-compressor')
});


fis.match('*.less', {
  // fis-parser-less 插件进行解析
  parser: fis.plugin('less'),
  // .less 文件后缀构建后被改成 .css 文件
  rExt: '.css'
});

fis.match('*.jade', {
  parser: fis.plugin('jade', {
    pretty: true
  }),
  rExt: '.html'
});

fis.match('*.es6', {
  parser: fis.plugin('es6-babel', {}),
  rExt: '.js'
});


