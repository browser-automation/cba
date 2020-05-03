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

module.exports = {removeCookie, saveToClipboard,
									panelCreation, windowCreation,
									removeCurrentWindow, reloadCurrentTab};
