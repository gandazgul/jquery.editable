# jQuery.Editable is an extensible jQuery edit-in-place plugin.

#### Author:
Carlos Ravelo (github.com/gandazgul)

#### Based on code by:
Edgar Muentes

#### Usage:
```javascript
$(".fullEdit").editable({
       	type: "textarea",
       	save: function(key, value, element){
               	//
       	},
        saveText: "Save",
       	cancelText: "Cancel"
});
```

* type:
	* text - Edit a single line of text on a dialog
	* textInline - Edit a single line of text inline
	* textarea - edit a paragraph in a dialog with a textarea
	* wysiwygAdv - edit a paragraph on a dialog using tinyMCE advanced theme
	* list - edit a UL, adding, removing and reordering
	* selectInline - providing a set of options user can choose the new content form those options.
		* type: "selectInline",
		* options: ['option1', 'option2', 'optionN']

* save: callback to enable you to do something useful with the new content the user input (e.g. an ajax call to save it to a DB)
	* key - value of the "data-key" attribute on the original element.
	* value - the new content modified by the user
	* element - a reference to the original element that fired the callback

* saveText - text to be displayed on the Save button on the dialog

* cancelText - text to be displayed on the Cancel button on the dialog

* Adding new edit types:
	1. Add a new widget to the widgets object.
	2. The widget function is called to setup the editing facilities, (e.g. open the dialog with an input and grab the
		text from the element, etc)
		Somewhere this function needs to call o.save() to trigger the save function passed in by the user.

