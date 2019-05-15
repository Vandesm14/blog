/* jshint esversion: 6 */
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const db = {
	queryRecord: (name) => {
		return queryRecord(configPosts, 'name', name);
	},
	updatePosts: () => {
		let ret = [];
		let fileNames = fs.readdirSync(__dirname + '/posts');
		let dbObj = JSON.parse(fs.readFileSync(__dirname + '/db.json', 'utf8'));
		let dbNames = getFields(dbObj, 'name');

		for (let i in fileNames) {
			if (dbNames.indexOf(fileNames[i]) !== -1) {
				ret.push(dbObj[dbNames.indexOf(fileNames[i])]);
			} else {
				ret.push({ name: fileNames[i], date: new Date().toISOString()});
			}
		}

		configPosts = copy(ret);
		db.writePosts();
	},
	writePosts: () => {
		fs.writeFileSync(__dirname + '/db.json', JSON.stringify(configPosts), 'utf8');
	}
};

var allPosts = [];
var configPosts = [];
var posts = [];
var html = [];
var template = fs.readFileSync(__dirname + '/template.html', 'utf8');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/post', express.static('public'));

http.listen(3000, function () {
	console.log('listening on *:3000');
	startup();
});

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/public/index.html');
});

app.get('/post/*', (req, res) => {
	res.sendFile(__dirname + '/public/index.html')
});

app.get('/all/:level', (req, res) => {
	res.send(posts.slice(0, req.params.level * 10));
});

app.get('/getPost/:id', (req, res) => {
	res.send(getSinglePost(req.params.id + '.md'));
});

function startup() {
	db.updatePosts();
	console.log(configPosts);
	getAllPosts();
	sortAllPosts();
}

function getAllPosts() {
	let files = fs.readdirSync(__dirname + '/posts');
	allPosts = [];

	for (let i in files) {
		let obj = {};
		console.log(files[i]);
		obj.title = toTitleCase(files[i].substr(0, files[i].length - 3).replace(/\-/g, ' '));
		obj.body = fs.readFileSync(__dirname + '/posts/' + files[i], 'utf8').replace('\n', '<br>');
		obj.date = db.queryRecord(files[i]).date;
		allPosts.push(obj);
	}
}

function sortAllPosts() {
	let newPosts = copy(allPosts);
	newPosts.sort((a, b) => (new Date(a.date) < new Date(b.date)) ? 1 : -1);
	posts = copy(newPosts);
}

function getSinglePost(name) {
	let obj = {};
	obj.title = toTitleCase(name.substr(0, name.length - 3).replace(/\-/g, ' '));
	obj.body = fs.readFileSync(__dirname + '/posts/' + name, 'utf8');
	obj.date = db.queryRecord(name).date;
	return obj;
}

fs.watch(__dirname + '/posts', (eventType, filename) => {
	let files = fs.readdirSync(__dirname + '/posts');
	db.updatePosts();
	getAllPosts();
	sortAllPosts();
	io.emit('new', '');
});

function toTitleCase(str) {
	return str.replace(/\w\S*/g, function (txt) {
		return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
	});
}

function copy(obj) {
	return JSON.parse(JSON.stringify(obj));
}

function parseENV() {
	let ret = {};
	fs.readFileSync('.env', 'utf8').split('\n').forEach((e) => {
		ret[e.split('=')[0]] = e.split('=')[1];
	});
	return ret;
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