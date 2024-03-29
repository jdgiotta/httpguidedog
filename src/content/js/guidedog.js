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
		
		this.treerows = new Array();
		
		GuideDog.initialized = true;
	},
	observe: function (subject, topic, data) {
		try {
			subject.QueryInterface(Components.interfaces.nsIHttpChannel);
		}
		catch (nsHttpChannelException) {}
		switch (topic) {
			case "http-on-modify-request":				
				var isPending = !subject.isPending();
				
				var now = new Date();
				var url_str = subject.URI.asciiSpec;
				var operation_str = subject.requestMethod;
				
				this.addRowToHttpTree(now, operation_str, url_str, isPending);
				
				break;
			case "http-on-examine-response":
				var isPending = !subject.isPending();
				
				var original_uri_str = subject.originalURI.asciiSpec;
				var url_str = subject.URI.asciiSpec;
				var response_stat = subject.responseStatus;
				var mime_type = subject.getResponseHeader("Content-Type");
				var size = 0;
				try {
					size = subject.getResponseHeader("Content-Length");
				}
				catch (e) {
					//trace(e.toString());
				}
				
				if (original_uri_str != url_str) {
					this.updateToHttpTree("(Redirected)", "*", mime_type, original_uri_str);
				}
				
				this.updateToHttpTree(response_stat, size, mime_type, url_str, isPending);
				
				break;
			default:
				trace("unknown topic: " + topic);
				break;
		}
	},
	
	startCollectingData: function (button) {
		
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
		
		var startButton = document.getElementById("gdStartButton");
		startButton.setAttribute("disabled", false);
		
		var stopButton = document.getElementById("gdStopButton");
		stopButton.setAttribute("disabled", true);
		
		this.observerService.removeObserver(this, "http-on-modify-request");
		this.observerService.removeObserver(this, "http-on-examine-response");
		
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
	addRowToHttpTree: function (initTime, operation, url) {
		var start_str = initTime.getHours().toString()
							+ ":"
							+ ((initTime.getMinutes().toString().length < 2) ? "0" + initTime.getMinutes().toString() : initTime.getMinutes().toString())
							+ ":"
							+ initTime.getSeconds().toString()
							+ "."
							+ initTime.getMilliseconds().toString();
							
		var old_row = this.getRowByIdentifyingUrl(url);
		if (old_row) {
			this.updateToHttpTree("(Aborted)", "*", "*", url);
			old_row.element.id = "aborted";
		}
		
		var httpTreeChildren = document.getElementById("httpTreeChildren");
		var new_item = document.createElement("treeitem");
		var new_row = document.createElement("treerow");
		new_row.id = url;
		
		this.treerows.push({element:new_row, date:initTime});
		
		// Start Column 0
		var new_cell_initTime = document.createElement("treecell");
		new_cell_initTime.setAttribute("label", start_str);
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
	updateToHttpTree: function (response_stat, content_size, type, url, pending) {
		var row_to_update = this.getRowByIdentifyingUrl(url);
		var now = new Date();
		var difference_in_milsec = (now.getTime() - row_to_update.date.getTime())/1000;
		
		if (row_to_update) {
			// Duration Column 1
			var new_cell_duration = document.createElement("treecell");
			new_cell_duration.setAttribute("label", difference_in_milsec);
			row_to_update.element.replaceChild(new_cell_duration, row_to_update.element.childNodes[1]);
		
			// Size Column 2
			var new_cell_size = document.createElement("treecell");
			new_cell_size.setAttribute("label", content_size);
			row_to_update.element.replaceChild(new_cell_size, row_to_update.element.childNodes[2]);
			
			// Result Column 4
			var new_cell_stat = document.createElement("treecell");
			new_cell_stat.setAttribute("label", response_stat);
			row_to_update.element.replaceChild(new_cell_stat, row_to_update.element.childNodes[4]);
			
			// Type Column 5
			var new_cell_type = document.createElement("treecell");
			new_cell_type.setAttribute("label", type);
			row_to_update.element.replaceChild(new_cell_type, row_to_update.element.childNodes[5]);
			
			//if (!pending) row_to_update.element.id = "locked";
		}
	},
	getRowByIdentifyingUrl: function (id_url) {
		var row;
		for (var i=0; i<this.treerows.length; i++) {
			row = this.treerows[i];
			if (row.element.id == id_url) {
				return row;
			}
		}
		return false;
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
			
			if (column.value.id == "urlCol") {
				menu.firstChild.setAttribute("command", "cmd_httpTreeItemMenuOpenInTab");
				menu.firstChild.setAttribute("hidden" , false);
				menu.firstChild.setAttribute("disabled", false);
			} else {
				menu.firstChild.removeAttribute("command");
				menu.firstChild.setAttribute("hidden" , true);
				menu.firstChild.setAttribute("disabled", true);
			}
			
			menu.firstChild.nextSibling.setAttribute("command", "cmd_httpTreeItemMenuCellCopy");
			menu.firstChild.nextSibling.setAttribute("hidden" , false);
			menu.firstChild.nextSibling.setAttribute("disabled", false);
			menu.firstChild.nextSibling.setAttribute("label", "Copy Cell '"+ celltext + "'");
			
		} else {
			this.httpTreeOverCell = null;
			
			menu.firstChild.removeAttribute("command");
			menu.firstChild.setAttribute("disabled", true);
			
			menu.firstChild.nextSibling.removeAttribute("command");
			menu.firstChild.nextSibling.setAttribute("hidden" , true);
			menu.firstChild.nextSibling.setAttribute("disabled", true);
			menu.firstChild.nextSibling.setAttribute("label", "Copy Cell");
		}
	},
	httpTreeOpenCellURLToTab: function () {
		window.getBrowser().addTab(this.httpTreeOverCell, null, null);
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