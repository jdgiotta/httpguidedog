var GuideDog = {
	initialized: false,
	initialize: function () {		
		this.httpTreeOverCell = null;
		
		this.isCollecting = false;
		
		this.observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
		
		this.appContentSplitter = document.getElementById("gdContentSplitter");
		
		this.httpTree = document.getElementById("httpTree");
		
		this.appTabBox = document.getElementById("gdTabBox");
		
		this.appContentBox = document.getElementById("gdContentBox");
		this.appContentBox.collapsed = true;
		this.appContentBoxCollapsed = true;
		
		GuideDog.initialized = true;
	},
	observe: function (subject, topic, data) {
		switch (topic) {
			case "http-on-modify-request":
				var id = new String(Math.random());
				id = id.substring (2,11);
				subject.QueryInterface(Components.interfaces.nsIHttpChannel);
				
				var now = new Date();
				var start_str = now.getHours().toString()
							+ ":"
							+ ((now.getMinutes().toString().length < 2) ? "0" + now.getMinutes().toString() : now.getMinutes().toString())
							+ ":"
							+ now.getSeconds().toString()
							+ "."
							+ now.getMilliseconds().toString();
				var url_str = subject.URI.spec;
				var operation_str = subject.requestMethod;
				this.addRowToHttpTree(id, start_str, operation_str, url_str);
				
				break;
			case "http-on-examine-response":
				subject.QueryInterface(Components.interfaces.nsIHttpChannel);
				var url_str = subject.URI.spec;
				var response_stat = subject.responseStatus;
				var mime_type = subject.getResponseHeader("Content-Type");
				var size = subject.getResponseHeader("Content-Length");
				
				this.updateToHttpTree(response_stat, size, mime_type, url_str);
				
				break;
			default:
				trace("unknown topic: " + topic);
				break;
		}
	},
	
	startCollectingData: function (button) {
		trace("HTTPGuideDog Start Collecting");
		
		var startButton = document.getElementById("gdStartButton");
		startButton.setAttribute("disabled", true);
		
		var stopButton = document.getElementById("gdStopButton");
		stopButton.setAttribute("disabled", false);
		
		/***********************/
		this.observerService.addObserver(this, "http-on-modify-request", false);
		this.observerService.addObserver(this, "http-on-examine-response", false);
		
		this.isCollecting = true;
	},
	stopCollectingData: function () {
		//trace("HTTPGuideDog Stop Collecting");
		
		var startButton = document.getElementById("gdStartButton");
		startButton.setAttribute("disabled", false);
		
		var stopButton = document.getElementById("gdStopButton");
		stopButton.setAttribute("disabled", true);
		
		this.observerService.removeObserver(this, "http-on-modify-request");
		
		this.isCollecting = false;
	},
	togglePanel: function (show) {
		var toggleOff = show == undefined ? !this.appContentBox.collapsed : !show;
		
		this.showPanel(!toggleOff);
	},
	openAboutUrl: function () {
		var new_win = window.openDialog("chrome://guidedog/content/about.xul", "httpguidedog-about-dialog", "centerscreen,chrome,modal");
		new_win.focus();
	},
	showPanel: function (show) {
		
		if (this.isCollecting) {
			if (!show) this.stopCollectingData();
		}
		this.appContentBox.setAttribute("collapsed", !show);
		this.appContentSplitter.setAttribute("collapsed", !show);
	},
	httpTreeCopyRowCellToClipBoard: function () {
		if (this.httpTreeOverCell != null) this.addDataToClipBoard(this.httpTreeOverCell);
	},
	addRowToHttpTree: function (id, initTime, operation, url) {
		//TODO: add row code
		var httpTreeChildren = document.getElementById("httpTreeChildren");
		var new_item = document.createElement("treeitem");
		var new_row = document.createElement("treerow");
		new_row.id = url;
		
		// Start Column 0
		var new_cell_initTime = document.createElement("treecell");
		new_cell_initTime.setAttribute("label", initTime);
		new_row.appendChild(new_cell_initTime);
		
		// Duration Column 1
		var new_cell_duration = document.createElement("treecell");
		new_cell_duration.setAttribute("label", "*");
		new_row.appendChild(new_cell_duration);
		
		// Size Column 2
		var new_cell_size = document.createElement("treecell");
		new_cell_size.setAttribute("label", "*");
		new_row.appendChild(new_cell_size);
		
		// Operation Column 3
		var new_cell_op = document.createElement("treecell");
		new_cell_op.setAttribute("label", operation);
		new_row.appendChild(new_cell_op);
		
		// Result Column 4
		var new_cell_result = document.createElement("treecell");
		new_cell_result.setAttribute("label", "*");
		new_row.appendChild(new_cell_result);
		
		// Type Column 5
		var new_cell_type = document.createElement("treecell");
		new_cell_type.setAttribute("label", "*");
		new_row.appendChild(new_cell_type);
		
		// URL Column 6
		var new_cell_url = document.createElement("treecell");
		new_cell_url.setAttribute("label", url);
		new_row.appendChild(new_cell_url);
		
		new_item.appendChild(new_row);
		httpTreeChildren.appendChild(new_item);
	},
	updateToHttpTree: function (response_stat, content_size, type, url) {
		var row_to_update = document.getElementById(url);
		
		// Size Column 2
		var new_cell_size = document.createElement("treecell");
		new_cell_size.setAttribute("label", content_size);
		row_to_update.replaceChild(new_cell_size, row_to_update.childNodes[2]);
		
		// Result Column 4
		var new_cell_stat = document.createElement("treecell");
		new_cell_stat.setAttribute("label", response_stat);
		row_to_update.replaceChild(new_cell_stat, row_to_update.childNodes[4]);
		
		// Type Column 5
		var new_cell_type = document.createElement("treecell");
		new_cell_type.setAttribute("label", type);
		row_to_update.replaceChild(new_cell_type, row_to_update.childNodes[5]);
		
		row_to_update.id = "locked";
	},
	clearHttpTree: function () {
		var treeChildren = document.getElementById("httpTreeChildren");
		while (treeChildren.firstChild) {
			treeChildren.removeChild(treeChildren.firstChild);
		}
	},
	updateHTTPTreeOverCell: function (event) {
		var row = {}, column = {}, part = {};
		var tree = this.httpTree;
		var menu = document.getElementById("httpTreeItemMenu");
		
		var boxobject = tree.boxObject;
		boxobject.QueryInterface(Components.interfaces.nsITreeBoxObject);
		boxobject.getCellAt(event.clientX, event.clientY, row, column, part);
		
		if (row.value != -1) {
			var celltext = tree.view.getCellText(row.value, tree.columns[column.value.index]);
			this.httpTreeOverCell = celltext;
			
			menu.firstChild.setAttribute("command", "cmd_httpTreeItemMenuCellCopy");
			menu.firstChild.setAttribute("disabled", false);
			menu.firstChild.setAttribute("label", "Copy Cell '"+ celltext + "'");
			
		} else {
			this.httpTreeOverCell = null;
			menu.firstChild.removeAttribute("command");
			menu.firstChild.setAttribute("disabled", true);
			menu.firstChild.setAttribute("label", "Copy Cell");
		}
	},
	httpTreeCopyRowToClipBoard: function () {
		var tree = this.httpTree;
		
		var copytext = "";
		for (var i=0; i<tree.columns.count; i++) {
			copytext += tree.view.getCellText(tree.currentIndex, tree.columns[i]);
			if (i != tree.columns.count-1)  copytext += "\t";
		}

		this.addDataToClipBoard(copytext);
	},
	httpTreeCopyAllRowsToClipBoard: function () {
		var tree = this.httpTree;
		
		var start = new Object();
		var end = new Object();
		var copytext = "";
		
		var numRanges = tree.view.selection.getRangeCount();
		
		for (var i=0; i<numRanges; i++) {
			tree.view.selection.getRangeAt(i, start, end);
			if (end.value - start.value > 0 || numRanges > 1) {
	  			for (var v=start.value; v<=end.value; v++){
	    			for (var t=0; t<tree.columns.count; t++) {
	    				copytext += tree.view.getCellText(v, tree.columns[t]);
	    				if (t != tree.columns.count-1)  copytext += "\t";
	    			}
	    			copytext += "\r";
				}
				this.addDataToClipBoard(copytext);
			} else {
				this.httpTreeCopyRowToClipBoard();
			}
		}	
	},
	addDataToClipBoard: function (str_data) {
		var str = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
		
		if (!str) return false;
		str.data = str_data;
		
		var trans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable);
		if (!trans) return false;
		
		trans.addDataFlavor("text/unicode");
		trans.setTransferData("text/unicode", str, str_data.length * 2);
		
		var clipid = Components.interfaces.nsIClipboard;
		var clip = Components.classes["@mozilla.org/widget/clipboard;1"].getService(clipid);
		if (!clip) return false;
		
		clip.setData(trans, null, clipid.kGlobalClipboard);
	}
};
function trace (msg) {
	dump(msg + "\n");
}