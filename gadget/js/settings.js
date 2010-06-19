System.Gadget.onSettingsClosing = settings_closing;
var $username, $password, $peak_quota, $offpeak_quota, $btnCheck, $interval, $update;

function settings_load() {
	$username = $("#username");
	$password = $("#password");
	$peak_quota = $("#peak_quota");
	$offpeak_quota = $("#offpeak_quota");
	$btnCheck = $("#btnCheck");
	$interval = $("#interval");
	$update = $("#update");

	Helper.Settings.load();
	$username.val(Helper.Settings.username);
	$password.val(Helper.Settings.password);
	$peak_quota.val(Helper.Settings.peak_quota);
	$offpeak_quota.val(Helper.Settings.offpeak_quota);
	$interval.val(Helper.Settings.interval ? Helper.Settings.interval : 6);
	$update.attr("checked", Helper.Settings.update != "false");

	$btnCheck.click(function () {
		if (!validate_login()) return;

		$(".container *").attr("disabled", true);
		$btnCheck.addClass("processing");

		Tpg.Usage.scrape($username.val(), $password.val(),
			function (error) {
				$(".container *").attr("disabled", false);
				$btnCheck.removeClass("processing");
				set_msg(error == Tpg.Usage.Error.invalid ? "invalid login" : "manual entry required");

			}, function (data) {
				$.get("http://www.jeltel.com.au/tools/tpgplans.php",
				{ action: "get", plan: Helper.encode(data.plan) },
				function (html) {
					$(".container *").attr("disabled", false);
					$btnCheck.removeClass("processing");

					var r = /R=(\w*)/.exec(html);
					if (r && r[1] == "SUCCESS") {
						var peak = /P=(\d*)/.exec(html);
						var offpeak = /O=(\d*)/.exec(html);

						$peak_quota.val(peak[1]);
						$offpeak_quota.val(offpeak[1]);
						return;
					}
					set_msg("manual entry required");
				});
			});
		});

		$("#update_check").click(function (e) {
			set_msg("Checking for updates...", true, true);
			
			Tpg.Update.check(function (r, data) {
				if (r) {
					set_msg("<p>A new update is available</p>" +
					"version " + data.version +
					"<p><button type='button'>Download</button></p>", true);
				} else {
					set_msg(data);
				}
			});
		});
}

function validate_login() {
	if (!$username.val() || !$password.val()) {
		set_msg("login details required");
		if (!$username.val()) set_invalid($username);
		if (!$password.val()) set_invalid($password);
		return false;
	}
	return true;
}

function validate() {
	$("table label").removeClass("invalid");

	if (!validate_login()) return false;

	if (!$peak_quota.val()) {
		set_msg("daily/peak quota required");
		set_invalid($peak_quota);
		return false;
	}

	if (!Helper.isNumber($peak_quota.val()) || $peak_quota.val() < 1) {
		set_msg("daily/peak quota must be a number greater than 0");
		set_invalid($peak_quota);
		return false;
	}

	if ($offpeak_quota.val() && !Helper.isNumber($offpeak_quota.val())) {
		set_msg("off-peak quota must be a number");
		set_invalid($offpeak_quota);
		return false;
	}

	if (!$interval.val()) {
		set_msg("interval required");
		set_invalid($interval);
		return false;
	}

	if (!Helper.isNumber($interval.val())) {
		set_msg("interval must be a number");
		set_invalid($interval);
		return false;
	}

	return true;
}

function settings_closing(e) {
	if (e.closeAction != e.Action.commit) return;

	if (!validate()) {
		e.cancel = true;
		return;
	}
	
	Helper.Settings.username = $username.val();
	Helper.Settings.password = $password.val();
	Helper.Settings.peak_quota = $peak_quota.val();
	Helper.Settings.offpeak_quota = $offpeak_quota.val() ? $offpeak_quota.val() : 0;
	Helper.Settings.interval = $interval.val();
	Helper.Settings.update = $update.attr("checked") ? "true" : "false";
	Helper.Settings.save();
}

var msg_timer;
function set_msg(msg, static, processing) {
	window.clearTimeout(msg_timer);
	var $msg = $("#msg").removeClass("processing");
	if (processing) $msg.addClass("processing");
	$msg.stop(true, true).show().find("div").html(msg);
	
	if (!static) {
		msg_timer = window.setTimeout(function () {
			$msg.fadeOut(500);
		}, 1500);
	}
}

function set_invalid($input) {
	$input.parent().find("label").addClass("invalid");
}