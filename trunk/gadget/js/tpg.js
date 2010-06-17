var Tpg = {
}

Tpg.Usage = {
	Error: {
		unknown: 0,
		invalid: 1,
		parse: 2
	},

	scrape: function (username, password, onerror, onsuccess) {
		Helper.ajax("https://cyberstore.tpg.com.au/your_account/index.php?function=checkaccountusage",
		{
			check_username: username,
			password: password
		},
		function (r, data) {
			if (!r) {
				onerror(Tpg.Usage.Error.unknown);
				return;
			}

			if (data.indexOf("Invalid username") != -1) {
				onerror(Tpg.Usage.Error.invalid);
				return;
			}

			// Logout
			$.post("https://cyberstore.tpg.com.au/your_account/index.php?function=logout");

			var plan = /<b>Package Type:<\/b> (.+?)<\/td>/.exec(data);
			var peak = /Downloads used:.*?([\d.]+?) MB/.exec(data); // Don't look for peak, just use the first download
			var offpeak = /Off-Peak Downloads used:.*?([\d.]+?) MB/.exec(data);
			var expire = /<b>Expiry Date:<\/b>(.+?)<\/td>/.exec(data);
			
			if(!plan || !peak || !expire) {
				onerror(Tpg.usage.error.parse);
				return;
			}
			
			var data = {
				plan: plan[1],
				peak: parseFloat(peak[1]),
				offpeak: offpeak ? parseFloat(offpeak[1]) : null,
				expire: new Date(expire[1])
			}

			data.expire.setHours(23); data.expire.setMinutes(59); data.expire.setSeconds(59);

			onsuccess(data);
		});
	}
}

Tpg.Update = {
	check: function (success) {
		var self = this;

		$.ajax({
			type: "GET",
			url: "http://code.google.com/feeds/p/tpg-gadgetzor/downloads/basic",
			dataType: "text",
			error: function () {
			},
			success: function (data, msg, xhr) {
				// Bug in IE doesn't parse the xml correctly the first time
				var xml = xhr.responseXML;
				xml.loadXML(data);

				var content = $(xml).find("entry content").text();
				var v = new Number(/TPG Gadgetzor (\d+\.\d+\.\d+)/.exec(content)[1].replace(/\./g, ""));
				var d = /<a href="(.*)">Download<\/a>/.exec(content)[1];

				var current = new Number(System.Gadget.version.replace(/\./g, ""));
				if (v > current) {
					success({ version: v, download: d });
				}
			}
		});
	}
}
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