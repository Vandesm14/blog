$(document).ready(function() {
	var posts = $('.item-date, .post-date');
	posts.each(function() {
		let date = new Date($(this).text()).toLocaleString();
		$(this).text(moment($(this).text()).local().format('LL') + ' ᛫ ' + moment($(this).text()).local().format('LT'));
	});
});