const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const ejs = require('ejs');
const showdown = require('showdown');

var converter = new showdown.Converter();

var dbPosts = [];
var allPosts = [];
var sortedPosts = [];

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use('/p', express.static('public'));

app.get('/', (req, res) => {
	let base = fs.readFileSync('templates/base/index.ejs', 'utf8');
	let posts = sortedPosts.slice(0, 10);
	let itemTemplate = fs.readFileSync('templates/items/item.ejs', 'utf8');
	let tagTemplate = fs.readFileSync('templates/items/tag.ejs', 'utf8');
	let formattedPosts = [];
	formattedPosts = renderPosts(posts, itemTemplate, tagTemplate);
	// res.send(base.replace('<%=items%>', formattedPosts.join('\n')));
	res.send(ejs.render(base, {
		items: formattedPosts.join('\n')
	}));
});

app.get('/p/:title', (req, res) => {
	let title = req.params.title;
	if (fs.existsSync('files/' + title + '.md') === false) {
		res.render(__dirname + '/templates/base/error.ejs', {
			error: 'Post does not exist.'
		});
	} else {
		let content = fs.readFileSync('files/' + title + '.md', 'utf8');
		let base = fs.readFileSync('templates/base/post.ejs', 'utf8');
		let postTemplate = fs.readFileSync('templates/items/post.ejs', 'utf8');
		let tagTemplate = fs.readFileSync('templates/items/tag.ejs', 'utf8');
		let post = allPosts.find(obj => obj.file === title);
		if (post === undefined) {
			res.render(__dirname + '/templates/base/error.ejs', {
				error: 'Post does not exist.'
			});
		} else {
			// res.send(base.replace('<%=data%>', ejs.render(postTemplate, {
			// 	file: post.file,
			// 	title: post.title,
			// 	date: post.date,
			// 	time: post.time.split(' ')[0],
			// 	ampm: post.time.split(' ')[1],
			// 	rtags: post.tags.map(el => {
			// 		return tagTemplate.replace(/<%=tag%>/g, el);
			// 	}).join(', '),
			// 	content: converter.makeHtml(content)
			// })));
			res.send(ejs.render(base, {
				data: ejs.render(postTemplate, {
					file: post.file,
					title: post.title,
					date: post.date,
					time: post.time.split(' ')[0],
					ampm: post.time.split(' ')[1],
					rtags: post.tags.map(el => {
						return tagTemplate.replace(/<%=tag%>/g, el);
					}).join(', '),
					content: converter.makeHtml(content)
				})
			}));
		}
	}
});

app.get('/page/:title', (req, res) => {
	let title = req.params.title;
	let base = fs.readFileSync('templates/base/error.ejs', 'utf8');
	res.send(ejs.render(base, {
		error: 'Unhandled Request'
	}));
});

app.get('/sort', (req, res) => {
	let sort = req.query.q;
	let base = fs.readFileSync('templates/base/index.ejs', 'utf8');
	let posts = [];
	let itemTemplate = fs.readFileSync('templates/items/item.ejs', 'utf8');
	let tagTemplate = fs.readFileSync('templates/items/tag.ejs', 'utf8');
	let formattedPosts = [];

	sortedPosts.forEach(el => {
		let hold = JSON.parse(fs.readFileSync('files/' + el.file + '.json', 'utf8'));
		if (hold !== undefined && hold.tags !== undefined) {
			if (hold.tags.includes(sort)) {
				posts.push(el);
			}
		}
	});
	formattedPosts = renderPosts(posts, itemTemplate, tagTemplate);
	// res.send(base.replace('<%=items%>', formattedPosts.join('\n')));
	res.send(ejs.render(base, {
		items: formattedPosts.join('\n')
	}));
});

app.post('/search', (req, res) => {
	let search = req.body.q;
	let base = fs.readFileSync('templates/base/index.ejs', 'utf8');
	let posts = [];
	let itemTemplate = fs.readFileSync('templates/items/item.ejs', 'utf8');
	let tagTemplate = fs.readFileSync('templates/items/tag.ejs', 'utf8');
	let formattedPosts = [];

	search = search.toLowerCase().split(' ');
	sortedPosts.forEach(el => {
		if (search.some(
				el2 => el.title.toLowerCase().split(' ').includes(el2) ||
				el.file.toLowerCase().split(' ').includes(el2)
			)) {
			posts.push(el);
		}
	});
	formattedPosts = renderPosts(posts, itemTemplate, tagTemplate);
	// res.send(base.replace('<%=items%>', formattedPosts.join('\n')));
	res.send(ejs.render(base, {
		items: formattedPosts.join('\n')
	}));
});

app.get('/rss', (req, res) => {
	let base = fs.readFileSync('rss/base.xml', 'utf8');
	let itemTemplate = fs.readFileSync('rss/template.xml', 'utf8');
	let posts = sortedPosts.slice(0, 10);
	let formattedPosts = [];
	for (let i in posts) {
		formattedPosts.push(
			ejs.render(itemTemplate, {
				file: posts[i].file,
				title: posts[i].title,
				date: posts[i].date,
				time: posts[i].time,
				ampm: posts[i].ampm
			})
		);
	}
	res.setHeader('content-type', 'text/xml');
	// res.send(base.replace('<%=items%>', formattedPosts.join('\n')));
	res.send(ejs.render(base, {
		items: formattedPosts.join('\n')
	}));
});

app.listen(3000, () => console.log('server started'));

// --------------------
const db = {
	getPostByName: (name) => {
		console.log(dbPosts);
		// return dbPosts.find(obj => obj.name === name);
		return queryRecord(dbPosts, 'name', name);
	},
	updatedb: () => {
		let ret = [];
		let fileNames = fs.readdirSync('files');
		let dbObj = JSON.parse(fs.readFileSync('db.json', 'utf8'));
		let dbNames = getFields(dbObj, 'name');
		for (let i in fileNames) {
			if (fileNames[i].match('.json') === null) {
				if (dbNames.indexOf(fileNames[i]) !== -1) {
					ret.push(dbObj[dbNames.indexOf(fileNames[i])]);
				} else {
					ret.push({
						name: fileNames[i],
						date: new Date().toISOString()
					});
				}
			}
		}
		dbPosts = copy(ret);
		db.writedb();
		console.log(dbPosts);
	},
	writedb: () => {
		fs.writeFileSync('db.json', JSON.stringify(dbPosts), 'utf8');
	}
};

// fs.watch('files', (eventType, filename) => {
// 	if ()
// 	let files = fs.readdirSync(__dirname + '/posts');
// 	db.updatePosts();
// 	getAllPosts();
// 	sortAllPosts();
// });

startup();

function startup() {
	db.updatedb();
	getAllPosts();
	sortAllPosts();
}

function getAllPosts() {
	let files = fs.readdirSync('files');
	let hold;
	allPosts = [];
	for (let i of files.filter(el => {
			return el.match('.json') === null;
		})) {
		let obj = {};
		if (i.match('.json') === null) {
			hold = JSON.parse(fs.readFileSync('files/' + i.substr(0, i.length - 3) + '.json', 'utf8'));
			if (hold !== undefined && hold.title !== undefined) {
				obj.title = hold.title;
			} else {
				obj.title = toTitleCase(i.substr(0, i.length - 3).replace(/\-/g, ' '));
			}
			if (hold !== undefined && hold.tags !== undefined) {
				obj.tags = hold.tags;
			} else {
				obj.tags = ['#'];
			}
			obj.file = i.replace('.md', '');
			obj.content = fs.readFileSync('files/' + i, 'utf8').replace('\n', '<br>');
			obj.date = db.getPostByName(i).date;
			obj.time = new Date(obj.date).toLocaleString().split(' ')[1].replace(/:\d\d([ ap]|$)/, ' ');
			obj.date = new String(new Date(obj.date)).split(' ').splice(0, 3).join(' ');
			allPosts.push(obj);
		}
	}
}

function sortAllPosts() {
	let newPosts = copy(allPosts);
	newPosts.sort((a, b) => (new Date(a.date + ' ' + a.time) < new Date(b.date + ' ' + b.time)) ? 1 : -1);
	sortedPosts = copy(newPosts);
}

fs.watch('files', (eventType, filename) => {
	let files = fs.readdirSync('files');
	db.updatedb();
	getAllPosts();
	sortAllPosts();
});

function toTitleCase(str) {
	return str.replace(/\w\S*/g, function (txt) {
		return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
	});
}

function copy(obj) {
	return JSON.parse(JSON.stringify(obj));
}

function getFields(obj, field) {
	let ret = [];
	for (let i in obj) {
		ret.push(obj[i][field]);
	}
	return ret;
}

function queryRecord(obj, field, query) {
	let ret;
	for (let i in obj) {
		if (obj[i][field] === query) {
			return obj[i];
		}
	}
}

function renderPosts(posts, itemTemplate, tagTemplate) {
	let formattedPosts = [];
	for (let i in posts) {
		formattedPosts.push(
			ejs.render(itemTemplate, {
				file: posts[i].file,
				title: posts[i].title,
				date: posts[i].date,
				time: posts[i].time,
				ampm: posts[i].ampm,
				rtags: posts[i].tags.map(el => {
					return tagTemplate.replace(/<%=tag%>/g, el);
				}).join(', ')
			})
		);
	}
	return formattedPosts;
}