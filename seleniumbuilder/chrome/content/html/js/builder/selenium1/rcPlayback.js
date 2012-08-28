/** Playback system for Selenium RC. */
builder.selenium1.rcPlayback = {};

/** The user has requested that playback be stopped. */
builder.selenium1.rcPlayback.requestStop = false;
/** The result of the current step being played back. */
builder.selenium1.rcPlayback.result = false;
/** The script being played back. */
builder.selenium1.rcPlayback.script = false;
/** The index of the step being played back, or -1 if we're at the start. */
builder.selenium1.rcPlayback.currentStepIndex = false;
/** Function to call after playback is complete. */
builder.selenium1.rcPlayback.postRunCallback = false;
/** The identifier for this RC session. */
builder.selenium1.rcPlayback.session = false;
/** The host and port to communicate with. */
builder.selenium1.rcPlayback.hostPort = false;

builder.selenium1.rcPlayback.getHostPort = function() {
  return bridge.prefManager.getCharPref("extensions.seleniumbuilder.rc.hostport");
};

builder.selenium1.rcPlayback.setHostPort = function(hostPort) {
  bridge.prefManager.setCharPref("extensions.seleniumbuilder.rc.hostport", hostPort);
};

builder.selenium1.rcPlayback.getBrowserString = function() {
  return bridge.prefManager.getCharPref("extensions.seleniumbuilder.rc.browserstring");
};

builder.selenium1.rcPlayback.setBrowserString = function(browserstring) {
  bridge.prefManager.setCharPref("extensions.seleniumbuilder.rc.browserstring", browserstring);
};

builder.selenium1.rcPlayback.run = function(hostPort, browserstring, postRunCallback) {
  jQuery('#steps-top')[0].scrollIntoView(false);
  jQuery('#edit-editing').hide();
  jQuery('#edit-rc-playing').show();
  jQuery('#edit-rc-stopping').hide();
  builder.selenium1.rcPlayback.requestStop = false;
  builder.selenium1.rcPlayback.result = { success: false };
  builder.selenium1.rcPlayback.postRunCallback = postRunCallback;
  builder.selenium1.rcPlayback.currentStepIndex = -1;
  builder.selenium1.rcPlayback.hostPort = hostPort;
  builder.selenium1.rcPlayback.script = builder.getScript();
  builder.views.script.clearResults();
  var baseURL = builder.selenium1.rcPlayback.script.steps[0].url; // qqDPS BRITTLE!
  jQuery('#edit-clearresults-span').show();
  var msg = 'cmd=getNewBrowserSession&1=' + browserstring + '&2=' + builder.selenium1.rcPlayback.enc(baseURL) + '&3=null';
  builder.selenium1.rcPlayback.post(msg, builder.selenium1.rcPlayback.startJob, builder.selenium1.rcPlayback.xhrfailed);
};

builder.selenium1.rcPlayback.xhrfailed = function(xhr, textStatus, errorThrown) {
  var err = "Server connection error: " + textStatus;
  if (builder.selenium1.rcPlayback.currentStepIndex === -1) {
    // If we can't connect to the server right at the start, just attach the error message to the
    // first step.
    builder.selenium1.rcPlayback.currentStepIndex = 0;
  }
  jQuery("#" + builder.selenium1.rcPlayback.script.steps[builder.selenium1.rcPlayback.currentStepIndex].id + '-content').css('background-color', '#ff3333');
  jQuery("#" + builder.selenium1.rcPlayback.script.steps[builder.selenium1.rcPlayback.currentStepIndex].id + "-error").html(err).show();
  builder.selenium1.rcPlayback.result.success = false;
  builder.selenium1.rcPlayback.result.errormessage = err;
  jQuery('#edit-editing').show();
  jQuery('#edit-rc-playing').hide();
  jQuery('#edit-rc-stopping').hide();
  
  if (builder.selenium1.rcPlayback.postRunCallback) {
    builder.selenium1.rcPlayback.postRunCallback(builder.selenium1.rcPlayback.result);
  }
};

builder.selenium1.rcPlayback.startJob = function(rcResponse) {
  builder.selenium1.rcPlayback.session = rcResponse.substring(3);
  builder.selenium1.rcPlayback.result.success = true;
  builder.selenium1.rcPlayback.playNextStep(null);
};

builder.selenium1.rcPlayback.playNextStep = function(returnVal) {
  var error = false;
  if (returnVal) {
    if (returnVal.substring(0, 2) === "OK") {
      if (returnVal.length > 3 && returnVal.substring(3) === "false") {
        jQuery("#" + builder.selenium1.rcPlayback.script.steps[builder.selenium1.rcPlayback.currentStepIndex].id + '-content').css('background-color', '#ffcccc');
        builder.selenium1.rcPlayback.result.success = false;
      } else {
        jQuery("#" + builder.selenium1.rcPlayback.script.steps[builder.selenium1.rcPlayback.currentStepIndex].id + '-content').css('background-color', '#bfee85');
      }
    } else {
      error = true;
      // Some error has occurred
      jQuery("#" + builder.selenium1.rcPlayback.script.steps[builder.selenium1.rcPlayback.currentStepIndex].id + '-content').css('background-color', '#ff3333');
      jQuery("#" + builder.selenium1.rcPlayback.script.steps[builder.selenium1.rcPlayback.currentStepIndex].id + "-error").html(" " + returnVal).show();
      builder.selenium1.rcPlayback.result.success = false;
      builder.selenium1.rcPlayback.result.errormessage = returnVal;
    }
  }
  
  if (!error) {
    // Run next step?
    if (builder.selenium1.rcPlayback.requestStop) {
      builder.selenium1.rcPlayback.result.success = false;
      builder.selenium1.rcPlayback.result.errormessage = "Test stopped";
    } else {
      builder.selenium1.rcPlayback.currentStepIndex++;
      // Echo is not supported server-side, so ignore it.
      while (builder.selenium1.rcPlayback.currentStepIndex < builder.selenium1.rcPlayback.script.steps.length && builder.selenium1.rcPlayback.script.steps[builder.selenium1.rcPlayback.currentStepIndex].type === builder.selenium1.stepTypes.echo) {
        jQuery("#" + builder.selenium1.rcPlayback.script.steps[builder.selenium1.rcPlayback.currentStepIndex].id + '-content').css('background-color', '#bfee85');
        builder.selenium1.rcPlayback.currentStepIndex++;
      }
      if (builder.selenium1.rcPlayback.currentStepIndex < builder.selenium1.rcPlayback.script.steps.length) {
        builder.selenium1.rcPlayback.post(builder.selenium1.rcPlayback.toCmdString(builder.selenium1.rcPlayback.script.steps[builder.selenium1.rcPlayback.currentStepIndex]) + "&sessionId=" + builder.selenium1.rcPlayback.session, builder.selenium1.rcPlayback.playNextStep);
        return;
      }
    }
  }
  
  var msg = "cmd=testComplete&sessionId=" + builder.selenium1.rcPlayback.session;
  builder.selenium1.rcPlayback.post(msg, function() {});
  jQuery('#edit-editing').show();
  jQuery('#edit-rc-playing').hide();
  jQuery('#edit-rc-stopping').hide();
  
  if (builder.selenium1.rcPlayback.postRunCallback) {
    builder.selenium1.rcPlayback.postRunCallback(builder.selenium1.rcPlayback.result);
  }
};

builder.selenium1.rcPlayback.stopTest = function() {
  builder.selenium1.rcPlayback.requestStop = true;
  jQuery('#edit-rc-playing').hide();
  jQuery('#edit-rc-stopping').show();
};

builder.selenium1.rcPlayback.post = function(msg, callback) {
  jQuery.ajax({
    type: "POST",
    url: "http://" + builder.selenium1.rcPlayback.hostPort + "/selenium-server/driver/",
    data: msg,
    success: callback,
    error: builder.selenium1.rcPlayback.xhrfailed
  });
};

builder.selenium1.rcPlayback.enc = function(str) {
  return encodeURIComponent(str)
        .replace(/%20/g, '+')
        .replace(/!/g, '%21')
        .replace(/'/g, '%27')
        .replace(/\(/g, '%28')
        .replace(/\)/g, '%29')
        .replace(/\*/g, '%2A');
};

/* Takes a step from a script and turns it into a string to be sent to RC. */
builder.selenium1.rcPlayback.toCmdString = function(step) {
  var str = "cmd=" + step.type.getName();
  var params = step.type.getParamNames();
  for (var i = 0; i < params.length; i++) {
    str += "&" + (i + 1) + "=";
    if (step.type.getParamType(params[i]) === "locator") {
      str += builder.selenium1.rcPlayback.enc(step[params[i]].getName(builder.selenium1) + "=" + step[params[i]].getValue());
    } else {
      str += builder.selenium1.rcPlayback.enc(step[params[i]]);
    }
  }
  return str;
};