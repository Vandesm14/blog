const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const ejs = require('ejs');
const showdown = require('showdown');
const request = require('request');

var converter = new showdown.Converter();
converter.setFlavor('github');

var posts = [];
var pages = 1;
var date;

const app = express();

// app.enable('strict routing');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', (req, res) => {
	res.render(__dirname + '/includes/frames/index.ejs', {
		posts: posts.slice(0, 20),
		pages
	});
});

app.get('/page/:page', (req, res) => {
	let page = req.params.page;

	res.render(__dirname + '/includes/frames/index.ejs', {
		posts: posts.slice(page * 20 - 20, page * 20),
		pages
	});
});

app.get('/api/page/:page', (req, res) => {
	let page = req.params.page;
	let ret = copy(posts.slice(page * 20 - 20, page * 20));
	ret.forEach(el => {
		el.content = el.content.substr(0, 200);
		el.url = `/${encodeURIComponent(el.name.toLowerCase().replace(/[^\w,\s]/g, '').replace(/\s/g, '-'))}/${el.id}`
	});
	ret.forEach(el => {
		el.url = `/${encodeURIComponent(el.name.toLowerCase().replace(/[^\w,\s]/g, '').replace(/\s/g, '-'))}/${el.id}`
	});

	res.header('Access-Control-Allow-Origin', '*');
	res.send(ret);
});

app.get('/rss', (req, res) => {
	let page = 1;
	let ret = copy(posts.slice(page * 20 - 20, page * 20));
	ret.forEach(el => {
		el.content = el.content.substr(0, 200);
		el.url = `/${encodeURIComponent(el.name.toLowerCase().replace(/[^\w,\s]/g, '').replace(/\s/g, '-'))}/${el.id}`
	});
	ret.forEach(el => {
		el.url = `/${encodeURIComponent(el.name.toLowerCase().replace(/[^\w,\s]/g, '').replace(/\s/g, '-'))}/${el.id}`
	});

	res.header('Access-Control-Allow-Origin', '*');
	res.header('Content-Type', 'text/xml');
	res.render(__dirname + '/includes/templates/rss.ejs', {
		posts: ret
	});
});

app.get('/:name/:id', (req, res) => {
	let name = req.params.name;
	let id = parseInt(req.params.id);
	let post = posts[posts.length - id];

	if (id > posts.length) {
		post = {
			name: '404',
			date: new Date().toUTCString(),
			content: converter.makeHtml('The requested post could not be found'),
			tags: []
		}
	}
	res.render(__dirname + '/includes/frames/post.ejs', {
		post
	});
});

app.get('/search', (req, res) => {
	let search = req.query.q;
	let filteredPosts = [];

	search = search.toLowerCase().split(' ');
	posts.forEach(post => {
		if (search.some(
				keyword => post.name.toLowerCase().split(' ').some(el => el.match(keyword)) || post.tags.map(el => el.toLowerCase()).some(el => el.match(keyword))
			))
			filteredPosts.push(post);
	});
	res.render(__dirname + '/includes/frames/index.ejs', {
		posts: filteredPosts,
		pages
	});
});

app.get('/tag', (req, res) => {
	let tag = req.query.q;
	let filteredPosts = posts.filter(el => el.tags.includes(tag));

	res.render(__dirname + '/includes/frames/index.ejs', {
		posts: filteredPosts,
		pages
	});
});

app.get('/api', (req, res) => {
	res.send('Last fetched: ' + date);
});

app.get('/apiGet', (req, res) => {
	getPosts(() => {
		res.send('Last fetched: ' + date);
	});
});

getPosts(() => {
	app.listen(3000, () => console.log('server started'));
});

function getPosts(callback) {
	request('https://blog-server.vandesm14.repl.co', function (error, response, body) {
		posts = JSON.parse(body);
		date = new Date();
		console.log('Last fetched: ' + date);
		callback();
		posts.forEach(el => el.content = converter.makeHtml(el.content));
	});
}

function copy(obj) {
	return JSON.parse(JSON.stringify(obj));
}