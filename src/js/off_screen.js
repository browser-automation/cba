console.log("OFFSCREEN LOADED");
// Eval throws error
// eval("console.log('OFFSCREEN LOADED')"); 
// Loading inline script also throws error
// const clipboardId = "grabClipboardHere";
// const clipboard = {};
// const script = document.createElement('script');
// script.setAttribute("type", "application/javascript");
// script.textContent = `
//   var clipboard=${JSON.stringify(clipboard)};
//   var newdiv = document.createElement('div');
//   if(document.getElementById('${clipboardId}')!= null) {
//     document.getElementById('${clipboardId}').textContent = JSON.stringify(clipboard);
//   }
//   else {
//     newdiv.setAttribute('id', '${clipboardId}');
//     newdiv.textContent = JSON.stringify(clipboard);
//     document.body.appendChild(newdiv);
//   }
//   document.getElementById('${clipboardId}').style.display = 'none';`;
// document.documentElement.appendChild(script); // run the script
// document.documentElement.removeChild(script); // clean up