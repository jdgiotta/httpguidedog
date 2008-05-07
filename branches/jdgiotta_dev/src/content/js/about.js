// Loads the extension home page in a new tab
function guidedog_visitHomePage() {
	var parentWindow = null;
	var url          = "http://jdgiotta.googlepages.com/guidedoghomepage";
	
	// If there is a parent window
	if(window.opener) {
		// If there is a grand parent window
		if(window.opener.opener) {
			parentWindow = window.opener.opener;
		} else {
			parentWindow = window.opener;
		}
	}
	
	// If a parent window was found
	if(parentWindow) {
		parentWindow.open(url);
	}	
	window.close();
}