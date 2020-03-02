jQuery("#projectsTableImport").jqGrid({
	datatype: "local",
   	colNames:['record'],
   	colModel:[
   		{name:'name',index:'name',editable:true, width:130}
   	],
   	height: '123',
   	multiselect: false,
   	hidegrid: false,
   	caption: "Import"
});




function populateImportProjectsTable() {
	var dataObj = JSON.parse(localStorage.getItem("data"));
	var localStorageKeys = Object.keys(dataObj);
	jQuery("#projectsTableImport").jqGrid('addRowData',i+1, {name: "Root"});
	for(var i=0;i<localStorageKeys.length;i++) {
		var namesJSON = {name : localStorageKeys[i]};
		jQuery("#projectsTableImport").jqGrid('addRowData',i+1, namesJSON);
	}
}

populateImportProjectsTable();