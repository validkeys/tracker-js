###
V.0.0.5
###
String::toCamelCase = ->
  @replace /^([A-Z])|\s(\w)/g, (match, p1, p2, offset) ->
    return p2.toUpperCase()  if p2
    p1.toLowerCase()


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



  # should remove any keys with dot notation and camelize them
  _cleansedData: {}

  _buffer: {}

  _addToBuffer: (k, v, path) ->
    k = k.replace("$","")
    k = k.replace("."," ")
    k = k.toCamelCase()
    newPath = if path.length then "#{path}.#{k}" else k
    @_buffer[newPath] = v

  _bufferedData: ->
    tmp = @_cleansedData
    for key of @_buffer
      depth = tmp
      pathSplits = key.split(".")
      for i in [0...pathSplits.length]
        # console.log "#{i} : #{pathSplits.length}", pathSplits
        if i == pathSplits.length - 1
          # we are at the value
          depth[pathSplits[i]] = @_buffer[key]
        else
          depth[pathSplits[i]] ||= {}
          depth = depth[pathSplits[i]]

    @_cleansedData

  _sendToBuffer: (data, path) ->
    path ?= ""
    for key of data
      newPath = if path.length then "#{path}.#{key}" else key
      if typeof data[key] is "object"
        @_sendToBuffer(data[key], newPath)
      else if ["string","boolean","number"].indexOf(typeof data[key]) > -1
        @_addToBuffer(key, data[key], path)
      else if typeof data[key] is "undefined"
        data[key] = "__UNDEFINED__"
        @_addToBuffer(key, data[key], path)
      else
        console.warn "Unhandled cleanse method for #{typeof data[key]}"


  _cleanseData: (data, path) ->
    @_sendToBuffer(data, path)
    @_bufferedData()



  track: ( guid, data = {} ) ->
    throw new Error("Skyline not initialized") if !@initialized

    data = @_cleanseData(data)

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
