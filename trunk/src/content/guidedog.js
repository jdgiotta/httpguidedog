var GuideDog = {
	initialized: false,
	initialize: function () {
		dump("Guide Dog initialized, wholly!");
		
		this.appContentSplitter = document.getElementById("gdContentSplitter");
		
		this.appTabBox = document.getElementById("gdTabBox");
		
		this.appContentBox = document.getElementById("gdContentBox");
		this.appContentBox.collapsed = true;
		this.appContentBoxCollapsed = true;
		
		GuideDog.initialized = true;
	},
	togglePanel: function (show) {
		var toggleOff = show == undefined ? !this.appContentBox.collapsed : !show;
		
		dump(!toggleOff);
		this.showPanel(!toggleOff);
	},
	
	openAboutUrl: function () {
		var new_win = window.openDialog("chrome://guidedog/content/about.xul", "httpguidedog-about-dialog", "centerscreen,chrome,modal");
		new_win.focus();
	},
	
	showPanel: function (show) {
		this.appContentBox.setAttribute("collapsed", !show);
		this.appContentSplitter.setAttribute("collapsed", !show);
	}
};