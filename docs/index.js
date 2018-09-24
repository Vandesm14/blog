const express = require('express');
const bodyParser = require('body-parser');
// const db = require('./db');
const Airtable = require('airtable');
const fs = require('fs');
const app = express();
var apiKey;
var events = {
	newEvent: function (topic, section, date, title, body) { this.event.push({ topic: topic, section: section, date: date, title: title, body: body }) },
	event: []
}

fs.readFile('./.env', 'utf8', function (err, contents) {
	apiKey = contents;
	beginBase();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('public'));

app.listen(3000, () => console.log('server started'));

// Begin Routes

app.get('*/getAllEvents', (req, res) => {
	res.send(JSON.stringify(events));
});

app.get('/post/*', (req, res) => {
	res.sendFile(__dirname + '/public/index.html');
});

app.get('/ping', (req, res) => {
	res.send(new Date());
});

app.get('*', (req, res) => {
	res.sendFile(__dirname + '/public/index.html');
	// beginBase();
});

// End Routes

function beginBase() {
	var base = new Airtable({ apiKey: apiKey }).base('appqU4XcIiUOYHF6r');

	base('Posts').select({
		maxRecords: 40,
		view: "Grid view"
	}).eachPage(function page(records, fetchNextPage) {
		// This function (`page`) will get called for each page of records.
		var total = records.length;
		var counter = 0;
		records.forEach(function (record) {
			var fields = record._rawJson.fields
			counter++;
			console.log('Retrieved ' + counter + ' of ' + total + ' Records' + ' - ' + fields.Title);
			var fields = record._rawJson.fields
			events.newEvent(fields.Topic, fields.Section, fields.Date, fields.Title, fields.Body);
		});
		// To fetch the next page of records, call `fetchNextPage`.
		// If there are more records, `page` will get called again.
		// If there are no more records, `done` will get called.
		fetchNextPage();

	}, function done(err) {
		if (err) { console.error(err); return; }
	});
}