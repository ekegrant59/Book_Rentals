require('dotenv').config()
const ejs = require('ejs')
const mongoose = require('mongoose')
const express = require('express')
const bcrypt = require('bcrypt')
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken')
const admin_user_schema = require('./admin_user_schema')
const renter_schema = require('./renter_schema')
const book_listing = require('./book_listing_schema')
const AdminBro = require('admin-bro')
const AdminBroExpressjs = require('admin-bro-expressjs')
const book_listing_schema = require('./book_listing_schema')
const mongodb = 'mongodb://localhost:27017/book_rental'
mongoose.connect(mongodb, {useNewUrlParser: true})
.then(()=>{
    console.log('Database Connected Sucessfully')
})
.catch((err)=>{
    console.log(err, 'Conection Failed')
})

// We have to tell AdminBro that we will manage mongoose resources with it
AdminBro.registerAdapter(require('admin-bro-mongoose'))

// express server definition
const app = express()
// app.use(formidableMiddleware());

const adminBro = new AdminBro({
  resources: [renter_schema, book_listing, {
    resource: admin_user_schema,
    options: {
      properties: {
        encryptedPassword: {
          isVisible: false,
        },
        password: {
          type: String,
          isVisible: {
            list: false, edit: true, filter: false, show: false,
          },
        },
      },
      actions: {
        new: {
          before: async (request) => {
            // console.log(request.payload)
            if(request.payload.password) {
              request.payload = {
                ...request.payload,
                encryptedPassword: await bcrypt.hash(request.payload.password, 10),
                password: ''
              }
            }
            return request
          },
        }
      }
    }
  }],
  rootPath: '/admin',
})

const router = AdminBroExpressjs.buildAuthenticatedRouter(adminBro, {
  authenticate: async (email, password) => {
    const admin_user = await admin_user_schema.findOne({ email })
    if (admin_user) {
      const matched = await bcrypt.compare(password, admin_user.encryptedPassword)
      if (matched) {
        return admin_user
      }
    }
    return false
  },
  cookiePassword: 'some-secret-password-used-to-secure-cookie',
})

app.use(adminBro.options.rootPath, router)

app.set('view engine', 'ejs')
app.use('/assets', express.static('assets'))
app.use(cookieParser())
app.use(express.urlencoded({extended: true}))

app.get('/', async (req,res)=> {
  if (req.cookies.token){
    const token = req.cookies.token
    const user = jwt.verify(token, 'asecret')
    req.user = user
    const auser = req.user.user.email
    const theuser = await renter_schema.findOne({email: auser})
    res.render('index', {username: theuser.username})
  }else{
    const theuser = ''
    res.render('index', {username: theuser})
  }
})

app.get('/login', (req,res)=>{
  res.render('login')
})

app.get('/register', (req,res)=>{
  res.render('register')
})

// Log out Route
app.get('/logout', (req, res)=>{
  res.clearCookie('token')
  res.redirect('/login')
})

app.post('/register', async (req,res)=>{
  // console.log(req)
  const regInfo = req.body
  const password = regInfo.password

  // console.log(regInfo)

  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(password, salt)

  registerUser()

  async function registerUser(){
    try{
      const renter = new renter_schema({
        email: regInfo.email,
        username: regInfo.username,
        password: hashedPassword
      })
      await renter.save()

      const payload = {
        user: {
            email: regInfo.email
        }
      }
      const token = await jwt.sign(payload, 'asecret', {
        expiresIn: '3600s'
      } )

      res.cookie('token', token, {
          httpOnly: false
      } )

      res.redirect('/login')

    } 
      catch(err){
        console.log(err)
    }
  }
})

app.post('/login', (req,res)=>{
  const loginInfo = req.body
  // console.log(loginInfo)
  const email = loginInfo.email
  const password = loginInfo.password

  renter_schema.findOne({email})
  .then((renter)=>{
    // console.log(renter)
    bcrypt.compare(password, renter.password, async (err,data)=>{
      if(err){
        console.log(err)
      } else{
          // console.log(data)

          if(data){
            const payload = {
                user: {
                    email: renter.email
                }
            }
  
            const token = await jwt.sign(payload, 'asecret', {
                expiresIn: '3600s'
            } )
            
            res.cookie('token', token, {
                httpOnly: false
            })
  
            res.redirect('/profile')
          } else{
            res.redirect('/login')
          }

      }
    })
  })
  .catch((err)=>{console.log(err)})
})

app.get('/profile', protectRoute, async (req,res)=>{
  const user = req.user.user.email
  const auser = await renter_schema.findOne({email: user})
  // console.log(req.user, auser)

  const rentals = await book_listing_schema.find({rentedBy: user})

  res.render('profile', {username: auser.username, rentals: rentals})
})

function protectRoute(req, res, next){
  const token = req.cookies.token
  try{
      const user = jwt.verify(token, 'asecret')

      req.user = user
      // console.log(req.user)
      next()
  }
  catch(err){
      res.clearCookie('token')
      return res.redirect('/')
  }
}

app.get('/books', async (req,res)=>{
  if (req.cookies.token){
    const token = req.cookies.token
    const user = jwt.verify(token, 'asecret')
    req.user = user
    const auser = req.user.user.email
    const theuser = await renter_schema.findOne({email: auser})
    const textbooks = await book_listing_schema.find({category: 'Textbook'})
    const fictions = await book_listing_schema.find({category: 'Fiction'})
    const cookbooks = await book_listing_schema.find({category: 'cookbook'})
    const kidbooks = await book_listing_schema.find({category: 'kidBooks'})
    const crafts = await book_listing_schema.find({category: 'crafts'})
    const mysterys = await book_listing_schema.find({category: 'mystery'})
    res.render('books', {textbooks: textbooks, fictions: fictions, cookbooks: cookbooks, kidbooks: kidbooks, crafts: crafts,mysterys: mysterys, user: auser, username: theuser.username})
  }else{
    const auser = 'a'
    const theuser = ''
    const textbooks = await book_listing_schema.find({category: 'Textbook'})
    const fictions = await book_listing_schema.find({category: 'Fiction'})
    const cookbooks = await book_listing_schema.find({category: 'cookbook'})
    const kidbooks = await book_listing_schema.find({category: 'kidBooks'})
    const crafts = await book_listing_schema.find({category: 'crafts'})
    const mysterys = await book_listing_schema.find({category: 'mystery'})
    res.render('books', {textbooks: textbooks, fictions: fictions, cookbooks: cookbooks, kidbooks: kidbooks, crafts: crafts,mysterys: mysterys, user: auser, username: theuser})
  }
 })

app.post('/update', (req,res)=>{
  const info = req.body
  const title = info.title
  const token = req.cookies.token
  const user = jwt.verify(token, 'asecret')
  req.user = user
  const auser = req.user.user.email
  book_listing_schema.updateOne({title: title}, {$set:{rentedBy: auser}})
  .then(message=>console.log(message))
  .catch(err=> console.log(err))
  
  res.redirect('/books')
})

app.post('/unrent', (req,res)=>{
  const info = req.body
  const title = info.title
  const empty = ''
  book_listing_schema.updateOne({title: title}, {$set:{rentedBy: empty }})
  .then(message=>console.log(message))
  .catch(err=> console.log(err))
  res.redirect('/profile')
})

const port = process.env.PORT || 3000
app.listen(port, ()=>{
    console.log(`App started on port ${port}`)
} )