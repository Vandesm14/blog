var events;

function getAllRecords() {
	$.ajax({
		url: 'getAllEvents',
		success: function (res) {
			events = JSON.parse(res).event;
			startup();
		},
		error: function () { alert('An error occured while getting the posts') }
	});
}

function startup() {
	var url = window.location.href;
	var miniurl = url.substr(url.indexOf('/post/') + 6);
	if (url.indexOf('/post/') !== -1) { // If url is '/posts'/
		for (i = 0; i < events.length; i++) {
			if (events[i].title.replace(/\s+/g, '-').toLowerCase() == miniurl) { // If event title is equal to url title
				createEvent($('.event_template').html(), i);
				break;
			}
		}
	} else {
		duplicateTemp();
	}
}

function duplicateTemp() {
	var obj = $('.event_template').html();
	var url = window.location.href;
	for (i = 0; i < events.length; i++) {
		if (url.substr(url.length - 1) == '/') { // If url is home
			createEvent(obj, i);
		} else {
			if (events[i].section.toLowerCase() == url.substr(url.lastIndexOf('/') + 1)) { // If event section is equal to url section
				createEvent(obj, i);
			}
		}
	}
}

function createEvent(obj, ixi, post) {
	var size = $(window).width() < 780 ? 960 : 1730;
	var temp = $(obj).clone().appendTo('#event_stream');
	temp.attr('id', 'autoEvent' + ixi);
	// temp.attr('onclick', 'toggleModal(this)');
	temp.children('.event_title').text('(' + events[ixi].topic + ') ' + events[ixi].title);
	temp.children('.span_title').text(events[ixi].topic);
	temp.children('.event_date').text(events[ixi].date);
	temp.children('.event_body').html(events[ixi].body.substr(0, size).replace(/\n/g, "<br>"));
	var posturl = events[ixi].title.replace(/\s+/g, '-').toLowerCase();
	temp.children('.read_more').attr('href', '/post/' + posturl);
	temp.children('.read_more').attr('target', '_blank');
	if (events[ixi].body.length > size) {
		console.log(events[ixi].body.length + '\n' + size);
		temp.children('.read_more').show();
	} else {
		console.log(events[ixi].body.length + '\n' + size);
		temp.children('.read_more').show(); // Init 'Hide'
		temp.children('.read_more').html('Share');
	}
}