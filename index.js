const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
// Body Parser for POST requests
let bodyParser = require('body-parser');
app.use('/', bodyParser.urlencoded({ extended: false}));
// Connect to MongoDB
let mongoose = require('mongoose');
mongoose.connect(process.env.KEY, { useNewUrlParser: true, useUnifiedTopology: true });
// Create Schema
const ExerciseSchema = new mongoose.Schema({
  username: {type: String, required: true},
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date: {type: Date, required: false}
})
const UserSchema = new mongoose.Schema({
  username: {type: String, required: true}
})
// Create Model
let Exercise = mongoose.model('Exercise', ExerciseSchema);
let User = mongoose.model('User', UserSchema);

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
// POST to /api/users with form data username to create a new user
app.post('/api/users', function(req, res){
  let username = req.body.username;
  let newUser = new User({username: username});
  newUser.save()
  .then(data => {
    res.json({username: data.username, _id: data.id});
  })
  .catch(err => console.log(err));
});
// GET request to /api/users to get a list of all users
app.get('/api/users', function(req, res){
  User.find()
  .then(data => {
    res.json(data);
  })
  .catch( err => console.log(err));
});
// POST to /api/users/:_id/exercises with form data
app.post('/api/users/:_id/exercises', function(req, res){
  let id = req.params._id;
  let description = req.body.description;
  let duration = req.body.duration;
  let date = req.body.date;
  //let dateToSave;
  //console.log(date);
  /*try {
    if(date === '')
      {
        //console.log("I am here");
        dateToSave = new Date();
        //console.log(dateToSave)
      }
      else
      {
        dateToSave = new Date(date);
        //console.log(dateToSave)
      }
      //console.log(dateToSave);
  }
  catch(err){
    res.json({err: err.message})
  }*/
  
  User.findById(id)
  .then(data => {
    let newExercise = new Exercise({
      username: data.username,
      description: description,
      duration: duration,
      date: date ? new Date(date) : new Date()
    })
    newExercise.save()
    .then( exercise => {
      res.json({
        _id: id,
        username: data.username,
        date: exercise.date.toDateString(),
        duration: exercise.duration,
        description: exercise.description,
      });
    })
  })
  .catch(err => console.log(err));

});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

// GET request to /api/users/:_id/logs
app.get('/api/users/:_id/logs', function(req, res){
  let id = req.params._id;
  let from = req.query.from;
  let to = req.query.to;
  let limit = req.query.limit;
  User.findById(id)
  .then(data => {
    //console.log(data);
      Exercise.find({username: data.username})
      .then(exercise => {
        if(from !== undefined && to === undefined)
        {
          exercise = exercise.filter(ex => new Date(ex.date) > new Date(from));
        }
        else if(from === undefined && to !== undefined)
        {
          exercise = exercise.filter(ex => new Date(ex.date) < new Date(to));
        }
        else if(from !== undefined && to !== undefined)
        {
          exercise = exercise.filter(ex => new Date(ex.date) > new Date(from) && new Date(ex.date) < new Date(to));
        }
        if(limit !== undefined)
        {
          exercise = exercise.slice(0, limit);
        }
        console.log(exercise);
        let exercises = exercise.map(ex => {
          return {
            description: ex.description,
            duration: ex.duration,
            date: ex.date.toDateString()
          }
        })
        res.json({
          _id: id,
          username: data.username,
          count: exercise.length,
          log: exercises
        });
      })
      .catch(err => console.log(err));
    
  })
})