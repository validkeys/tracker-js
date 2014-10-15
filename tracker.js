
/*
V.0.0.2
 */

(function() {
  var Tusk;

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

    Tusk.prototype.track = function(guid, data) {
      var ajax, submissionData;
      if (data == null) {
        data = {};
      }
      if (!this.initialized) {
        throw new Error("Skyline not initialized");
      }
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
