function addEvent(node, event, action) {
  if (document.addEventListener) { // W3C
      node.addEventListener(event, action, false);
  } else if (document.attachEvent) { // IE
      node.attachEvent('on' + event, action);
  } else { // last resort
      node['on' + event] = action;
  }
}