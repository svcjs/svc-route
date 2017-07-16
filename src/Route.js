export default class Route {
  constructor () {
    this.routeUrl = ''
    this._routeHistoryPos = -1
    this._routeHistories = []
    this._binds = {}
    this._spaceChars = ['/', '#', '!', '`', '~', '@', '%', '^', '*', ';', '\\', ' ']
  }

  go (url, args) {
    let paths = []
    let urls = []
    let currentPaths = this._routeHistoryPos >= 0 ? this._routeHistories[this._routeHistoryPos] : []

    if (url === 'up') {
      // 向上一级
      if (currentPaths.length > 0) urls = currentPaths.slice(0, currentPaths.length - 1)
    } else if (typeof url === 'string') {
      // url路由
      let space = url.charAt(0)
      if (space === '.') space = url.charAt(1)
      if (space === '.') space = url.charAt(2)
      if (this._spaceChars.indexOf(space) === -1) {
        // 追加模式
        paths = JSON.parse(JSON.stringify(currentPaths))
        urls = [url]
      } else if (url.charAt(0) === '.') {
        // 追加模式
        paths = JSON.parse(JSON.stringify(currentPaths))
        urls = url.split(space)
      } else {
        urls = url.split(space)
      }
    } else if (typeof url === 'number') {
      // 历史路由
      this._routeHistoryPos += url
      if (this._routeHistoryPos < 0) this._routeHistoryPos = 0
      if (this._routeHistoryPos > this._routeHistories.length - 1) this._routeHistoryPos = this._routeHistories.length - 1
      if (this._routeHistoryPos >= 0) urls = this._routeHistories[this._routeHistoryPos]
    } else if (url instanceof Array) {
      // 数组路由
      urls = url
    }

    let tmpNames = []
    for (let tmpPath of paths) {
      tmpNames.push(tmpPath.name)
    }

    let path = null
    for (let url of urls) {
      if (!url) continue
      if (typeof url === 'string') {
        if (url === '.') continue
        if (url === '..') {
          if (paths.length > 0) {
            paths = paths.slice(0, paths.length - 1)
            // names = names.slice(0, names.length - 1)
            // newUrls = newUrls.slice(0, newUrls.length - 1)
          }
          continue
        }

        url = decodeURIComponent(url)
        path = {args: {}}
        let argsPos
        if ((argsPos = url.indexOf('?')) !== -1) {
          path.name = url.substr(0, argsPos)
          let argsA = url.substr(argsPos + 1).split('&')
          for (let argA of argsA) {
            if (!argA) continue
            let argPos = argA.indexOf('=')
            if (argPos !== -1) {
              path.args[argA.substr(0, argPos)] = argA.substr(argPos + 1)
            }
          }
        } else if ((argsPos = url.indexOf('{')) !== -1) {
          path.name = url.substr(0, argsPos)
          try {
            path.args = JSON.parse(url.substr(argsPos))
          } catch (err) {
          }
        } else {
          path.name = url
        }

        // 相同路径的旧节点如果有参数，继承过来
        tmpNames.push(path.name)
        let tmpPathName = tmpNames.join('.')
        // console.log([tmpPathName, paths.length, currentPaths[paths.length]])
        let prevSamePath = currentPaths[paths.length]
        if (prevSamePath && tmpPathName === prevSamePath.pathName && prevSamePath.args) {
          for (let k in prevSamePath.args) {
            if (!path.args[k]) path.args[k] = prevSamePath.args[k]
          }
        }
      } else {
        path = url
      }

      paths.push(path)
    }

    // 附加参数
    if (path !== null && args && typeof args === 'object') {
      for (let k in args) {
        path.args[k] = args[k]
      }
    }

    // console.log(this.routeUrl);
    if (typeof url !== 'number') {
      if (this._routeHistoryPos < this._routeHistories.length - 1) {
        this._routeHistories = this._routeHistories.slice(0, this._routeHistoryPos + 1)
      }
      this._routeHistories.push(paths)
      if (this._routeHistories.length > 10) {
        this._routeHistories = this._routeHistories.slice(this._routeHistories.length - 11)
      }
      this._routeHistoryPos = this._routeHistories.length - 1
    }

    let oldUrl = this.routeUrl
    this.remakeRouteUrl()
    if (this.routeUrl === oldUrl) {
      // 相同的路由不触发事件
      return
    }

    // // 重新计算 pathName、url
    // let newUrls = []
    // let names = []
    // for (let path of paths) {
    //   names.push(path.name)
    //   path.pathName = names.join('.')
    //
    //   path.url = path.name + (Object.getOwnPropertyNames(path.args).length ? JSON.stringify(path.args) : '')
    //   newUrls.push(path.url)
    // }
    // paths.last = path || {name: '', args: '', pathName: '', url: ''}
    //
    // // 寻找一个没出现过的字符作为间隔符
    // let space = '/'
    // let tmpNewUrlString = newUrls.join('')
    // for (let spaceChar of this._spaceChars) {
    //   if (tmpNewUrlString.indexOf(spaceChar) === -1) {
    //     space = spaceChar
    //     break
    //   }
    // }
    // let newUrl = space + newUrls.join(space)
    // if (newUrl === this.routeUrl) return
    // this.routeUrl = newUrl

    let that = this
    return new Promise(function (resolve, reject) {
      let pendingTargets = [] // 需要回调的对象
      for (let bindKey in that._binds) {
        if (bindKey === '*') {
          // all match
          pendingTargets.push(that._binds[bindKey])
        } else {
          let partInfo = that._binds[bindKey].partInfo
          if (partInfo.pos === -1) {
            if (bindKey === paths.last.pathName) {
              pendingTargets.push(that._binds[bindKey])
            }
          } else {
            if ((partInfo.k1 && !partInfo.k2 && paths.last.pathName.startsWith(partInfo.k1)) ||
              (partInfo.k2 && !partInfo.k1 && paths.last.pathName.endsWith(partInfo.k2)) ||
              (partInfo.k1 && partInfo.k2 && paths.last.pathName.startsWith(partInfo.k1) && paths.last.pathName.endsWith(partInfo.k2))) {
              pendingTargets.push(that._binds[bindKey])
            }
          }
        }
      }

      for (let targets of pendingTargets) {
        for (let target of targets) {
          if (target.func !== null && typeof target.func === 'function') {
            target.func.call(target.object, paths)
          }
        }
      }
      resolve(paths)
    })
  }

  // 生成URL
  remakeRouteUrl () {
    let paths = this._routeHistories[this._routeHistoryPos]
    let newUrls = []
    let names = []
    for (let path of paths) {
      names.push(path.name)
      path.pathName = names.join('.')

      path.url = path.name + (Object.getOwnPropertyNames(path.args).length ? JSON.stringify(path.args) : '')
      newUrls.push(path.url)
      paths.last = path
    }
    if (!paths.last) paths.last = {name: '', args: '', pathName: '', url: ''}

    // 寻找一个没出现过的字符作为间隔符
    let space = '/'
    let tmpNewUrlString = newUrls.join('')
    for (let spaceChar of this._spaceChars) {
      if (tmpNewUrlString.indexOf(spaceChar) === -1) {
        space = spaceChar
        break
      }
    }
    let newUrl = space + newUrls.join(space)
    this.routeUrl = newUrl
  }

  // 绑定数据变化通知
  bind (keyOrKeys, target) {
    if (!(keyOrKeys instanceof Array)) keyOrKeys = [keyOrKeys]
    let bindTarget = {
      object: null,
      func: null,
      keys: keyOrKeys
    }

    // 构建回调对象
    if (typeof target === 'function') {
      // direct call function
      bindTarget.func = target
    } else if (typeof target === 'object') {
      // call object's [set or setData]
      if (target['onRoute'] && typeof target['onRoute'] === 'function') {
        bindTarget.object = target
        bindTarget.func = target['onRoute']
      }
    }

    for (let key of keyOrKeys) {
      if (!this._binds[key]) this._binds[key] = []
      this._binds[key].push(bindTarget)

      let partInfo = this._binds[key].partInfo
      if (partInfo === undefined) {
        partInfo = {}
        partInfo.pos = key.indexOf('*')
        if (partInfo.pos !== -1) {
          partInfo.k1 = key.substr(0, partInfo.pos)
          partInfo.k2 = key.substr(partInfo.pos + 1)
        }
        this._binds[key].partInfo = partInfo
      }
    }
  }

  // 取消绑定
  unbind (keyOrKeys, target) {
    if (!(keyOrKeys instanceof Array)) {
      keyOrKeys = [keyOrKeys]
    }
    let jsonKeys = JSON.stringify(keyOrKeys)
    for (let key of keyOrKeys) {
      let bindTargets = this._binds[key]
      if (bindTargets) {
        for (let i = bindTargets.length - 1; i >= 0; i--) {
          let bindTarget = bindTargets[i]
          if ((bindTarget.object === target || bindTarget.func === target) && JSON.stringify(bindTarget.keys) === jsonKeys) {
            this._binds[key].splice(i, 1)
          }
        }
      }
    }
  }
}
