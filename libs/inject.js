(function(){

  if (! window["Jing'd-And-All-I-Got-Was-This-Lousy-Variable"]) {
    var broker = {}; // This is our message broker.
    registerMessageHandler();
    interceptAjax();
    window["Jing'd-And-All-I-Got-Was-This-Lousy-Variable"] = true;
  }

  removeMe();

  // An object containing ajax mutations.
  // Can have `prepare` and `teardown` methods.
  var intercepts = {
    preview: {
      regExp: /^\/preview/i
    }
  };

  var interceptTypes = Object.keys(intercepts);

  // Check and prepare necessary ajax intercepts.
  function handleIntercepts(obj){
    for (var i=0, type, intercept; i < interceptTypes.length; i++) {
      type = interceptTypes[i];
      intercept = intercepts[type];
      if (intercept.regExp.test(obj.url)){
        var nonce = Array.prototype.slice.call(
              window.crypto.getRandomValues(new Uint8Array(8))
            ).join("");
        obj.success = function(success){
          return function(){
            var args = Array.prototype.slice.call(arguments);
            broker[nonce] = {
              args: args,
              success: success
            };
            var msg = intercept.prepare ? intercept.prepare(args[0]) : args[0];
            sendMessage(nonce, msg, type);
          };
        }(obj.success);
        break;
      }
    }
  }

  // Handle messages passed from the extension.
  function registerMessageHandler(){
    window.addEventListener("message", function(evt){
      var inst, obj = JSON.parse(evt.data);
      if (obj.fromExt && obj.nonce && broker[obj.nonce]){
        inst = broker[obj.nonce];
        var msg = obj.msg;
        if (intercepts[obj.type]) {
          var intercept = intercepts[obj.type];
          msg = intercept.teardown ? intercept.teardown(obj.msg) : obj.msg;
        }
        inst.args[0] = msg;
        inst.success.apply(this, inst.args);
        delete broker[obj.nonce];
      }
    }, false);
  }

  // Intercept $.ajax to enhance the success callback.
  function interceptAjax(){
    $.ajax = function(ajax){
      return function(obj){
        handleIntercepts(obj);
        ajax.apply(this, arguments);
      };
    }($.ajax);
  }

  // Normalize the message.
  function sendMessage(nonce, msg, type){
    var obj = {
          fromPage: true,
          nonce: nonce,
          msg: msg,
          type: type
        };
    window.postMessage(JSON.stringify(obj), "*");
  }

  // Remove the script reference.
  function removeMe(){
    var me = document.querySelector("script.jingd-injected-script");
    if (me) {
      document.body.removeChild(me);
    }
  }

})();