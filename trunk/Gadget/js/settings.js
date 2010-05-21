System.Gadget.onSettingsClosing = settings_closing;
var $username, $password, $peak_quota, $offpeak_quota, $btnCheck, $interval;

function settings_load() {
	$username = $("#username");
	$password = $("#password");
	$peak_quota = $("#peak_quota");
	$offpeak_quota = $("#offpeak_quota");
	$btnCheck = $("#btnCheck");
	$interval = $("#interval");

	tpg.settings.load();
	$username.val(tpg.settings.username);
	$password.val(tpg.settings.password);
	$peak_quota.val(tpg.settings.peak_quota);
	$offpeak_quota.val(tpg.settings.offpeak_quota);
	$interval.val(tpg.settings.interval ? tpg.settings.interval : 6);

	$btnCheck.click(function () {
		set_msg("");
		$(".container *").attr("disabled", true);
		$btnCheck.addClass("processing");

		tpg.usage.scrape($username.val(), $password.val(),
			function (error) {
				$(".container *").attr("disabled", false);
				$btnCheck.removeClass("processing");
				set_msg(error == tpg.usage.error.invalid ? "invalid login" : "manual entry required");

			}, function (data) {
				$.get("http://www.tpg.com.au/products_services/adsl2plus_pricing.php", function (html) {
					$(".container *").attr("disabled", false);
					$btnCheck.removeClass("processing");

					var quota = new RegExp("<b>" + data.plan.replace(/([ \/])/g, ".+?") + "</b></div></td>[\\s\\S]+?\\((\\d+?)GB\\+(\\d+?)GB\\)").exec(html);
					if (quota.length > 2) {
						$peak_quota.val(quota[1] * 1000);
						$offpeak_quota.val(quota[2] * 1000);
						return;
					}
					set_msg("manual entry required");
				});
			});
	});
}

function settings_closing(e) {
	if (e.closeAction != e.Action.commit) return;

	if(!$username.val() || !$password.val()) {
		set_msg("login details required");
		e.cancel = true;
		return;
	}
	
	if(!$peak_quota.val()) {
		set_msg("daily/peak quota required");
		e.cancel = true;
		return;
	}
	
	if(!tpg.isNumber($peak_quota.val()) || $peak_quota.val() < 1) {
		set_msg("daily/peak quota must be a number greater than 0");
		e.cancel = true;
		return;
	}
	
	if($offpeak_quota.val() && !tpg.isNumber($offpeak_quota.val())) {
		set_msg("off-peak quota must be a number");
		e.cancel = true;
		return;
	}
	
	if(!$interval.val()) {
		set_msg("interval required");
		e.cancel = true;
		return;
	}
	
	if(!tpg.isNumber($interval.val())) {
		set_msg("interval must be a number");
		e.cancel = true;
		return;
	}
	
	tpg.settings.username = $username.val();
	tpg.settings.password = $password.val();
	tpg.settings.peak_quota = $peak_quota.val();
	tpg.settings.offpeak_quota = $offpeak_quota.val() ? $offpeak_quota.val() : 0;
	tpg.settings.interval = $interval.val();
	tpg.settings.save();
}

function set_msg(msg) {
	$("#msg").html(msg);
}