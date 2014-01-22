/*!
 * Annotations Support for Patterns - v0.3
 *
 * Copyright (c) 2013-2014 Dave Olsen, http://dmolsen.com
 * Licensed under the MIT license
 *
 */

var annotationsPattern = {
	
	commentsOverlayActive:  false,
	commentsOverlay:        false,
	commentsEmbeddedActive: false,
	commentsEmbedded:       false,
	commentsGathered:       { "commentOverlay": "on", "comments": { } },
	
	/**
	* record which annotations are related to this pattern so they can be sent to the viewer when called
	*/
	gatherComments: function() {
		
		// make sure this only added when we're on a pattern specific view
		if (document.getElementById("sg-patterns") === null) {
			
			var count = 0;
			
			for (comment in comments.comments) {
				var item = comments.comments[comment];
				var els  = document.querySelectorAll(item.el);
				if (els.length > 0) {
					
					count++;
					item.displaynumber = count;
					
					for (var i = 0; i < els.length; ++i) {
						els[i].onclick = (function(item) {
							return function(e) {
								
								e.preventDefault();
								e.stopPropagation();
								var obj = {};
								
								// if an element was clicked on while the overlay was already on swap it
								obj = { "displaynumber": item.displaynumber, "el": item.el, "title": item.title, "comment": item.comment };
								
								var targetOrigin = (window.location.protocol == "file:") ? "*" : window.location.protocol+"//"+window.location.host;
								parent.postMessage(obj,targetOrigin);
								
							}
						})(item);
						
					}
				}
				
				
			}
			
		} else {
			
			var obj = { "commentOverlay": "off" };
			var targetOrigin = (window.location.protocol === "file:") ? "*" : window.location.protocol+"//"+window.location.host;
			parent.postMessage(obj,targetOrigin);
			
		}
		
	},
	
	/**
	* embed a comment by building the sg-annotations div (if necessary) and building an sg-annotation div
	* @param  {Object}      element to check the parent node of
	* @param  {String}      the title of the comment
	* @param  {String}      the comment HTML
	*/
	embedComments: function (el,title,comment) {
		
		// build the annotation div and add the content to it
		var annotationDiv = document.createElement("div");
		annotationDiv.classList.add("sg-annotation");
		
		var h3       = document.createElement("h3");
		var p        = document.createElement("p");
		h3.innerHTML = title;
		p.innerHTML  = comment;
		
		annotationDiv.appendChild(h3);
		annotationDiv.appendChild(p);
		
		// find the parent element to attach things to
		var parentEl = annotationsPattern.findParent(el);
		
		// see if a child with the class annotations exists
		var els = parentEl.getElementsByClassName("sg-annotations");
		if (els.length > 0) {
			els[0].appendChild(annotationDiv);
		} else {
			var annotationsDiv = document.createElement("div");
			annotationsDiv.classList.add("sg-annotations");
			annotationsDiv.appendChild(annotationDiv);
			parentEl.appendChild(annotationsDiv);
		}
		
	},
	
	/**
	* recursively find the parent of an element to see if it contains the sg-pattern class
	* @param  {Object}      element to check the parent node of
	*/
	findParent: function(el) {
		
		var parentEl;
		
		if (el.parentNode.classList.contains("sg-pattern")) {
			return el.parentNode;
		} else {
			parentEl = annotationsPattern.findParent(el.parentNode);
		}
		
		return parentEl;
		
	},
	
	/**
	* toggle the annotation feature on/off
	* based on the great MDN docs at https://developer.mozilla.org/en-US/docs/Web/API/window.postMessage
	* @param  {Object}      event info
	*/
	receiveIframeMessage: function(event) {
		
		// does the origin sending the message match the current host? if not dev/null the request
		if ((window.location.protocol != "file:") && (event.origin !== window.location.protocol+"//"+window.location.host)) {
			return;
		}
		
		if (event.data.commentToggle !== undefined) {
			
			var i, els, item, displayNum;
			
			// if this is an overlay make sure it's active for the onclick event
			annotationsPattern.commentsOverlayActive  = false;
			annotationsPattern.commentsEmbeddedActive = false;
			
			// see which flag to toggle based on if this is a styleguide or view-all page
			if ((event.data.commentToggle === "on") && (document.getElementById("sg-patterns") !== null)) {
				annotationsPattern.commentsEmbeddedActive = true;
			} else if (event.data.commentToggle === "on") {
				annotationsPattern.commentsOverlayActive  = true;
			}
			
			// if comments overlay is turned off make sure to remove the has-annotation class and pointer
			if (!annotationsPattern.commentsOverlayActive) {
				els = document.querySelectorAll(".has-annotation");
				for (i = 0; i < els.length; i++) {
					els[i].classList.remove("has-annotation");
				}
			}
			
			// if comments embedding is turned off make sure to hide the annotations div
			if (!annotationsPattern.commentsEmbeddedActive) {
				els = document.getElementsByClassName("sg-annotations");
				for (i = 0; i < els.length; i++) {
					els[i].style.display = "none";
				}
			}
			
			// if comments overlay is turned on add the has-annotation class and pointer
			if (annotationsPattern.commentsOverlayActive) {
				
				count = 0;
				
				for (i = 0; i < comments.comments.length; i++) {
					item = comments.comments[i];
					els  = document.querySelectorAll(item.el);
					
					if (els.length) {
						
						count++;
						
						//Loop through all items with annotations
						for (k = 0; k < els.length; k++) {
							
							els[k].classList.add("has-annotation");
							
							var numberDiv       = document.createElement("a");
							numberDiv.href      = "#annotation-" + count;
							numberDiv.classList.add("annotation-tip");
							numberDiv.innerHTML = count;
							
							var span            = document.createElement("span");
							span.appendChild(numberDiv);
							span.style.display  = "block";
							
							els[k].appendChild(span);
							
						}
						
					}
					
				}
				
				// count elements so it can be used when displaying the results in the viewer
				var count = 0;
				
				// iterate over the comments in annotations.js
				for(i = 0; i < comments.comments.length; i++) {
					
					var item = comments.comments[i];
					var els  = document.querySelectorAll(item.el);
					
					// if an element is found in the given pattern add it to the overall object so it can be passed when the overlay is turned on
					if (els.length > 0) {
						count++;
						annotationsPattern.commentsGathered.comments[count] = { "el": item.el, "title": item.title, "comment": item.comment, "number": count };
					}
				
				}
				
				// send the list of annotations for the page back to the parent
				var targetOrigin = (window.location.protocol == "file:") ? "*" : window.location.protocol+"//"+window.location.host;
				parent.postMessage(annotationsPattern.commentsGathered,targetOrigin);
				
			} else if (annotationsPattern.commentsEmbeddedActive && !annotationsPattern.commentsEmbedded) {
				
				// if comment embedding is turned on and comments haven't been embedded yet do it
				for (i = 0; i < comments.comments.length; i++)  {
					item = comments.comments[i];
					els  = document.querySelectorAll(item.el);
					if (els.length > 0) {
						annotationsPattern.embedComments(els[0],item.title,item.comment); //Embed the comment
					}
					annotationsPattern.commentsEmbedded = true;
				}
				
			} else if (annotationsPattern.commentsEmbeddedActive && annotationsPattern.commentsEmbedded) {
				
				// if comment embedding is turned on and comments have been embedded simply display them
				els = document.getElementsByClassName("sg-annotations");
				for (i = 0; i < els.length; ++i) {
					els[i].style.display = "block";
				}
				
			}
			
		}
		
	}
	
};

// add the onclick handlers to the elements that have an annotations
annotationsPattern.gatherComments();
window.addEventListener("message", annotationsPattern.receiveIframeMessage, false);

// before unloading the iframe make sure any active overlay is turned off/closed
window.onbeforeunload = function() {
	var obj = { "commentOverlay": "off" };
	var targetOrigin = (window.location.protocol === "file:") ? "*" : window.location.protocol+"//"+window.location.host;
	parent.postMessage(obj,targetOrigin);
};