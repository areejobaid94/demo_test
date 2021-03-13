'use strict';

const express = require('express')
const app = express();
const cors = require('cors');
const superagent = require('superagent');
app.use(cors());
require('dotenv').config();
const port = process.env.PORT;
const pg = require('pg');
var methodOverride = require('method-override')
app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'))
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
app.get('/searchYelp', (req, res) => {
  res.render('searchYelp');
});

app.get('/', (req, res) => {
  client.query('select * from yelp').then(data =>{
    res.render('allSavedYelp', {data:data.rows})
  })
});

app.get('/yelp', yelpRender);

app.post('/yelp', yelpSaveData);

app.put('/yelp/:id', updateData);

app.delete('/yelp/:id', deleteData);

function deleteData(req,res){
  deleteFromDB(req.params.id).then(data=>{
      res.redirect('/');
  });
}

function deleteFromDB (id){
  return client.query('DELETE from yelp where id = $1',[id]).then(data=>{
    return;
  })
};
function updateData(req, res) {
  console.log(req.body);
  console.log(req.params);
  updateDB(req.body.name, req.body.img, req.params.id).then(data => {
    res.render('yelpDetails', { data: data });
  });
}
function updateDB(name, img, id) {
  let query = 'UPDATE YELP SET NAME = $1, IMG = $2  WHERE ID = $3 returning *;';
  return client.query(query, [name, img, id]).then(data => {
    return data.rows[0];
  })
}
function yelpSaveData(req, res) {
  console.log(req.body);
  save(req.body.img, req.body.name).then(data => {
    res.render('yelpDetails', { data: data });
  })
}

function save(img, name) {
  let query = 'INSERT INTO YELP (NAME,IMG) VALUES ($2,$1) RETURNING *';
  return client.query(query, [img, name]).then(data => {
    return data.rows[0];
  })
}
function yelpRender(req, res) {
  getDataFromYelp(req.query.name, req.query.page).then(data => {
    res.render('allYelp', { data: data });
  });

};

function getDataFromYelp(name, page) {
  let key = process.env.YELP_API_KEY;
  let limit = 5;
  let newoffset = ((page - 1) * 5) + 1;
  const query = {
    'location': name,
    'limit': limit,
    'offset': newoffset
  };
  return superagent.get('https://api.yelp.com/v3/businesses/search').set({ "Authorization": `Bearer ${key}` }).query(query)
    .then(data => {
      let YelpsArray = data.body.businesses.map(ele => {
        return new Yelp(ele);
      });
      return YelpsArray;
    })
    .catch(err => { console.log(err) })
}

function Yelp(yelpObj) {
  this.name = yelpObj.name;
  this.image_url = yelpObj.image_url;
  this.price = yelpObj.price;
  this.rating = yelpObj.rating;
  this.url = yelpObj.url;
};

client.connect().then(() => {
  app.listen(port, () => {
    console.log(`app listening at http://localhost:${port}`);
  });
}).catch(e => {
  console.log(e, 'errrrrroooooorrrr')
});