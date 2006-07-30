var GuideDog = {
	initialized: false,
	initialize: function () {		
		this.httpTreeOverCell = null;
		
		this.appContentSplitter = document.getElementById("gdContentSplitter");
		
		this.httpTree = document.getElementById("httpTree");
		
		this.appTabBox = document.getElementById("gdTabBox");
		
		this.appContentBox = document.getElementById("gdContentBox");
		this.appContentBox.collapsed = true;
		this.appContentBoxCollapsed = true;
		
		GuideDog.initialized = true;
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
		this.appContentBox.setAttribute("collapsed", !show);
		this.appContentSplitter.setAttribute("collapsed", !show);
	},
	httpTreeCopyRowCellToClipBoard: function () {
		if (this.httpTreeOverCell != null) this.addDataToClipBoard(this.httpTreeOverCell);
	},
	addRowToHttpTree: function () {
		//TODO: add row code
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