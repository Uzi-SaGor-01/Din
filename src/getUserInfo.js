"use strict";

var utils = require("../utils");
var log = require("npmlog");

function formatData(data) {
  var retObj = {};

  for (var prop in data) {
    // eslint-disable-next-line no-prototype-builtins
    if (data.hasOwnProperty(prop)) {
      var innerObj = data[prop];
      let udata = {
        _id: prop,
        name: innerObj.name,
        firstName: innerObj.firstName,
        vanity: innerObj.vanity,
        thumbSrc: innerObj.thumbSrc,
        profileUrl: innerObj.uri,
        gender: innerObj.gender,
        type: innerObj.type,
        isFriend: innerObj.is_friend,
        isBirthday: !!innerObj.is_birthday,
      };
      utils.usersCache.addOne(udata);
      setInterval(() => utils.usersCache.deleteOneUsingId(threadID), ctx.globalOptions.cacheTime)
      retObj[prop] = udata;
    }
  }

  return retObj;
}

module.exports = function (defaultFuncs, api, ctx) {
  return function getUserInfo(id, callback, no_cache) {
    if (utils.getType(id) !== "Array") {
      id = [id];
    }

    var resolveFunc = function () {};
    var rejectFunc = function () {};
    var returnPromise = new Promise(function (resolve, reject) {
      resolveFunc = resolve;
      rejectFunc = reject;
    });

    if (!no_cache && typeof callback == "boolean") no_cache = callback;
    if (!callback || (callback && typeof callback != "function")) {
      callback = function (err, friendList) {
        if (err) {
          return rejectFunc(err);
        }
        resolveFunc(friendList);
      };
    }

    if (!no_cache) {
      let dataCache = [];
      let noCache = [];

      for (let uid of id) {
        const cache = utils.usersCache.findOneById(uid);
        if (!cache) {
          noCache.push(uid);
          continue;
        }
        dataCache.push(cache);
      }

      if (noCache.length != 0) {
        var form = {};
        noCache.map(function (v, i) {
          form["ids[" + i + "]"] = v;
        });
        defaultFuncs
          .post("https://www.facebook.com/chat/user_info/", ctx.jar, form)
          .then(utils.parseAndCheckLogin(ctx, defaultFuncs))
          .then(function (resData) {
            if (resData.error) {
              throw resData;
            }
            let data = formatData(resData.payload.profiles);
            for (let cdata of dataCache) {
              data[cdata._id] = cdata;
            }
            return callback(null, data);
          })
          .catch(function (err) {
            log.error("getUserInfo", err);
            return callback(err);
          });

        return returnPromise;
      } else {
        let data = {};
        for (let cdata of dataCache) {
          data[cdata._id] = cdata;
        }
        callback(null, data);
        return returnPromise;
      }
    } else {
      var form = {};
      id.map(function (v, i) {
        form["ids[" + i + "]"] = v;
      });
      console.log(form);
      defaultFuncs
        .post("https://www.facebook.com/chat/user_info/", ctx.jar, form)
        .then(utils.parseAndCheckLogin(ctx, defaultFuncs))
        .then(function (resData) {
          if (resData.error) {
            throw resData;
          }
          return callback(null, formatData(resData.payload.profiles));
        })
        .catch(function (err) {
          log.error("getUserInfo", err);
          return callback(err);
        });

      return returnPromise;
    }
  };
};
