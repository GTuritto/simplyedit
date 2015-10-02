	editor.toolbar = {
		getToolbarEl : function(el) {
			while ( el && el.tagName!='div' && !/\bvedor-toolbar\b/.test(el.className) ) {
				el = el.parentNode;
			}
			return el;
		},
		getSectionEl : function(el) {
			while ( el && el.tagName!='div' && !/\bvedor-toolbar-section\b/.test(el.className) ) {
				el = el.parentNode;
			}
			return el;
		},
		handleButton : function(el) {
			var toolbar = editor.toolbar.getToolbarEl(el);
			var section = editor.toolbar.getSectionEl(el);
			var i;
			var l;
			var selectedSectionButtons;


			if ( !section ) {
				var sections = toolbar.querySelectorAll('.vedor-toolbar-section.vedor-selected, .vedor-toolbar-status');
				for ( i=0, l=sections.length; i<l; i++ ) {
					sections[i].className = sections[i].className.replace(/\bvedor-selected\b/,'');
				}
				selectedSectionButtons = toolbar.querySelectorAll('ul.vedor-buttons button.vedor-selected');
				for ( i=0, l=selectedSectionButtons.length; i<l; i++ ) {
					selectedSectionButtons[i].className = selectedSectionButtons[i].className.replace(/\bvedor-selected\b/,'');
				}
				if ( !selectedSectionButtons[0] || el != selectedSectionButtons[0] ) {
					el.className += ' vedor-selected';
					var rel = el.dataset.vedorSection;
					if ( rel ) {
						var target = toolbar.querySelector('.vedor-toolbar-section.' + rel );
						if ( target ) {
							target.className += ' vedor-selected';
							var focusTarget = target.querySelector("LI > *");
							if (focusTarget) {
								focusTarget.focus();
							}
						}
					}
				} else {
					var status = toolbar.querySelectorAll('.vedor-toolbar-status')[0];
					if ( status ) {
						status.className += ' vedor-selected';
					}
				}
			} else {
				selectedSectionButtons = section.querySelectorAll('.vedor-selected');
				for ( i=0, l=selectedSectionButtons.length; i<l; i++ ) {
					selectedSectionButtons[i].className = selectedSectionButtons[i].className.replace(/\bvedor-selected\b/,'');
				}
				if ( !selectedSectionButtons[0] || el != selectedSectionButtons[0] ) {
					el.className += ' vedor-selected';
				}
			}
		},
		addMarkers : function() {
			var toolbars = document.querySelectorAll(".vedor-toolbar");

			for (var i=0; i<toolbars.length; i++) {
				editor.toolbar.addMarker(toolbars[i]);
			}
		},
		addMarker : function(toolbar) {
			if (!toolbar.querySelector("div.marker")) {
				var marker = document.createElement("div");
				marker.className = "marker";
				toolbar.insertBefore(marker, toolbar.firstChild);
			}
		},
		init : function(toolbar) {
			toolbar.addEventListener("click", function(evt) {
				evt.preventDefault();
				var el = evt.target;
				if ( el.tagName=='I' ) {
					el = el.parentNode;
				}

				if ( el.tagName == 'BUTTON' ) {
					switch(el.getAttribute("data-vedor-action")) {
						case null:
						break;
						default:
							var action = editor.actions[el.getAttribute("data-vedor-action")];
							if (action) {
								var result = action(el);
								if (!result) {
									return;
								}
							} else {
								console.log(el.getAttribute("data-vedor-action") + " not yet implemented");
							}
						break;
					}

					evt.target.blur();
					editor.toolbar.handleButton(el);
				}
			});

			var inputs = toolbar.querySelectorAll("select[data-vedor-action], input[data-vedor-action], textarea[data-vedor-action]");
			var handleChange = function(evt) {
				var action = editor.actions[this.getAttribute("data-vedor-action")];
				if (action) {
					var result = action(this.value);
				} else {
					console.log(this.getAttribute("data-vedor-action") + " not yet implemented");
				}
			};

			for (var i=0; i<inputs.length; i++) {
				inputs[i].addEventListener("change", handleChange);
			}

			editor.toolbar.addMarker(toolbar);
		}
	};

	var lastEl = null;
	var lastSection = document.querySelector('.vedor-toolbar-status');
	var vedorSections = document.querySelectorAll(".vedor-section");

	editor.node = {
		parents : function(target) {
			var result = [];
			// while(target && (target.nodeType == 1) && !target.classList.contains("editable")) {
			while(target && (target.nodeType == 1)) {
				result.push(target);
				target = target.parentNode;
			}
	
			return result;
		},
		hasEditableParent : function(checkParent) {
			var parent = checkParent;
			while (parent && parent.parentNode) {
				if (parent.parentNode.getAttribute && parent.parentNode.getAttribute("data-vedor-field")) {
					return true;
				}
				if (parent.parentNode.className && parent.parentNode.className.match(/\beditable\b/)) {
					return true;
				}
				parent = parent.parentNode;
			}
			return false;
		},
		hasToolbarParent : function(checkParent) {
			var parent = checkParent;
			while (parent && parent.parentNode) {
				if (parent.parentNode.className && parent.parentNode.className.match(/\bvedor-toolbar\b/)) {
					return true;
				}
				if (parent.parentNode.className && parent.parentNode.className.match(/\bvedor-dialog\b/)) {
					return true;
				}
				parent = parent.parentNode;
			}
			return false;
		},
		getUneditableParent : function(checkParent) {
			var parent = checkParent;
			while (parent) {
				if (parent.className && parent.className.match(/\buneditable\b/)) {
					return parent;
				} else if (parent.className && parent.className.match(/\beditable\b/)) {
					return false;
				}
				parent = parent.parentNode;
			}
			return false;
		},
		getAllStyles : function(elem) {
			if (!elem) return []; // Element does not exist, empty list.
			if (elem == document) { return []; } // Document is not what we are looking for;

			var win = document.defaultView || window, style, styleNode = [];
			var i;

			if (win.getComputedStyle) { /* Modern browsers */
				style = win.getComputedStyle(elem, '');
				for (i=0; i<style.length; i++) {
					styleNode[style[i]] = style.getPropertyValue(style[i]);
					//			   ^name ^		   ^ value ^
				}
			} else if (elem.currentStyle) { /* IE */
				style = elem.currentStyle;
				for (var name in currentStyle) {
					styleNode[name] = currentStyle[name];
				}
			} else { /* Ancient browser..*/
				style = elem.style;
				for (i=0; i<style.length; i++) {
					styleNode[style[i]] = style[style[i]];
				}
			}
			return styleNode;
		},
		getEditableField : function() {
			var sel = vdSelectionState.get();
			var parent = vdSelection.getNode(sel);
			if (sel) {
				while(parent && parent != document) {
					if (parent.className && parent.className.match(/\beditable\b/)) {
						return parent;
					} else if (parent.getAttribute("data-vedor-field")) {
						return parent;
					} else {
						parent = parent.parentNode;
					}
				}
				return false;
			}
			return false;
		},
		replaceTags : function(source, target) {
			var field = editor.node.getEditableField();
			if (!field) {
				return;
			}
			var sel = vdSelectionState.get();
			vedor.editor.bookmarks.set(sel);

			var elms = field.querySelectorAll(source);
			for (var i=0; i<elms.length; i++) {
				var newNode = document.createElement(target);
				newNode.innerHTML = elms[i].innerHTML;

				elms[i].parentNode.replaceChild(newNode, elms[i]);
			}

			vedor.editor.bookmarks.select();
			vedor.editor.bookmarks.remove();
		},
		replaceStyleToClass : function(source, target) {
			var field = editor.node.getEditableField();
			if (!field) {
				return;
			}

			var elms = field.querySelectorAll("[style='" + source + "']");
			for (var i=0; i<elms.length; i++) {
				elms[i].classList.add(target);
				elms[i].removeAttribute("style");
			}
		},
		replaceClassToStyle : function(source, target) {
			var field = editor.node.getEditableField();
			if (!field) {
				return;
			}
			var elms = field.querySelectorAll("[class*='" + source + "']");
			for (var i=0; i<elms.length; i++) {
				elms[i].classList.remove(source);
				elms[i].setAttribute("style", target);
			}
		}
	};

	editor.context = {
		touching : false,
		skipUpdate : false,
		weigh : function(filter, targets) {
			var sel = vdSelectionState.get();

			var target = targets.shift();
			while (target) {
				var tempNode = document.createElement("DIV");
				tempNode.appendChild(target.cloneNode(false));
				var result = 0;
				if (
					( (typeof filter.selector !== 'undefined') ? tempNode.querySelectorAll(":scope > " + filter.selector).length : true) && 
					( (typeof filter["sel-collapsed"] !== 'undefined') ? (sel.collapsed == filter["sel-collapsed"]) : true)
				) {
					result += 50 * (targets.length+1); // tagName weight
					if (typeof filter.selector !== 'undefined') {
						result += 2*(filter.selector.split(".").length-1); // Add the number of class selectors;
						result += 2*(filter.selector.split("[").length-1); // Add the number of attribute selectors
					}

					if (typeof filter["sel-collapsed"] !== 'undefined') {
						result += 1;
					}
					if (typeof filter.parent == 'undefined') {
						return result;
					} else {
						var parentResult = editor.context.weigh(filter.parent, targets);
						if (parentResult) {
							return result + parentResult;
						} else {
							return 0;
						}
					}
				}
				target = targets.shift();
			}
			return 0;
		},
		get : function() {
			var sel = vdSelectionState ? vdSelectionState.get() : false;

			if (sel) {
				var parent = vdSelection.getNode(sel);

				if ((parent && parent.getAttribute && (parent.getAttribute("contenteditable") || parent.getAttribute("data-vedor-selectable"))) || editor.node.hasEditableParent(parent)) {
					if (parent || parent.getAttribute || parent.getAttribute("contenteditable")) {
						var validFilters = {};
						var bestFilter = false;
						var bestFilterWeight = 0;
						for (var i in editor.contextFilters) {
							var filter = editor.contextFilters[i];
							var filterWeight = editor.context.weigh(filter, editor.node.parents(parent));

							if (filterWeight) {
								validFilters[i] = filterWeight;
								if (filterWeight > bestFilterWeight) {
									bestFilter = filter.context;
									bestFilterWeight = filterWeight;
								}
							}
						}
						return bestFilter;
					} else {
						if (sel.collapsed) {
							return "vedor-text-cursor";
						} else {
							return "vedor-text-selection";
						}
					}
				} else {
					return "vedor-no-context";
				}
			}
		},
		toolbar : {
			getPosition : function(sel) {
				var ltop, lleft, rleft, rtop, top, left;

				var range = sel; //.getRangeAt(0);
				if ( !range ) {
					return null;
				}
				var rects = range.getClientRects();
				var parent = vdSelection.getNode(sel);
				if ( !rects.length ) {
					// insert element at range and get its position, other options aren't exact enough
					var span = document.createElement('span');
					if ( span.getClientRects ) {
						// Ensure span has dimensions and position by
						// adding a zero-width space character
						try {
							span.appendChild( document.createTextNode("\u200b") );
							range.insertNode(span);
							rects = span.getClientRects();
							var spanParent = span.parentNode;
							spanParent.removeChild(span);
							// Glue any broken text nodes back together
							spanParent.normalize();
						} catch(e) {
						}
					}
				}
				if ( rects.length ) {
					ltop = rects[0].top;
					lleft = rects[0].left;
					rleft = rects[rects.length-1].right;
					rtop = rects[rects.length-1].bottom; 
				}
				if ( !rects.length || parent.getAttribute("data-vedor-selectable") ) {
					pos = parent && parent.getBoundingClientRect ? parent.getBoundingClientRect() : { left: 0, top: 0, right: 0, bottom: 0};
					lleft = pos.left;
					ltop = pos.top;
					rleft = pos.right;
					rtop = pos.bottom;
				}
				// fallback... if nothing else works
				if ( lleft === 0 && rleft === 0 && ltop === 0 && rtop === 0 ) {
					parent = vdSelection.parentNode(sel);
					if ( !parent || !parent.getBoundingClientRect ) {
						return false;
					}
					pos = parent.getBoundingClientRect();
					lleft = pos.left;
					ltop = pos.top;
					rleft = pos.right;
					rtop = pos.bottom;
				}

				ltop += document.body.scrollTop ? document.body.scrollTop : pageYOffset;
				lleft += document.body.scrollLeft ? document.body.scrollLeft : pageXOffset;
				rtop += document.body.scrollTop ? document.body.scrollTop : pageYOffset;
				rleft += document.body.scrollLeft ? document.body.scrollLeft : pageXOffset;

				top = Math.max(ltop, rtop);
				left = lleft + ((rleft - lleft) / 2);

				return { top: top, left: left, ltop: ltop, lleft: lleft, rtop: rtop, rleft: rleft };
			},
			reposition : function() {
				var markerLeft, scrollHeight, scrollTop;

				var sel = vdSelectionState.get();
				var currentContext = editor.context.get();

				var activeSection = document.getElementById(currentContext);
				var pos = editor.context.toolbar.getPosition(sel);
				if ( !pos || !activeSection ) {
					hideToolbar(true);
					return;
				}
				var top = pos.top;
				var left = pos.left;
					
				var activeToolbar = activeSection.querySelector("div.vedor-toolbar");
				top += document.body.offsetTop;
				var newleft = left - (activeToolbar.offsetWidth/2);
				if (newleft < 0) {
					markerLeft = activeToolbar.offsetWidth/2 + newleft;
					activeToolbar.getElementsByClassName("marker")[0].style.left = markerLeft+'px';
					newleft = 0;
				} else if (newleft + activeToolbar.offsetWidth > document.body.offsetWidth) {
					var delta = newleft + activeToolbar.offsetWidth - document.body.offsetWidth;
					markerLeft = activeToolbar.offsetWidth/2 + delta;
					activeToolbar.getElementsByClassName("marker")[0].style.left = markerLeft+'px';
					newleft = document.body.offsetWidth - activeToolbar.offsetWidth;
				} else {
					activeToolbar.getElementsByClassName("marker")[0].style.left = "50%";
				}
				// Move the toolbar to beneath the top of the selection if the toolbar goes out of view;
				// check the position 
				// - if toolbar bottom <= editor pane bottom, no problem
				// - if toolbar can be repositioned, no problem
				// - if edit pane content can be scrolled down, no problem
				// - else: add space on the bottom so that you can scroll down
				var editPaneRect = document.body.getBoundingClientRect();
				var toolbarRect = activeSection.getBoundingClientRect();
				if ( top + toolbarRect.height > editPaneRect.height ) {
					// toolbar extends beyond bottom edge if not repositioned
					var mintop = Math.min(pos.ltop, pos.rtop);
					if ( mintop + toolbarRect.height <= editPaneRect.height ) {
						// toolbar can be repositioned
						// FIXME: min top should be position of the cursor, not selection
						top = editPaneRect.height - toolbarRect.height;
					} else {
						top = mintop;
						scrollHeight = Math.max(document.body.scrollHeight, document.body.clientHeight);
						scrollTop    = Math.max(document.body.scrollTop, document.documentElement.scrollTop);
						if ( scrollTop >= (scrollHeight - document.body.clientHeight - toolbarRect.height ) ) {
							// no more scroll space, so add it.
							document.body.classList.add('vedor-footer-space');
						}
					}
				}
				if ( document.body.classList.contains('vedor-footer-space') ) {
					scrollHeight = Math.max(document.body.scrollHeight, document.body.clientHeight);
					scrollTop    = Math.max(document.body.scrollTop, document.documentElement.scrollTop);
					if ( scrollTop < (scrollHeight - document.body.clientHeight - toolbarRect.height - 132 )) {
						document.body.classList.remove('vedor-footer-space');
					}
				}
				activeSection.style.top = top + 10 + "px"; // 10 is the height of the marker arrow
				activeSection.style.left = newleft + "px";
			}
		},
		show : function() {
			// vdSelectionState.remove(); // FIXME: deze is nodig voor text toolbar update, maar maakt selectie bij lists stuk.
			var currentContext = editor.context.get();

			var sections = document.querySelectorAll("section.vedor-section");
			for (var i=0; i<sections.length; i++) {
				sections[i].classList.remove("active");
			}

			editor.context.initProperties(currentContext);

			var hideIt = function() {
				var sections = document.querySelectorAll("section.vedor-section");
				for (var j=0; j<sections.length; j++) {
					if (!(sections[j].className.match(/active/))) {
						sections[j].style.left = "-10000px";
					}
				}
			};
			//window.setTimeout(hideIt, 200);

			var activeSection = document.getElementById(currentContext);
			// console.log(activeSection);

			if (activeSection && !vdHideToolbars) {
				var htmlContext = activeSection.querySelectorAll("div.vedor-toolbar-status")[0];
				if ( htmlContext ) {
					htmlContext.classList.add("vedor-selected");
				}
				// activeSection.style.display = "block";
				activeSection.className += " active";
				hideIt(); // window.setTimeout(hideIt, 200);

				var sel = vdSelectionState.get();
				var parent = vdSelection.getNode(sel);
				if (parent == document) {
					return;
				}

				editor.context.toolbar.reposition();

				if (editor.context.touching) {
					// FIXME: Android fix here
					// restore selection triggers contextupdate, which triggers restore selection - this hopefully prevents that loop.
					editor.context.skipUpdate = true;
					if (!sel.collapsed) {
						// FIXME: This reverses the
						// current selection, which
						// causes problems selecting
						// from right to left; It is
						// needed to allow text
						// selection on android.
						vdSelectionState.restore(sel); 
					}
					window.setTimeout(function() { editor.context.skipUpdate = false;}, 20);
				}
			} else {
				hideIt();
			}

			if (document.getElementById("VD_DETAILS")) {
				if (showBorders) {
					document.getElementById('VD_DETAILS').classList.add('vedor-selected');
				} else {
					document.getElementById('VD_DETAILS').classList.remove('vedor-selected');
				}
			}

			if (document.getElementById('vdShowTagBoundaries')) {
				if (showTagBoundaries) {
					document.getElementById('vdShowTagBoundaries').classList.add('vedor-selected');
				} else {
					document.getElementById('vdShowTagBoundaries').classList.remove('vedor-selected');
				}
			}

			if (document.getElementById('vdShowTagStack')) {
				if (showTagStack) {
					document.getElementById('vdShowTagStack').classList.add('vedor-selected');
				} else {
					document.getElementById('vdShowTagStack').classList.remove('vedor-selected');
				}
			}
		},
		initProperties : function(context) {
			if (editor.toolbars[context] && editor.toolbars[context].update) {
				return editor.toolbars[context].update(document.getElementById(context));
			}

			switch (context) {
				case "vedor-text-selection" :
				case "vedor-table-cell-selection":
				case "vedor-image" :
				case "vedor-hyperlink" :
					vdHideToolbars = false;
				break;
				default:
				break;
			}
		},
		fixSelection : function() {
			// check the current selection and update it if necessary
			var sel = vdSelectionState.get();
			var parent = vdSelection.getNode(sel);

			// console.log(parent);
			var selParent = editor.node.getUneditableParent(parent);
			if (selParent) {
				// console.log(selParent);
				// Selection if part of something uneditable
				sel.selectNode(selParent);
				sel.startContainer.ownerDocument.defaultView.getSelection().removeAllRanges();
				sel.startContainer.ownerDocument.defaultView.getSelection().addRange(sel);
				vdSelectionState.save(sel);
				sel.startContainer.ownerDocument.defaultView.getSelection().removeAllRanges();
			}

		},
		getTagStack : function() {
			var sel	= vdSelectionState.get();
			var parent = vdSelection.getNode(sel);
			var newContextStack	= [];

			if (sel) {
				while (parent && editor.node.hasEditableParent(parent) && parent.parentNode) {
					newContextStack.push(parent);
					parent=parent.parentNode;
				}
			}

			return newContextStack;
		},
		update : function() {
			// Check if the current selection is part of an uneditable thing, if so, move the selection to that parent;
			var sel = vdSelectionState.get();
			var parent = vdSelection.getNode(sel);

			// Skip the update when the selection is within a toolbar;
			if (editor.node.hasToolbarParent(parent)) {
				return;
			}
			if (document.querySelector(":focus") && editor.node.hasToolbarParent(document.querySelector(":focus"))) {
				return;
			}
			if (editor.context.skipUpdate) {
				return;
			}
			editor.context.fixSelection();
			editor.context.show();
			vdHtmlContextStack = editor.context.getTagStack();
		}
	};

	editor.plugins.dialog = {
		backdrop : null,
		open : function(target, callback) {
			vdSelectionState.save();
			if (!editor.plugins.dialog.backdrop) {
				editor.plugins.dialog.createBackdrop();
			}
			document.body.classList.add("vedor-overflow-hidden");
			editor.plugins.dialog.backdrop.style.display = "block";
			target.classList.add("active");
			if (typeof callback == "function") {
				callback();
			}
		},
		close : function(callback) {
			target = document.querySelector(".vedor-dialog.active");
			editor.plugins.dialog.backdrop.style.display = "none";
			document.body.classList.remove("vedor-overflow-hidden");
			target.classList.remove("active");
			vdSelectionState.restore();
			vdSelectionState.remove();
			if (typeof callback == "function") {
				callback();
			}
		},
		createBackdrop : function() {
			if (!editor.plugins.dialog.backdrop) {
				backdrop = document.createElement("IFRAME");
				backdrop.className = "vedor-dialog-backdrop";
				backdrop.style.display = "none";
				backdrop.style.width = "100%";
				backdrop.style.height = "100%";
				backdrop.style.top = 0;
				backdrop.style.left = 0;
				backdrop.style.position = "fixed";
				backdrop.style.zIndex = 100;
				backdrop.style.border = 0;
				backdrop.style.backgroundColor = "rgba(255,255,255,0.7)";
				document.body.appendChild(backdrop);
				editor.plugins.dialog.backdrop = backdrop;
			}
		},
		fullscreen : function(button) {
			var dialog = editor.plugins.dialog.getDialogEl(button);
			if (dialog.classList.contains("fullscreen")) {
				button.classList.remove("vedor-selected");
				dialog.classList.remove("fullscreen");
			} else {
				button.classList.add("vedor-selected");
				dialog.classList.add("fullscreen");
			}
		},
		getDialogEl : function(el) {
			while ( el && el.tagName!='div' && !/\bvedor-dialog\b/.test(el.className) ) {
				el = el.parentNode;
			}
			return el;
		}
	};
	editor.addAction("vedor-dialog-fullscreen", editor.plugins.dialog.fullscreen);
	editor.addAction("vedor-dialog-close", editor.plugins.dialog.close);

	vdHideToolbars = false;

	if( window.getSelection ) {
		var selection = document.defaultView.getSelection();
		if( selection && selection.setBaseAndExtent ) { // broken webkit
			document.addEventListener("click", function(event) {
				var target = muze.event.target(event);
				if( target.tagName == 'IMG' ) {
					var selection = document.defaultView.getSelection();
					selection.setBaseAndExtent(target, 0, target, 1);
					vdEditPane_DisplayChanged();
				}
			});
		}
	}

	function registerChange(field) {
	}

	var updateHtmlTimer;
	function vdEditPane_DisplayChanged() {
		if (updateHtmlTimer) {
			window.clearTimeout(updateHtmlTimer);
		}
		updateHtmlTimer = window.setTimeout(function() {
			editor.context.update();
		}, 100);

		return true;
	}

	function vdStoreUndo() {
	}

	var vdSelection, vdSelectionState;
	var initSelections = function() {
		if (typeof vedor === "undefined") {
			window.setTimeout(initSelections, 100);
			return;
		}
		vdSelectionState = vedor.editor.selection;
		vdSelection = vedor.dom.selection;
		vdSelectionState.init(window);
		selectionchange.start(document); // onselectionchange event for Firefox

		muze.event.attach( document, 'selectionchange', editor.context.update );
		muze.event.attach( document, 'keyup', editor.context.update );

		muze.event.attach( document, 'touchstart', function(evt) {
			editor.context.touching = true;
		});
		muze.event.attach( document, 'touchend', function(evt) {
			editor.context.touching = false;
		});
	};

	initSelections();