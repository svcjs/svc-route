import test from 'ava'
import { Route } from '../src/index'

test('simple', async t => {
  return new Promise((resolve, reject) => {
    let r = new Route()
    r.bind('a.b', (paths) => {
      t.true(paths.last.pathName === 'a.b' && paths.last.args.a === 1)
      paths.last.args.c = 3.2
      resolve()
    })
    r.go('/a/b', {a: 1, b: '2'}).then((paths) => {
      t.true(paths.last.pathName === 'a.b' && paths.last.args.b === '2' && paths.last.args.c === 3.2)
    })
  })
})

test('unbind', async t => {
  return new Promise((resolve, reject) => {
    let r = new Route()
    let callback = (paths) => {
      t.true(false)
      resolve()
    }
    r.bind('a.b', {})
    r.unbind('a.b', {})
    r.bind(['a.b'], callback)
    r.unbind(['a.b'], callback)
    r.go('/a/b', {a: 1, b: '2'}).then((paths) => {
      t.true(true)
      resolve()
    })
  })
})

test('multi', async t => {
  return new Promise((resolve, reject) => {
    let r = new Route()
    let times = 1
    r.bind(['a.b', 'a.b.c'], (paths) => {
      if (times++ === 1) {
        t.true(paths.last.pathName === 'a.b' && paths.last.args.a === '1')
      } else {
        t.true(paths.last.args.b === '22' && paths.last.args.c[0] === 333)
        resolve()
      }
    })
    r.go('/a/b?a=1&b=2')
    r.go('c?b=22', {c: [333, '333'], d: '4444'})
  })
})

test('ext args', async t => {
  return new Promise((resolve, reject) => {
    let r = new Route()
    let times = 1
    r.bind('*', (paths) => {
      if (times++ === 1) {
        t.true(paths.last.pathName === 'a.b' && paths[0].args.a === '1')
      } else {
        t.true(paths.last.pathName === 'a.c' && paths[0].args.a === '1' && paths[0].args.aa === '11')
        resolve()
      }
    })
    r.go('/a{"a":"1"}/b?b=2')
    r.go('/a{"aa":"11"}/c?c=3')
  })
})

test('part', async t => {
  return new Promise((resolve, reject) => {
    let r = new Route()
    let times = 1
    let obj = {
      name: 'testObject',
      onRoute: function (paths) {
        t.true(this.name === 'testObject')
        if (times++ === 1) {
          t.true(paths.last.pathName === 'a.b' && paths.last.args.a === '1')
        } else {
          t.true(paths.last.args.b === '22' && paths.last.args.c === 333)
          resolve()
        }
      }
    }
    r.bind('a.*', obj)
    r.go('/a/b?a=1&b=2')
    r.go('c?b=22', {c: 333, d: '4444'})
  })
})
