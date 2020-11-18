'use strict';

const express = require('express');
const app = express();
const superagent = require('superagent');
const dotenv = require('dotenv');
const pg = require('pg');

dotenv.config();

const PORT = process.env.PORT || 3333;
const client = new pg.Client(process.env.DATABASE_URL);



app.use(express.static('./public'));
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

app.get('/', renderHomePage);
app.get('/searches/new', showForm);
app.post('/add-book', saveBook);
// app.get('/view-details/:listItems_id', bookDetails); //TODO: <-----THIS


app.post('/searches', createSearch);

function saveBook(req, res) {
  // console.log('hello')
  //TODO: check if it's in DB

  //if true - select from DB and respond by rending? to index.ejs
  //if false - INSERT to the DB (SQL) SELECT FROM DB and render to index.ejs
  let { title, authors, description, image } = req.body;
  
  // const title = req.body.title;
  // const authors = req.body.authors;
  // const description = req.body.description;
  // const image = req.body.image;

  let SQL = 'INSERT INTO seed (title, authors, description, image) VALUES ($1, $2, $3, $4) RETURNING *;';
  let values = [title, authors, description, image];

  return client.query(SQL, values)
    .then(res.redirect('/'))
    .catch(err => console.error(err));
}



function renderHomePage(req, res) {
  let SQL = 'SELECT * FROM seed;';

  return client.query(SQL)
    .then(data => {
      res.render('pages/index', {bananas: data.rows})
    })
    .catch(err => console.error(err));
}

function showForm(req, res) {
  res.render('pages/searches/new')
  // .catch(err => console.log(err))
}

function createSearch(req, res) {
  let url = 'https://www.googleapis.com/books/v1/volumes?q=';

  if(req.body.search[1] === 'title') { url += `+intitle:${req.body.search[0]}`; }
  if(req.body.search[1] === 'author') { url += `+inauthor:${req.body.search[0]}`; }


  superagent.get(url)
    .then(data => {
      // console.log(data.body.items);
      return data.body.items.map(book => {
        return new Book(book.volumeInfo);
      });
    })
    .then(results => {
      // console.log(results);
      res.render('pages/searches/show', { searchResults: results })
    })
    .catch(err => console.log(err));
}

function Book(info) {
  // console.log(info[0]);
  // console.log(info.imageLinks.smallThumbnail.match(/^http:\/\//g));
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
  // this.image = info.imageLinks.smallThumbnail || 'https://i.imgur.com/J5LVHEL.jpg';
}

app.get('*', (req, res) => {
  res.render('pages/error', { error: new Error('Page not found.') } )
}) //set it on fire


client.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`server up: ${PORT}`)
    });
  })
client.on('error', err => console.err(err));
// .catch(err => console.log(err));






// .then(data => {
//   let bookCounter = data.rows.reduce((counter, val, idx) => {
//     return (counter < idx ? counter = idx : counter +1)
//   }, 0);
//   console.log('this is the real counter', bookCounter);
//   res.render('pages/index', {apple: bookCounter});
// })





