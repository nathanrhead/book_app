'use strict';

const express = require('express');
const app = express();
const superagent = require('superagent');
const PORT = process.env.PORT || 3333;


app.use(express.static('./public'));
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

app.get('/', renderHomePage);
app.get('/searches/new', showForm);
app.get('/hello', (req, res) => {
  res.send('goodbye cruel world');
})

app.post('/searches', createSearch);


function renderHomePage(req, res) {
  res.render('pages/index');
}

function showForm(req, res) {
  res.render('pages/searches/new')
}

function createSearch(req, res) {
  let url = 'https://www.googleapis.com/books/v1/volumes?q=';

  if(req.body.search[1] === 'title') { url += `+intitle:${req.body.search[0]}`; }
  if(req.body.search[1] === 'author') { url += `+inauthor:${req.body.search[0]}`; }

  superagent.get(url)
    .then(data => {
      // console.log(data.body.item);
      return data.body.items.map(book => {
        return new Book(book.volumeInfo);
      });
    })
    .then(results => {
      // console.log(results);
      res.render('pages/show', { searchResults: JSON.stringify(results) })
    })
    .catch(err => console.log(err));
}

function Book(info) {
  this.title = info.title || 'No title is available.';
  this.authors = info.authors || 'No author is avaiable.';
}

app.listen(PORT, () => {
  console.log(`server up: ${PORT}`)
})
