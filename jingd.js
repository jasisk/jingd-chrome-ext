(function(){
  var MATCH_STR = ":jingd:";
  var MATCH_REGEX = new RegExp(MATCH_STR, "gi");

  var jingElement = document.createElement("img");
  jingElement.classList.add("emoji");
  jingElement.setAttribute("title", MATCH_STR);
  jingElement.setAttribute("alt", MATCH_STR);
  jingElement.setAttribute("height", 20);
  jingElement.setAttribute("width", 20);
  jingElement.setAttribute("align", "absmiddle");
  jingElement.setAttribute("src", "http://emo.jin.gd");

  findNodesWithMatch();

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