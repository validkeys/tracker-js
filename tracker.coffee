###
V.0.0.3
###
class Tusk

  api_endpoint: "http://events.api.tusk.li/"

  project_key:    null

  env:            "production"

  request_token:  null

  initialized:    false

  init: (project_key, options = {}) ->
    if project_key is null
      console.error "You havent provided either a project_key or an api_key"
    else
      @project_key = project_key

      if options['__DEBUG__']
        console.warn "*** TUSK TRACKER IN DEBUG MODE ***"
        @api_endpoint = "http://localhost:3001/"

      @env = options.env if options.env

      @_setRequestToken()

      @initialized = true

  track: ( guid, data = {} ) ->
    throw new Error("Skyline not initialized") if !@initialized

    data["tusk-env"] = @env
    data["tusk-device-data"] = {
      width:          window.outerWidth,
      height:         window.outerHeight,
      cookieEnabled:  if navigator.cookieEnabled then navigator.cookieEnabled else "unknown",
      language:       navigator.language,
      platform:       navigator.platform,
      userAgent:      navigator.userAgent
    }

    submissionData = {
      metricToken:  guid,
      data:         data
    }

    ajax = @_generateXmlHttp()
    ajax.open "POST", "#{@api_endpoint}track"

    ajax.setRequestHeader("Content-Type", "application/json; charset=utf-8")
    ajax.setRequestHeader("TUSK_TOKEN", @project_key)
    ajax.setRequestHeader("Access-Control-Allow-Origin","*")

    ajax.send(JSON.stringify(submissionData))


  _generateXmlHttp: ->
    xmlhttp = null

    if window.XMLHttpRequest
      xmlhttp = new XMLHttpRequest()
    else
      xmlhttp = new ActiveXObject("Microsoft.XMLHTTP")

    xmlhttp.onreadystatechange = =>
      if xmlhttp.readyState is 4
        if xmlhttp.status != 200 && xmlhttp.status != 304
          console.error "Tusk had a problem connecting. #{xmlhttp.status} : #{JSON.parse(xmlhttp.responseText).errors}"

    xmlhttp


  _setRequestToken: ->
    @request_token = btoa("#{@project_key}:?")


window.tusk ||= new Tusk()
