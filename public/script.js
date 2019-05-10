var template;
var singleTemplate;
var level = 1;
var url = window.location.href;
var thisurl = url.split('/');
var socket = io();

socket.on('new', function (res) {
	if (!thisurl.includes('post')) {
		getPosts(1);
	}
});

$(document).ready(function () {
	template = $('#template').html();
	singleTemplate = $('#singleTemplate').html();
	if (thisurl.includes('post')) {
		getSinglePost(thisurl[thisurl.length - 1]);
		$('#loadMore').hide();
	} else {
		getPosts(level);
	}
});

function getPosts() {
	$.get({
		url: '/all/' + level,
		success: (res) => {
			$('#posts').html('');
			posts = res;
			for (i in posts) {
				// posts[i].date = new Date(posts[i].date).toLocaleString();
				posts[i].date = new Date(posts[i].date).toLocaleTimeString([], {day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute:'2-digit'});
				if ($(window).width() <= 600 && posts[i].body.length > 366) {
					posts[i].body = posts[i].body.substr(0, 366).split(' ');
					posts[i].body = posts[i].body.slice(0, posts[i].body.length - 1).join(' ') + '...';
					posts[i].readMore = true;
				} else if ($(window).width() > 600 && posts[i].body.length > 1000) {
					posts[i].body = posts[i].body.substr(0, 1000).split(' ');
					posts[i].body = posts[i].body.slice(0, posts[i].body.length - 1).join(' ') + '...';
					posts[i].readMore = true;
				}

				posts[i].body = marked(posts[i].body);
			}
			$('#posts').html(renderHTML().join('\n'));
		},
		error: (e) => {
			alert('An error occured while fetching posts\n\n' + JSON.stringify(e));
		}
	});
}

function renderHTML() {
	let ret = [];
	for (i in posts) {
		let hold = template;
		hold = hold.replace(/\{\{title\}\}/g, posts[i].title);
		hold = hold.replace(/\{\{date\}\}/g, posts[i].date);
		hold = hold.replace(/\{\{body\}\}/g, posts[i].body);
		hold = hold.replace(/\{\{titleURL\}\}/g, posts[i].title.toLowerCase().replace(/\s/g, '-'));
		if (posts[i].readMore) {
			hold = hold.replace(/\{\{share\}\}/g, 'Read More');
		} else {
			hold = hold.replace(/\{\{share\}\}/g, 'Share');
		}
		ret.push(hold);
	}

	return ret;
}

function getSinglePost(post) {
	$.get({
		url: '/getPost/' + post,
		success: (res) => {
			$('#page').html('');
			res.date = new Date(res.date).toLocaleString();
			res.body = marked(res.body);
			$('#page').html(renderSingleHTML(res));
			$('#page').show();
		},
		error: (e) => {
			alert('An error occured while fetching posts\n\n' + JSON.stringify(e));
		}
	});
}

function renderSingleHTML(post) {
	let ret = '';
	let hold = singleTemplate;
	hold = hold.replace(/\{\{title\}\}/g, post.title);
	hold = hold.replace(/\{\{date\}\}/g, post.date);
	hold = hold.replace(/\{\{body\}\}/g, post.body);
	hold = hold.replace(/\{\{titleURL\}\}/g, post.title.toLowerCase().replace(/\s/g, '-'));
	ret = hold;

	return ret;
}

function loadMore() {
	level++;
	getPosts();
}