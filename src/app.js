require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const cors = require('cors')
const app = express()

const port = process.env.PORT || 3000

mongoose.connect(process.env.MONGO_URI, {useUnifiedTopology: true}, (err) => {
  if (err) console.log(err)
  else console.log('mongo is connected')
})

app.use(bodyParser.urlencoded({ extended: false }))
app.use(cors())
app.use('/public', express.static(`${process.cwd()}/public`))

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html')
})

let urlSchema = new mongoose.Schema({
  original_url: {type: String, required: true},
  short: Number
})

const Url = mongoose.model('Url', urlSchema)

let responseObject = {}

app.post('/api/shorturl', (req, res) => {
  let inputUrl = req.body['url']
  responseObject['original_url'] = inputUrl

  let inputShort = 1

  let urlRegex = new RegExp(/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi)

  if(!inputUrl.match(urlRegex)) {
    res.json({error: 'Invalid URL'})
    return
  }

  Url.findOne({}).sort({short: 'desc'}).exec((error, result) => {
    if(!error && result != undefined) {
      inputShort = result.short + 1
    }
    if(!error) {
      Url.findOneAndUpdate(
        {original_url: inputUrl},
        {original_url: inputUrl, short: inputShort},
        {new: true, upsert: true},
        (error, savedUrl) => {
          if(!error) {
            responseObject['short_url'] = savedUrl.short
            res.json(responseObject)
          }
        }
      )
    }
  })
})

app.get('/api/shorturl/:input', (req, res) => {
  let input = req.params.input

  Url.findOne({short: input}, (error, result) => {
    if(!error && result != undefined) {
      res.redirect(result.original_url)
    } else {
      res.json('URL not found')
    }
  })
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`)
})