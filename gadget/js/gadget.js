var fly = System.Gadget.Flyout;
fly.file = "flyout.html";
System.Gadget.settingsUI = "settings.html";
System.Gadget.onSettingsClosed = settings_closed;

var $peak, $offpeak, $expire, $refresh;
var timer;

function gadget_load() {
	$peak = $(".bar-peak");
	$offpeak = $(".bar-offpeak");
	$expire = $(".bar-expire");
	$refresh = $(".refresh");
	
	$refresh.click(function() {
		get_usage();
	});
	
	get_usage();
}

function settings_closed(e) {
	if (e.closeAction == e.Action.commit) {
		get_usage();
	}
}

function get_usage() {
	tpg.settings.load();
	if (!tpg.settings.username) {
		return;
	}

	window.clearTimeout(timer);
	$refresh.removeClass("error").addClass("processing");
	set_msg();
	fly.show = false;

	tpg.usage.scrape(tpg.settings.username, tpg.settings.password,
		function (error) {
			switch (error) {
				case tpg.usage.error.invalid:
					set_error("invalid login");
					break;
				case tpg.usage.error.unknown:
					set_error("problem getting usage");
					timer = window.setTimeout(get_usage, 1000 * 20);
					break;
				case tpg.usage.error.parse:
					set_error("parse error, need to update gadget");
					break;
			}

		}, function (data) {
			$refresh.removeClass("processing");
		
			// Header
			var $plan_a = $("<a href='javascript:;'></a>").html(data.plan.substring(0, 20) + "...");			
			$("h1").attr("title", data.plan).html($plan_a);

			var period = new Period(data.expire);
			
			// Peak
			var peak = new Usage("Peak", tpg.settings.peak_quota, data.peak, period);
			set_usage($peak, peak, period);
			
			// Offpeak
			if(tpg.settings.offpeak_quota > 0 && data.offpeak !== null) {
				var offpeak = new Usage("Off-Peak", tpg.settings.offpeak_quota, data.offpeak, period);
				set_usage($offpeak, offpeak, period);
			}
			
			// Expire
			$expire.find(".bar-extend").css("width", period.percent + "%");
			$expire.find("span").html(period.percent + "%");
			var expireRemainingString = Math.floor(period.remaining.days) + " " +
			tpg.pluralise(Math.floor(period.remaining.days), "day") + " " +
			Math.floor(period.remaining.hours) + " " +
			tpg.pluralise(Math.floor(period.remaining.hours), "hour");
			$expire.attr("title", expireRemainingString + " remaining");

			var updated = new Date().toString();
			updated = updated.substring(0, updated.indexOf("UTC"));
			
			doFlyout($expire, "Expiration", function (win) {
				win.append("Remaining", expireRemainingString);
				win.append("Updated", updated);
			});
			
			$refresh.attr("title", "Last updated " + updated);
			timer = window.setTimeout(get_usage, 1000 * 60 * 60 * tpg.settings.interval);
		});
}

function doFlyout($bar, title, func) {
	$bar[0].onclick = function () {
		var onShow = function () {
			var win = fly.document.parentWindow;
			win.title(title);
			win.clear();
			func(win);
		}

		if (!fly.show) {
			fly.onShow = onShow;
			fly.show = true;
		} else {
			onShow();
		}
	}
}

function set_usage($bar, usage, period) {
	doFlyout($bar, usage.type, function (win) {
		win.append("Download MB", Math.floor(usage.download) + " / " + usage.quota);
		win.append("Remaining MB", Math.floor(usage.remaining));
		win.append("Remaining MB/d", Math.floor(usage.remaining / period.remaining.days));
		win.append("Remaining kB/s", Math.floor(usage.remaining / period.remaining.seconds * 1024));
		win.append("Target Surplus", Math.floor(usage.surplus) + " (" + Math.round(Math.abs(usage.surplus) / (usage.remaining / period.remaining.days)) + "d)");
	});

	$bar.find(".bar-expected").css("background-position", "bottom " + usage.expected / usage.quota * 100 + "%");
	$bar.find(".bar-extend").css("width", (usage.percent > 100 ? 99 : usage.percent) + "%");
	$bar.find("span").html(usage.percent + "%");
	$bar.attr("title", Math.abs(Math.floor(usage.remaining)) + " MB " + (usage.remaining > 0 ? "remaining" : "over quota") + " (" + usage.type + ")");
}

function set_msg(msg, processing) {
	if (!processing) processing = false;
	$(".msg").toggle(msg != null).toggleClass("processing", processing).html(msg);
}

function set_error(error) {
	$refresh.addClass("error").attr("title", error);
}

function go(to, params) {
	var $form = $("<form method='post' action='" + to + "'></form>");
	for (k in params) {
		var $i = $("<input name='" + k + "' />");
		$i.val(params[k]);
		$form.append($i);
	}
	$(document.body).append($form);
	$form.submit();
	$form.remove();
}

function Usage(type, quota, download, period) {
	this.type = type;
	this.quota = quota;
	this.download = download;
	this.remaining = this.quota - this.download;
	this.percent = Math.floor(this.download / this.quota * 100);
	this.expected = this.quota / period.total.days * period.passed.days;
	this.surplus = this.expected - this.download;
}

function Period(expire) {
	this.expire = expire;
	this.start = new Date(this.expire.getYear(), this.expire.getMonth() - 1, this.expire.getDate() + 1);
	this.total = new Duration(this.expire - this.start);
	this.remaining = new Duration(this.expire - new Date());
	this.passed = new Duration(new Date() - this.start);
	this.percent = Math.floor((this.total.days - this.remaining.days) / this.total.days * 100);
}

function Duration(milliseconds) {
	var day = 1000 * 60 * 60 * 24;
	var days = milliseconds / day;
	this.days = days;
	this.hours = (days - Math.floor(this.days)) * 24;
	this.seconds = milliseconds / 1000;
	this.milliseconds = milliseconds;
}