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
	res.sendFile(__dirname + '/public/index.html');
	console.log(db);
});

app.get('/example', (req, res) => {
	let content = fs.readFileSync('files/first.md', 'utf8');
	let base = fs.readFileSync('templates/base/post.ejs', 'utf8');
	let postTemplate = fs.readFileSync('templates/items/post.ejs', 'utf8');
	// template = ejs.compile(template);
	res.send(base.replace('<%=data%>', ejs.render(postTemplate, {
		file: 'first',
		title: 'Hello World',
		date: '9/27/2019',
		time: '9:19',
		ampm: 'PM',
		rtags: 'tags go here',
		content: converter.makeHtml(content)
	})));
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
		let post = allPosts.find(obj => obj.file === title);
		if (post === undefined) {
			res.render(__dirname + '/templates/base/error.ejs', {
				error: 'Post does not exist.'
			});
		} else {
			res.send(base.replace('<%=data%>', ejs.render(postTemplate, {
				file: post.file,
				title: post.title,
				date: post.date,
				time: post.time.split(' ')[0],
				ampm: post.time.split(' ')[1],
				rtags: 'ejs render failure',
				content: converter.makeHtml(content)
			})));
		}
	}
});

app.get('/page/:title', (req, res) => {
	let title = req.params.title;

});

app.get('/sort', (req, res) => {
	let sort = req.query.q;

});

app.get('/search', (req, res) => {
	let search = req.query.q;

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

	for (let i in files) {
		let obj = {};
		if (files[i].match('.json') === null) {
			if (fs.existsSync('files/' + files[i].substr(0, files[i].length - 3) + '.json')) {
				hold = JSON.parse(fs.readFileSync('files/' + files[i].substr(0, files[i].length - 3) + '.json', 'utf8'));
				if (hold.title !== undefined) {
					obj.title = hold.title;
				} else {
					obj.title = toTitleCase(files[i].substr(0, files[i].length - 3).replace(/\-/g, ' '));
				}
			} else {
				obj.title = toTitleCase(files[i].substr(0, files[i].length - 3).replace(/\-/g, ' '));
			}
			obj.file = files[i].replace('.md', '');
			obj.content = fs.readFileSync('files/' + files[i], 'utf8').replace('\n', '<br>');
			obj.date = db.getPostByName(files[i]).date;
			obj.time = new Date(obj.date).toLocaleString().split(', ')[1].replace(/:\d\d([ ap]|$)/, ' ');
			obj.date = new String(new Date(obj.date)).split(' ').splice(0, 3).join(' ');
			allPosts.push(obj);
		}
	}
}

function sortAllPosts() {
	let newPosts = copy(allPosts);
	newPosts.sort((a, b) => (new Date(a.date) < new Date(b.date)) ? 1 : -1);
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