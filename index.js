/* jshint esversion: 6 */
const express = require('express');
const bodyParser = require('body-parser');
const db = require('./db');
const fs = require('fs');

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const config = {
	getPosts: () => {
		configPosts = JSON.parse(fs.readFileSync(__dirname + '/post-config.json', 'utf8'));
	},
	readPost: (name) => {
		let ret;
		for (let i in configPosts) {
			if (configPosts[i].name === name) {
				ret = configPosts[i];
			}
		}
		return ret;
	},
	newPost: (name, date) => {
		console.log('New: ' + name);
		configPosts.push({ name: name, date: date });
		console.log(configPosts);
		config.writePosts();
	},
	updatePosts: () => {
		let files = fs.readdirSync(__dirname + '/posts');
		let obj = [];
		for (let i in configPosts) {
			for (let k in files) {
				if (files[k] === configPosts[i].name + '.md') {
					obj.push(copy(configPosts[i]));
				}
			}
		}
		configPosts = copy(obj);
		config.writePosts();
	},
	writePosts: () => {
		fs.writeFileSync(__dirname + '/post-config.json', JSON.stringify(configPosts), 'utf8');
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
app.use('/page', express.static('public'));

http.listen(3000, function () {
	console.log('listening on *:3000');
	startup();
});

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/public/index.html');
});

// app.get('/page/*', (req, res) => {
// 	res.sendFile(__dirname + '/public/index.html')
// });

app.get('/post/*', (req, res) => {
	res.sendFile(__dirname + '/public/index.html');
});

app.get('/all/:level', (req, res) => {
	res.send(posts.slice(0, req.params.level * 10));
});

app.get('/getPost/:id', (req, res) => {
	res.send(getSinglePost(req.params.id + '.md'));
});

// app.listen(3000, () => console.log('server started'));


function startup() {
	config.getPosts();
	config.updatePosts();
	console.log(configPosts);
	getAllPosts();
	sortAllPosts();
}

function getAllPosts() {
	let files = fs.readdirSync(__dirname + '/posts');
	allPosts = [];

	for (let i in files) {
		let obj = {};
		obj.title = toTitleCase(files[i].substr(0, files[i].length - 3).replace(/\-/g, ' '));
		obj.body = fs.readFileSync(__dirname + '/posts/' + files[i], 'utf8').replace('\n', '<br>');
		// obj.date = fs.statSync(__dirname + '/posts/' + files[i]).birthtime;
		obj.date = config.readPost(files[i].substr(0, files[i].length - 3)).date;
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
	// obj.date = fs.statSync(__dirname + '/posts/' + name).birthtime;
	obj.date = config.readPost(name.substr(0, name.length - 3)).date;
	return obj;
}

fs.watch(__dirname + '/posts', (eventType, filename) => {
	let files = fs.readdirSync(__dirname + '/posts');
	if (files.length > allPosts.length) {
		config.newPost(filename.substr(0, filename.length - 3), new Date().toISOString());
	} else if (files.length < allPosts.length) {
		config.updatePosts();
	}
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