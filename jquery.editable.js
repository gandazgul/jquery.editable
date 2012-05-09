/**
 * Autor: Carlos Ravelo (github.com/gandazgul)
 * Based on code by: Edgar Muentes
 *
 * Usage:
 *
 * $(".fullEdit").editable({
 *		type: "textarea",
 *		save: function(key, value, element){
 *
 *		},
 *		saveText: "Save",
 *		cancelText: "Cancel"
 *	});
 *
 * Types:
 *   text - Edit a single line of text on a dialog
 *   textInline - Edit a single line of text inline
 *   textarea - edit a paragraph in a dialog with a textarea
 *   wysiwygAdv - edit a paragraph on a dialog using tinyMCE advanced theme
 *   list - edit a UL, adding, removing and reordering
 *   selectInline - providing a set of options user can choose the new content form those options.
 *     type: "selectInline",
 *     options: ['option1', 'option2', 'optionN']
 *
 * save - callback to enable you to do something useful with the new content the user input (e.g. an ajax call to save it to a DB)
 *    key - value of the "data-key" attribute on the original element.
 *    value - the new content modified by the user
 *    element - a reference to the original element that fired the callback
 *
 * saveText - text to be displayed on the Save button on the dialog
 * cancelText - text to be displayed on the Cancel button on the dialog
 *
 *
 * Adding new edit types:
 *   add a new widget to the widgets object.
 *   the widget function is called to setup the editing facilities, (e.g. open the dialog with an input and grab the
 *       text from the element, etc)
 *       - Somewhere this function needs to call o.save() to trigger the save function passed in by the user.
 */

(function($) {
    'use strict';

	var defaults = { //defaults
            type: 'text',
            options: null,
            save: null,
            saveText: 'Save',
            cancelText: 'Cancel'
        };

	$.fn.editable = function(opts) {
		var options = defaults;

		//set defaults
		if (opts){
			options = $.extend({}, defaults, opts);
		}

		//initialize dialog
		$('<div>', {id: "editableDialog", title: "Output/Editor", style: "text-align:center;"})
				.appendTo($('body'))
				.dialog({
					bgiframe: true,
					autoOpen: false,
					resizable: false,
					width:500,
					modal: false
				});

		$(this).each(function() {
			var $this = $(this),
				that = this,
				html = $this.html();

			$this.empty().append('<div>' + html + '<\/div>');

			$('<a>', { "class": "editable-link", "html": '&#8212;&nbsp;Edit' })
				.data('editable', options)
				.click(function() {
					var o = $(this).data('editable');

					o.link = this;
					o.element = that;

					$.editableWidgets[o.type] || $.editableWidgets[o.type]($('div', that), o);
				})
				.appendTo($this);
		});//each

		return this;
	}; //plugin

	//widgets
	$.editableWidgets = {
		text: function($content, o){
			var $dialogInput = $('<input>', {id: "editableInput", type: "text"}),
				save = function(){
					var content = $dialogInput.val();

					$content.text(content);//put content back
					o.save($(o.element).data('key'), content, o.element); //trigger save
				};

            $dialogInput
                .val($content.text())
                .keypress(function(e) {//alert(e.keyCode);
                    if (e.keyCode === 13) {
                        save();

                        $('#editableDialog').dialog('close');
                        return false;
                    }
                });

			$('#editableDialog')
					.empty()
					.append($dialogInput)
					.dialog('option', 'buttons', [
						{
							text: o.saveText,
							click: function() {
								save();

								$(this).dialog('close');
							}
						},
						{
							text: o.cancelText,
							click: function() {
								$(this).dialog("close");
							}
						}
					])
					.dialog('open');

			return true;
		},
		textarea: function($content, o){
			var content = $content.html(),
				$dialogTextArea = $('<textarea>', {id: "editableTextArea", rows: "8", cols: "80", style:"width:80%"});

			content = content.replace(/\n+/g, "");//delete extra carriage returns
			content = content.replace(/<[ ]*br[ ]*\/?>/gi, "\n");//replace <br> with carriage returns
			content = content.replace(/(<([^>]+)>)/i,"");//strip all other html tags

			$dialogTextArea.val(content);

			$('#editableDialog').empty().append($dialogTextArea).dialog('option', 'buttons', [
				{
					text: o.saveText,
					click: function() {
						var content = $dialogTextArea.val();
						content = content.replace(/(<([^>]+)>)/ig,"");
						content = content.replace(/\n/g, "<br />");
						$content.html(content);
						o.save($(o.element).data('key'), content, o.element);

						$(this).dialog('close');
					}
				},
				{
					text: o.cancelText,
					click: function() {
						$(this).dialog("close");
					}
				}
			]).dialog('open');

			return true;
		},
		wysiwygAdv: function($content, o){
			var $dialogTextArea = $('<textarea>', {id: "elm1", name:"elm1", "class":"tinymce",
					style: "width: 760px;"});

			$('#editableDialog').empty().append($dialogTextArea);

			$dialogTextArea.tinymce({
				paste_postprocess : function(pl, o) {
					// remove extra line breaks
					o.node.innerHTML = o.node.innerHTML.replace(/<p[^>]*>\s*(<br>|&nbsp;)\s*<\/p>/ig, "");
				},

				verify_css_classes : true,

				setup: function(ed) {
					ed.onInit.add(function(ed) {
						$('#' + ed.id).val($content.html());
					});
				}
			});

			$('#editableDialog').dialog('option', 'buttons', [
					{
						text: o.saveText,
						click: function() {
							var content = $dialogTextArea.html();
							$content.html(content);
							o.save($(o.element).data('key'), content, o.element);

							$(this).dialog('close');
						}
					},
					{
						text: o.cancelText,
						click: function() {
							$('#editableDialog').html('');
							$(this).dialog("close");
						}
					}
				])
				.dialog('option', 'width', '790')
				.dialog('option', 'resizable', '790')
				.dialog('open');

			return true;
		},
		//replaces element with a dropdown select box containing options passed as "options".
		selectInline: function($content, o){
			var newOptions = '<option selected="selected"><\/option>';

			$(o.options).each(function(index, value){
				newOptions += '<option>' + value + '<\/option>';
			});

			$('<select>', {html: newOptions}).change(function(){
				var content = $(this).val();

				$(this).remove();
				$(o.link).show();
				$content.text(content).show();

				o.save($(o.element).data('key'), content, o.element);
			}).insertAfter($content.hide());

			$(o.link).hide();

			return true;
		},
		//On line of text gets converted to an input
		textInline: function($content, o){
			var $inlineInput = $('<input>', {id: "editableInput", type: "text"})
					.val($content.text())
					.keydown(function(e) {//alert(e.keyCode);
						var content = $(this).val();

						if (e.keyCode === 13) {
							$content.text(content).show();
							$(o.link).show();
							o.save($(o.element).data('key'), content, o.element);

							$(this).remove();

							return false;
						}
						if (e.keyCode === 27) {
							$content.show();
							$(o.link).show();
							$(this).remove();

							return false;
						}
					});

			$content.after($inlineInput).hide();
			$inlineInput.focus();
			$(o.link).hide();

			return true;
		},
		list: function($content, o){
			$('#editableDialog').html('');
			var $addLiButton = $('<button>', {id: "saveLI", text:"Add item"}),
					$addLiInput = $('<input>', {id: "editableList", type: "text"}),
					$dialogList = $('<ul>', {"class": "sortable-list", html:$content.html()}),
					$dialogListDelete = $('<span>', {"class": "action delete js-editable-delete"});
			$('.js-editable-delete').live('click', function() {
				$(this).parent().remove();
			});

			$('#editableDialog')
					.append($dialogList)
					.append($addLiInput)
					.append($addLiButton);

			$dialogList.sortable();
			$dialogList.find('li').prepend($dialogListDelete);

			$addLiInput.keypress(function(e) {//alert(e.keyCode);
				if (e.keyCode === 13) {
					if ($addLiInput.val() !== "") {
						var newLiElem = $('<li>').text($addLiInput.val()).prepend($dialogListDelete.clone());
						$addLiInput.val("");
						$dialogList.append(newLiElem);
					}

					return false;
				}
			});

			$addLiButton.click(function() {
				if ($addLiInput.val() !== "") {
					var newLiElem = $('<li>').text($addLiInput.val()).prepend($dialogListDelete.clone());
					$addLiInput.val("");
					$dialogList.append(newLiElem);
				}
			});

			$('#editableDialog').dialog('option', 'buttons', [
				{
					text: o.saveText,
					click: function() {
						var content = $dialogList.html();

						$dialogList.find('li').find('span').remove();
						$content.html(content);
						o.save($(o.element).data('key'), content, o.element);

						$(this).dialog('close');
					}
				},
				{
					text: o.cancelText,
					click: function() {
						$(this).dialog("close");
					}
				}
			]).dialog('open');

			return true;
		},
		select: function($content, o){
			$('#editableDialog').html('');
			var $addOptionButton = $('<button>', {id: "saveOption", text:"Add item"}),
					$addOptionInput = $('<input>', {id: "editableSelect", type: "text"}),
					$dialogSelect = $('<ul>', {"class": "sortable-list actions", html:$content.html()}),
					$dialogListDelete = $('<span>', {"class": "ui-icon ui-icon-trash js-editable-delete"});
			$('.js-editable-delete').live('click', function() {
				$(this).parent().remove();
			});

			$('#editableDialog')
					.append($dialogSelect)
					.append($addOptionInput)
					.append($addOptionButton);
			$dialogSelect.sortable();
			$dialogSelect.find('li').prepend($dialogListDelete);
			$dialogSelect.find('option').replaceWith(function(index, value) {
				return $('<li>', {text: value});
			});

			$addOptionInput.keypress(function(e) {//alert(e.keyCode);
				if (e.keyCode === 13) {
					if ($addOptionInput.val() !== "") {
						var newOption = $('<li>').text($addOptionInput.val());
						$addOptionInput.val("");
						$dialogSelect.append(newOption);
					}

					return false;
				}
			});

			$addOptionButton.click(function() {
				if ($addOptionInput.val() !== "") {
					var newOption = $('<li>').text($addOptionInput.val()).prepend($dialogListDelete.clone());
					$addOptionInput.val("");
					$dialogSelect.append(newOption);
				}
			});


			$('#editableDialog').dialog('option', 'buttons', [
				{
					text: o.saveText,
					click: function() {
						var content = $dialogSelect.html();

						$dialogSelect.find('li').replaceWith(function(index, value) {
							return $('<option>', {text: value});
						});

						$content.html(content);
						o.save($(o.element).data('key'), content, o.element);

						$(this).dialog('close');
					}
				},
				{
					text: o.cancelText,
					click: function() {
						$(this).dialog("close");
					}
				}
			]).dialog('open');

			return true;
		}
	};
})(jQuery);
