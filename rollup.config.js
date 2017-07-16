import babel from 'rollup-plugin-babel'
import commonjs from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve'

export default {
  entry: 'src/index.js',
  targets: [
    { dest: 'dist/svc-route.js', format: 'umd' },
    { dest: 'dist/svc-route.cjs.js', format: 'cjs' },
    { dest: 'dist/svc-route.es.js', format: 'es' }
  ],
  moduleName: 'svcRoute',
  plugins: [
    babel({
      babelrc: false,
      exclude: 'node_modules/**',
      presets: [
        [
          'es2015',
          {
            'modules': false
          }
        ]
      ],
      plugins: [
        'external-helpers'
      ]
    }),
    resolve({
      jsnext: true,
      main: true
    }),
    commonjs()
  ]

}
