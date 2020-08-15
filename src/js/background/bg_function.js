async function removeCookie(pattern) {
  const cookies = await browser.cookies.getAll({});
  for (const cookie of cookies) {
    if(new RegExp(pattern).test(cookie.domain)) {
      const url = "http" + (cookie.secure ? "s" : "") + "://" + cookie.domain + cookie.path; 
      await browser.cookies.remove({"url": url, "name": cookie.name});
    }
  }
}

function saveToClipboard(jsonData) {
  const jsonParsed = JSON.parse(jsonData);
  for(const key in jsonParsed){
    cba.clipboard[key] = jsonParsed[key];
  }
}

async function panelCreation(url) {
  if (!url)
    return false;
  
  await browser.windows.create({url, width: 600, height: 600, type: "panel"});
}

async function windowCreation(url) {
  if (!url)
    return false;
  
  await browser.windows.create({url});
}

async function removeCurrentWindow() {
  const {id} = await browser.windows.getCurrent();
  await browser.windows.remove(id);
}

async function reloadCurrentTab(){
  const {id} = (await browser.tabs.query({active: true}))[0];
  await browser.tabs.reload(id);
}

async function requestService(type, url, data, resolveJson = true)
{
  const response = await request(url, type, data, null, resolveJson);
  if (response)
    cba.clipboard["serviceAnswer"] = response;
}

async function request(url, type, data = "", contentType, resolveJson = true)
{
  const requestData = {};
  if (type)
    requestData.method = type;
  if (contentType) {
    requestData.header = {
      "Content-Type": contentType
    };
  }
  if (type !== "GET")
    requestData.body = data

  let response = await fetch(url, requestData);
  if (resolveJson)
    response = await response.json();
  return response;
}

module.exports = {removeCookie, saveToClipboard,
                  panelCreation, windowCreation,
                  removeCurrentWindow, reloadCurrentTab,
                  requestService};
