function uniqueNumber(length) {
	var newDate = new Date;
	var unique = newDate.getTime() + '';

	return unique.substring(unique.length - length);
}

var fbPostRunning = false;

function fbLike(person, like) {
		//$(".mainWrapper .actorDescription").css("outline", "1px solid red");
		if($(".timelineLayout").length == 0) {  // if not timeline
			var mainWrapperArray = $(".mainWrapper");
			// .actorDescription a
			var wrapperInd =0;
			for(var i=0;i<mainWrapperArray.length;i++) {
				if(person == "all") {
					$(mainWrapperArray[i]).find(".UIActionLinks [name='"+like+"']").click();
					/*
					setTimeout(function(){
						$(mainWrapperArray[wrapperInd]).find(".UIActionLinks [name='"+like+"']").click();
						wrapperInd++;
						console.log("GO");
						}, i*1000);
					*/
				}
				else {
					if($(mainWrapperArray[i]).find(".uiStreamHeadline a").html() == person) {
						$(mainWrapperArray[i]).find(".UIActionLinks [name='"+like+"']").click();
						//UIActionLinks
					}
				}
				
			}
		}
		else{ // if timeline
			var mainWrapperArray = $(".timelineUnitContainer");
			
			for(var i=0;i<mainWrapperArray.length;i++) {
				if(person == "all") {
					$(mainWrapperArray[i]).find(".UIActionLinks [name='"+like+"']").click();
				}
				else {
					if($(mainWrapperArray[i]).find(".unitHeader a").html() == person) {
						$(mainWrapperArray[i]).find(".UIActionLinks [name='"+like+"']").click();
						//UIActionLinks
					}
				}
				
			}
		}
		
		
		return;
		for(var i=0;i<namesContainerArray.length;i++) {
			console.log(namesContainerArray[i].parent());
		}
}

function fbAddFriend() {
	var addFriendArray = $("[value='Add Friend']");
	for(var i=0;i<addFriendArray.length;i++) {
		addFriendArray[i].click();
	}
	
	
}
