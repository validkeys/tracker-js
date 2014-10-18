
/*
V.0.0.5
 */

(function() {
  var Tusk;

  String.prototype.toCamelCase = function() {
    return this.replace(/^([A-Z])|\s(\w)/g, function(match, p1, p2, offset) {
      if (p2) {
        return p2.toUpperCase();
      }
      return p1.toLowerCase();
    });
  };

  Tusk = (function() {
    function Tusk() {}

    Tusk.prototype.api_endpoint = "http://events.api.tusk.li/";

    Tusk.prototype.project_key = null;

    Tusk.prototype.env = "production";

    Tusk.prototype.request_token = null;

    Tusk.prototype.initialized = false;

    Tusk.prototype.init = function(project_key, options) {
      if (options == null) {
        options = {};
      }
      if (project_key === null) {
        return console.error("You havent provided either a project_key or an api_key");
      } else {
        this.project_key = project_key;
        if (options['__DEBUG__']) {
          console.warn("*** TUSK TRACKER IN DEBUG MODE ***");
          this.api_endpoint = "http://localhost:3001/";
        }
        if (options.env) {
          this.env = options.env;
        }
        this._setRequestToken();
        return this.initialized = true;
      }
    };

    Tusk.prototype._cleansedData = {};

    Tusk.prototype._buffer = {};

    Tusk.prototype._addToBuffer = function(k, v, path) {
      var newPath;
      k = k.replace("$", "");
      k = k.replace(".", " ");
      k = k.toCamelCase();
      newPath = path.length ? "" + path + "." + k : k;
      return this._buffer[newPath] = v;
    };

    Tusk.prototype._bufferedData = function() {
      var depth, i, key, pathSplits, tmp, _i, _name, _ref;
      tmp = this._cleansedData;
      for (key in this._buffer) {
        depth = tmp;
        pathSplits = key.split(".");
        for (i = _i = 0, _ref = pathSplits.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
          if (i === pathSplits.length - 1) {
            depth[pathSplits[i]] = this._buffer[key];
          } else {
            depth[_name = pathSplits[i]] || (depth[_name] = {});
            depth = depth[pathSplits[i]];
          }
        }
      }
      return this._cleansedData;
    };

    Tusk.prototype._sendToBuffer = function(data, path) {
      var key, newPath, _results;
      if (path == null) {
        path = "";
      }
      _results = [];
      for (key in data) {
        newPath = path.length ? "" + path + "." + key : key;
        if (typeof data[key] === "object") {
          _results.push(this._sendToBuffer(data[key], newPath));
        } else if (["string", "boolean", "number"].indexOf(typeof data[key]) > -1) {
          _results.push(this._addToBuffer(key, data[key], path));
        } else if (typeof data[key] === "undefined") {
          data[key] = "__UNDEFINED__";
          _results.push(this._addToBuffer(key, data[key], path));
        } else {
          _results.push(console.warn("Unhandled cleanse method for " + (typeof data[key])));
        }
      }
      return _results;
    };

    Tusk.prototype._cleanseData = function(data, path) {
      this._sendToBuffer(data, path);
      return this._bufferedData();
    };

    Tusk.prototype.track = function(guid, data) {
      var ajax, submissionData;
      if (data == null) {
        data = {};
      }
      if (!this.initialized) {
        throw new Error("Skyline not initialized");
      }
      data = this._cleanseData(data);
      data["tusk-env"] = this.env;
      data["tusk-device-data"] = {
        width: window.outerWidth,
        height: window.outerHeight,
        cookieEnabled: navigator.cookieEnabled ? navigator.cookieEnabled : "unknown",
        language: navigator.language,
        platform: navigator.platform,
        userAgent: navigator.userAgent
      };
      submissionData = {
        metricToken: guid,
        data: data
      };
      ajax = this._generateXmlHttp();
      ajax.open("POST", "" + this.api_endpoint + "track");
      ajax.setRequestHeader("Content-Type", "application/json; charset=utf-8");
      ajax.setRequestHeader("TUSK_TOKEN", this.project_key);
      ajax.setRequestHeader("Access-Control-Allow-Origin", "*");
      return ajax.send(JSON.stringify(submissionData));
    };

    Tusk.prototype._generateXmlHttp = function() {
      var xmlhttp;
      xmlhttp = null;
      if (window.XMLHttpRequest) {
        xmlhttp = new XMLHttpRequest();
      } else {
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
      }
      xmlhttp.onreadystatechange = (function(_this) {
        return function() {
          if (xmlhttp.readyState === 4) {
            if (xmlhttp.status !== 200 && xmlhttp.status !== 304) {
              return console.error("Tusk had a problem connecting. " + xmlhttp.status + " : " + (JSON.parse(xmlhttp.responseText).errors));
            }
          }
        };
      })(this);
      return xmlhttp;
    };

    Tusk.prototype._setRequestToken = function() {
      return this.request_token = btoa("" + this.project_key + ":?");
    };

    return Tusk;

  })();

  window.tusk || (window.tusk = new Tusk());

}).call(this);
