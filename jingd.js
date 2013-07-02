(function(){
  var MATCH_STR = ":jingd:";
  var MATCH_REGEX = new RegExp(MATCH_STR, "gi");
  var JINGD_URL = chrome.extension.getURL("jingd.png");

  var slice = Array.prototype.slice;
  var forEach = Array.prototype.forEach;

  var jingElement = document.createElement("img");
  jingElement.classList.add("emoji");
  jingElement.setAttribute("title", MATCH_STR);
  jingElement.setAttribute("alt", MATCH_STR);
  jingElement.setAttribute("height", 20);
  jingElement.setAttribute("width", 20);
  jingElement.setAttribute("align", "absmiddle");
  jingElement.setAttribute("src", JINGD_URL);

  var inject = function(){
    var broker = {};

    window.addEventListener("message", function(evt){
      var inst, obj = JSON.parse(evt.data);
      if (obj.fromExt && obj.nonce && broker[obj.nonce]){
        inst = broker[obj.nonce];
        inst.args[0] = obj.msg;
        inst.success.apply(this, inst.args);
        delete broker[obj.nonce];
      }
    }, false);

    function sendMessage(nonce, msg){
      var obj = {
            fromPage: true,
            nonce: nonce,
            msg: msg
          };
      window.postMessage(JSON.stringify(obj), "*");
    }

    $.ajax = function(ajax){
      return function(obj){
        if (/^\/preview/i.test(obj.url)) {
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
              sendMessage(nonce, args[0]);
            };
          }(obj.success);
        }
        ajax.apply(this, arguments);
      };
    }($.ajax);
  };

  findNodesWithMatch();
  setupSuggesterElements();

  setupMessagePassing();
  injectScript();

  function injectScript(){
    var script = document.createElement("script");
    script.textContent = "(" + inject.toString() + ")();"
    window.document.body.appendChild(script);
  }

  function setupMessagePassing(){
    window.addEventListener("message", function(evt){
      var inst, obj = JSON.parse(evt.data);
      if (obj.fromPage){
        delete obj.fromPage;
        obj.fromExt = true;
        obj.msg = replaceWithJingString(obj.msg);
        window.postMessage(JSON.stringify(obj), "*");
      }
    }, false);
  }

  function replaceWithJingString(text){
    return text.split(MATCH_REGEX).join(jingElement.outerHTML);
  }

  function mutationCallback(obj){
    obj.forEach(function(record){
      if (record.addedNodes) {
        forEach.call(record.addedNodes, function(v){
          if (v.classList && v.classList.contains("emoji-suggestions")) {
            mutateEmojiList(v);
          }
        });
      }
    });
  }

  function mutateEmojiList(ul){
    var emojis = ul.getElementsByTagName("LI");
    if (emojis.length) {
      for (var i=0, emoji, name;i<emojis.length;i++){
        emoji = emojis[i];
        name = emoji.getAttribute("data-value");
        if (name>"jingd") {
          emoji = emojis[i-1];
          break;
        }
      }
      var refNode = emoji;
      var jingNode = refNode.cloneNode(true);
      jingNode.setAttribute("data-value", "jingd");
      jingNode.classList.add("added-by-injector");
      var span = jingNode.children[0];
      span.setAttribute("style", "background-image:url(" + JINGD_URL + ")");
      var text = slice.call(jingNode.childNodes).pop();
      text.nodeValue = "jingd";
      emoji.parentNode.insertBefore(jingNode, refNode.nextSibling);
    }
  }

  function setupSuggesterElements(){
    var elements = document.querySelectorAll("textarea[data-suggester]");
    forEach.call(elements, function(v,i){
      var obs = new MutationObserver(mutationCallback);
      var suggester = document.getElementById(v.getAttribute("data-suggester"));
      if (suggester) {
        obs.observe(suggester, {childList: true});
      }
    });
  }

  function emojiNode(node){
    var text = node.nodeValue;
    var fragment = document.createDocumentFragment();
    var parts = text.split(MATCH_REGEX);
    parts.forEach(function(v, i){
      var textNode = document.createTextNode(v);
      fragment.appendChild(textNode);
      if (i < parts.length-1) {
        fragment.appendChild(jingElement.cloneNode());
      }
    });
    return fragment;
  }

  function findTextNodes(element){
    var nodes = [];
    var children = element.childNodes;
    if (children == null) return nodes;
    for (var i = 0, child; i < children.length; i++){
      child = children[i];
      if (child.nodeType === 3) {
        nodes.push(child);
      } else {
        nodes = nodes.concat(findTextNodes(child));
      }
    }
    return nodes;
  }

  function findNodesWithMatch(){
    var nodes = [];
    var comment, node, i;
    var comments = document.getElementsByClassName("comment-body");
    for (i=0; i < comments.length; i++) {
      comment = comments[i];
      nodes = nodes.concat(findTextNodes(comment));
    }
    for (i=0; i < nodes.length; i++){
      node = nodes[i];
      node.parentNode.replaceChild(emojiNode(node), node);
    }
  }
}());