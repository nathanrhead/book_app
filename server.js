'use strict';

const express = require('express');
const app = express();
const superagent = require('superagent');
const dotenv = require('dotenv');
const pg = require('pg');
const methodOverride = require('method-override');

dotenv.config();

const PORT = process.env.PORT || 3333;
const client = new pg.Client(process.env.DATABASE_URL);

app.use(methodOverride('_method'));
app.use(express.static('./public'));
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

app.get('/', renderHomePage);

app.get('/searches/new', showForm);
app.post('/searches', createSearch);
app.post('/add-book', saveBook);

app.get('/view-details/:listItems_id', bookDetails);
app.put('/update/:listItems_id', updateBook);
app.delete('/delete/:listItems_id', deleteBook);


app.get('*', (req, res) => {
  res.render('pages/error', { error: new Error('Page not found.') } )
}) //set it on fire

function renderHomePage(req, res) {
  let SQL = 'SELECT * FROM seed;';

  client.query(SQL)
    .then(data => {
      res.render('pages/index', { bananas: data.rows })
    })
    .catch(err => console.error(err));
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
      return data.body.items.map(book => {
        return new Book(book.volumeInfo);
      });
    })
    .then(results => {
      res.render('pages/searches/show', { searchResults: results })
    })
    .catch(err => console.log(err));
}

function saveBook(req, res) {
  let { title, authors, description, image, isbn, category } = req.body;

  let SQL = 'INSERT INTO seed (title, authors, description, image, isbn, category) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;';
  let values = [title, authors, description, image, isbn, category];

  client.query(SQL, values)
    .then(res.redirect('/'))
    .catch(err => console.error(err));
}

function bookDetails(req, res) {
  let SQL = 'SELECT * FROM seed WHERE id=$1';
  let values = [req.params.listItems_id];

  client.query(SQL, values)
    .then(data => {
      res.render('pages/books/show', { oneBook: data.rows[0] })
    });
}

function updateBook(req, res) {
  let { title, authors, description, category } = req.body;

  let SQL = 'UPDATE seed SET title=$1, authors=$2, description=$3, category=$4 WHERE id=$5';
  let values = [title, authors, description, category, req.params.listItems_id];

  client.query(SQL, values)
    .then(res.redirect(`/view-details/${req.params.listItems_id}`))
    .catch(err => console.error(err));
}

function deleteBook(req, res) {
  let SQL = `DELETE FROM seed WHERE id=${req.params.listItems_id}`;
  client.query(SQL)
    .then(res.redirect('/'))
    .catch(err => console.error(err));
}

function Book(info) {
  if(info.imageLinks) {
    if(info.imageLinks.smallThumbnail.match(/^http:\/\//g)){
      info.imageLinks.smallThumbnail = info.imageLinks.smallThumbnail.replace('http://', 'https://');
      this.image = info.imageLinks.smallThumbnail;
    } else {
      this.image = 'https://i.imgur.com/J5LVHEL.jpg';
    }
  }
  this.title = info.title || 'No title is available.';
  this.authors = info.authors || 'No author is available.';
  this.description = info.description || 'No description is available.';
  if (info.category) {
    this.category = info.category;
  } else {
    this.category = 'No category is available.';
  }
  if (info.industryIdentifiers) {
    this.isbn = info.industryIdentifiers[0].identifier;
  } else {
    this.isbn = 'No ISBN is available.';
  }
}

client.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`server up: ${PORT}`)
    });
  })
client.on('error', err => console.err(err));






