kClonable (Functionally replacing Clonable)
By Kramer
060510

kClonable provides a simple interface for cloning
any part of the DOM into any other part of the
DOM, based on an "add more" button.

Be sure to include the dependant scripts shown in
the kClonable.js documentation before use.

For the utmost clarity, examine the included
demonstration file, "index.html."

To use:
	1) For each block of HTML that you want to clone,
		 give its outermost element a class of "clone."
		 The this node will hereafter be referred to as
		 the "clone container" and this node's parent
		 will be called the "main container."

	2) Now you need to create an insertion point
		 inside your main container. This is where new
		 clones will be inserted. Insert an HTML comment
		 as a sibling to your clones, wherever you
		 prefer, like so:
			 <!--clone:insertAfter--> (Use this if you want clones to be inserted after the comment)
			 <!--clone:insertBefore--> (Use this if you want clones to be inserted before the comment)

	3) Create any number of "create new clone" buttons
		 inside your main container. These can be any
		 element at all, to which an "onclick" event can
		 be attached. Mark them with the class "clone_
		 add".

	4) If you want clone_deletion functionality, then
		 create a delete button inside of each clone
		 container. Mark it with a class of "clone_del"

	5) You're done.
