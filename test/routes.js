import test from 'ava'
import { Route } from '../src/index'

var checks = [
  ['/a', '/a'],
  ['/a/b/c', '/a/b/c{"a":1,"b":{"x":1,"y":2},"c":true}', {a: 1, b: {x: 1, y: 2}, c: true}],
  ['/a/b/c{"a": 1,"b":\t"222","c": true}', '/a/b/c{"a":1,"b":"222","c":true}'],
  ['/a/b%2f1%3fa%3d1/c', '#a#b/1{"a":"1"}#c'],
  [['a1', 'b/1?b=2', 'c?x=1/2'], '#a1#b/1{"b":"2"}#c{"x":"1/2"}'],
  ['up', '#a1#b/1{"b":"2","c":3}', {c: 3}],
  ['up', '/a1'],
  ['up', '/'],
  ['~a/1~b?y=1#1/1~c?x=1/2~d/1', '!a/1!b{"y":"1#1/1"}!c{"x":"1/2"}!d/1'],
  ['!a/11!b{"y":"1#1/1"}!c{"x":"1/2"}!d/1', '!a/11!b{"y":"1#1/1"}!c{"x":"1/2"}!d/1'],
  ['/1', '/1'],
  ['2', '/1/2'],
  [' 1 2 3 4', '/1/2/3/4'],
  [-1, '/1/2'],
  [-2, '!a/11!b{"y":"1#1/1"}!c{"x":"1/2"}!d/1'],
  [2, '/1/2'],
  ['/a/b/c', '/a/b/c'],
  [-1, '/1/2'],
  [20, '/a/b/c'],
  ['../d', '/a/b/d'],
  ['../../e', '/a/e'],
  ['/a/b/../b/c/./d/e', '/a/b/c/d/e']
]

let r = new Route()
let resultUrls = []
r.bind('*', (paths) => {
  resultUrls.push(r.routeUrl)
})

let promises = []
for (let i in checks) {
  promises.push(r.go(checks[i][0], checks[i][2]))
}
Promise.all(promises).then((results) => {
  for (let i in resultUrls) {
    // console.log(resultUrls[i])
    // console.log(checks[i][1])
    test('route ' + i, t => {
      t.true(resultUrls[i] === checks[i][1])
    })
  }
})
