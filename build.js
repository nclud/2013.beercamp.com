({
    appDir: 'game',
    baseUrl: 'client',
    paths: {
      underscore: '../lib/underscore/underscore-min',
      stats: '../lib/stats/build/stats.min'
    },
    dir: 'public/js/game',
    shim: {
      underscore: {
        exports: '_'
      },
      stats: {
        exports: 'Stats'
      }
    },
    optimize: 'none',
    removeCombined: true,
    fileExclusionRegExp: /(^\.)|(server)/,
    modules: [
      {
        name: 'init'
      }
    ]
})
