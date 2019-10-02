const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const ejs = require('ejs');
const showdown = require('showdown');

var converter = new showdown.Converter();
converter.setFlavor('github');

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
	let posts = sortedPosts.slice(0, 10);
	// let base = fs.readFileSync('templates/base/index.ejs', 'utf8');
	// let itemTemplate = fs.readFileSync('templates/items/item.ejs', 'utf8');
	// let tagTemplate = fs.readFileSync('templates/items/tag.ejs', 'utf8');
	let formattedPosts = [];
	formattedPosts = renderPosts(posts, ejstemp.items.item, ejstemp.items.tag);
	// res.send(ejs.render(ejstemp.base.index, {
	// 	data: formattedPosts.join('\n')
	// }));
	res.send(renderPage('index', {
		data: formattedPosts.join('\n')
	}));
});

app.get('/p/:title', (req, res) => {
	let title = req.params.title;
	if (fs.existsSync('files/' + title + '.md') === false) {
		// res.render(__dirname + '/templates/base/error.ejs', {
		// 	data: 'Post does not exist.'
		// });
		res.send(renderPage('error', {
			data: 'Post does not exist.'
		}));
	} else {
		let content = fs.readFileSync('files/' + title + '.md', 'utf8');
		// let base = fs.readFileSync('templates/base/post.ejs', 'utf8');
		// let postTemplate = fs.readFileSync('templates/items/post.ejs', 'utf8');
		// let tagTemplate = fs.readFileSync('templates/items/tag.ejs', 'utf8');
		let post = allPosts.find(obj => obj.file === title);
		if (post === undefined) {
			res.render(__dirname + '/templates/base/error.ejs', {
				data: 'Post does not exist.'
			});
		} else {
			// res.send(ejs.render(ejstemp.base.post, {
			// 	data: ejs.render(ejstemp.items.post, {
			// 		file: post.file,
			// 		title: post.title,
			// 		date: post.date,
			// 		time: post.time,
			// 		rtags: post.tags.map(el => {
			// 			return ejstemp.items.tag.replace(/<%=tag%>/g, el);
			// 		}).join(', '),
			// 		content: converter.makeHtml(content)
			// 	})
			// }));
			res.send(renderPage('post', {
				data: ejs.render(ejstemp.items.post, {
					file: post.file,
					title: post.title,
					date: post.date,
					time: post.time,
					rtags: post.tags.map(el => {
						return ejstemp.items.tag.replace(/<%=tag%>/g, el);
					}).join(', '),
					content: converter.makeHtml(content).replace(/\n/g, '<br>')
				})
			}));
		}
	}
});

app.get('/sort', (req, res) => {
	let sort = req.query.q;
	let posts = [];
	// let base = fs.readFileSync('templates/base/index.ejs', 'utf8');
	// let itemTemplate = fs.readFileSync('templates/items/item.ejs', 'utf8');
	// let tagTemplate = fs.readFileSync('templates/items/tag.ejs', 'utf8');
	let formattedPosts = [];

	sortedPosts.forEach(el => {
		let hold = JSON.parse(fs.readFileSync('files/' + el.file + '.json', 'utf8'));
		if (hold !== undefined && hold.tags !== undefined) {
			if (hold.tags.includes(sort)) {
				posts.push(el);
			}
		}
	});
	formattedPosts = renderPosts(posts, ejstemp.items.item, ejstemp.items.tag);
	// res.send(ejs.render(ejstemp.base.index, {
	// 	data: formattedPosts.join('\n')
	// }));
	res.send(renderPage('index', {
		data: formattedPosts.join('\n')
	}));
});

app.post('/search', (req, res) => {
	let search = req.body.q;
	let posts = [];
	// let base = fs.readFileSync('templates/base/index.ejs', 'utf8');
	// let itemTemplate = fs.readFileSync('templates/items/item.ejs', 'utf8');
	// let tagTemplate = fs.readFileSync('templates/items/tag.ejs', 'utf8');
	let formattedPosts = [];

	search = search.toLowerCase().split(' ');
	sortedPosts.forEach(post => {
		if (search.some(
				keyword => post.title.toLowerCase().split(' ').includes(keyword) ||
				post.file.toLowerCase().split(' ').includes(keyword) ||
				post.tags.join(' ').toLowerCase().split(' ').includes(keyword)
			)) {
			posts.push(post);
		}
	});
	formattedPosts = renderPosts(posts, ejstemp.items.item, ejstemp.items.tag);
	// res.send(ejs.render(ejstemp.base.index, {
	// 	data: formattedPosts.join('\n')
	// }));
	res.send(renderPage('index', {
		data: formattedPosts.join('\n')
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
				date: new Date(posts[i].utcDate).toUTCString(),
				time: posts[i].time
			})
		);
	}
	res.setHeader('content-type', 'text/xml');
	res.send(ejs.render(base, {
		data: formattedPosts.join('\n')
	}));
});

app.listen(5500, () => console.log('server started'));

// --------------------
var ejstemp = {
	base: {
		index: fs.readFileSync('templates/base/index.ejs', 'utf8'),
		post: fs.readFileSync('templates/base/post.ejs', 'utf8'),
		error: fs.readFileSync('templates/base/error.ejs', 'utf8')
	},
	includes: {
		header: fs.readFileSync('templates/includes/header.ejs', 'utf8'),
		sidebar: fs.readFileSync('templates/includes/sidebar.ejs', 'utf8')
	},
	items: {
		item: fs.readFileSync('templates/items/item.ejs', 'utf8'),
		post: fs.readFileSync('templates/items/post.ejs', 'utf8'),
		tag: fs.readFileSync('templates/items/tag.ejs', 'utf8')
	}
};

function updateEjsTemp() {
	ejstemp = {
		base: {
			index: fs.readFileSync('templates/base/index.ejs', 'utf8'),
			post: fs.readFileSync('templates/base/post.ejs', 'utf8'),
			error: fs.readFileSync('templates/base/error.ejs', 'utf8')
		},
		includes: {
			header: fs.readFileSync('templates/includes/header.ejs', 'utf8'),
			sidebar: fs.readFileSync('templates/includes/sidebar.ejs', 'utf8')
		},
		items: {
			item: fs.readFileSync('templates/items/item.ejs', 'utf8'),
			post: fs.readFileSync('templates/items/post.ejs', 'utf8'),
			tag: fs.readFileSync('templates/items/tag.ejs', 'utf8')
		}
	};
}

const db = {
	getPostByName: (name) => {
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
				if (dbNames.indexOf(fileNames[i]) !== -1) { // Create new file
					ret.push(dbObj[dbNames.indexOf(fileNames[i])]);
				} else { // Push old file
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
			if (fs.existsSync('files/' + i.substr(0, i.length - 3) + '.json')) {
				hold = JSON.parse(fs.readFileSync('files/' + i.substr(0, i.length - 3) + '.json', 'utf8'));
			} else {
				hold = {title: undefined, date: undefined, tags: undefined};
			}
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
			obj.utcDate = obj.date;
			obj.time = formatAMPM(obj.date);
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

fs.watch('templates', (eventType, filename) => {
	updateEjsTemp();
	console.log('Updated Templates');
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
				rtags: posts[i].tags.map(el => {
					return tagTemplate.replace(/<%=tag%>/g, el);
				}).join(', ')
			})
		);
	}
	return formattedPosts;
}

function renderPage(page, obj) {
	let data = obj.data;
	let ret = ejs.render(ejstemp.base[page], {
		sidebar: ejstemp.includes.sidebar,
		header: ejstemp.includes.header,
		data: data
	});
	return ret;
}

function formatAMPM(date) {
	date = new Date(date);
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var ampm = hours >= 12 ? 'PM' : 'AM';
	hours = hours + 8;
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0'+minutes : minutes;
  var strTime = hours + ':' + minutes + ' ' + ampm;
  return strTime;
}