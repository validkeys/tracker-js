class SkylineTracker

  api_endpoint: "http://localhost:3001/"

  project_key: null
  api_key:     null

  request_token: null

  initialized: false

  init: (project_key, api_key) ->
    if project_key is null or api_key is null
      console.error "You havent provided either a project_key or an api_key"
    else
      @project_key = project_key
      @api_key     = api_key

      @_setRequestToken()

      @initialized = true

  track: ( title, data = {} ) ->
    throw new Error("Skyline not initialized") if !@initialized

    submissionData = {
      title: title,
      data:  data
    }

    ajax = @_generateXmlHttp()
    ajax.open "POST", "#{@api_endpoint}events/track"

    ajax.setRequestHeader("Content-Type", "application/json; charset=utf-8")
    ajax.setRequestHeader("Authorization", @request_token)
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
          console.error "Skyline had a problem connecting. #{xmlhttp.status} : #{JSON.parse(xmlhttp.responseText).errors}"

    xmlhttp


  _setRequestToken: ->
    @request_token = btoa(@project_key + ":" + @api_key)


window.SkylineTracker = new SkylineTracker()