const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const ejs = require('ejs');
const showdown = require('showdown');

var converter = new showdown.Converter();
converter.setFlavor('github');

var posts = [];
var pages = 1;

const app = express();

// app.enable('strict routing');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use('/:name/:id', express.static('public'));

app.get('/', (req, res) => {
	res.render(__dirname + '/includes/frames/index.ejs', { posts: posts.slice(0,20), pages });
});

app.get('/page/:page', (req, res) => {
	let page = req.params.page;

	res.render(__dirname + '/includes/frames/index.ejs', { posts: posts.slice(page*20 - 20, page*20), pages });
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
	res.render(__dirname + '/includes/frames/post.ejs', { post });
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
	res.render(__dirname + '/includes/frames/index.ejs', { posts: filteredPosts, pages });
});

app.get('/tag', (req, res) => {
	let tag = req.query.q;
	let filteredPosts = posts.filter(el => el.tags.includes(tag));

	res.render(__dirname + '/includes/frames/index.ejs', { posts: filteredPosts, pages });
});

getPosts();

app.listen(3000, () => console.log('server started'));

function getPosts() {
	let files = fs.readdirSync('files');
	files = files.filter(el => el.match('.md'));
	let values = ['title', 'date', 'tags'];

	for (let i in files) {
		let file = fs.readFileSync('files/' + files[i], 'utf8');
		let obj = {};
		let data = file.split('\n')[0];
		data = data.split(' :: ');
		data = {
			name: data[0],
			date: data[1],
			tags: data[2].split(','),
			id: parseInt(files[i].split('_')[0]),
			content: converter.makeHtml(file.split('\n').slice(1).join('\n'))
		};

		files[i] = data;
	}

	files.sort((a, b) => a.id > b.id ? -1 : 1);
	posts = [...files];
	pages = Math.ceil(posts.length / 20);
}

// fs.watch('files', { recursive: true }, () => {
// 	getPosts();
// });