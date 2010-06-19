
var Atom = {};

Atom.Feed = function (id, title, updated, entries) {
	this.id = id;
	this.title = title;
	this.updated = updated;
	this.entries = entries;
}

Atom.Entry = function (id, title, updated, link, author, content) {
	this.id = id;
	this.title = title;
	this.updated = updated;
	this.link = link;
	this.author = author;
	this.content = content;
}

Atom.Content = function (type, body) {
	this.type = type;
	this.body = body;
}

Atom.parse = function (xml) {

}

Atom.pull = function (params) {
	var self = this;

	$.ajax({
		type: "GET",
		url: params.url,
		data: params.args,
		dataType: "xml",
		success: function (xml) {
			params.success(self.parse(xml));
		} 
	});
}