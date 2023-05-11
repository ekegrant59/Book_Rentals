require('dotenv').config()
const ejs = require('ejs')
const mongoose = require('mongoose')
const express = require('express')
const bcrypt = require('bcrypt')
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken')
const admin_user_schema = require('./schema/admin_user_schema')
const renter_schema = require('./schema/renter_schema')
const book_listing_schema = require('./schema/book_listing_schema')
const mongodb = 'mongodb+srv://ekegrant59:M1Uh1XZFtitD75nl@book-rentals.r2jlzqe.mongodb.net/book-rental'
const session = require('express-session')
const adminkey = 'ADMIN3456&&';


mongoose.connect(mongodb, {useNewUrlParser: true})
.then(()=>{
    console.log('Database Connected Sucessfully')
})
.catch((err)=>{
    console.log(err, 'Conection Failed')
})


const app = express()

app.set('view engine', 'ejs')
app.use('/assets', express.static('assets'))
app.use(cookieParser())
app.use(express.urlencoded({extended: true}))
app.use(express.json())

app.use(
    session({
      resave: false,
      saveUninitialized: true,
      secret: 'secret',
    })
);
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

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
    renter_schema.findOne({email: email}, (err, details)=>{
      if (!details){
        req.flash('danger', 'User does not exist')
        res.redirect('/login')
      } else{
        bcrypt.compare(password, renter.password, async (err,data)=>{
          if (data){
            const payload = {
              user: {
                  email: renter.email
              }
          }

          const token = jwt.sign(payload, 'asecret', {
              expiresIn: '3600s'
          } )
          
          res.cookie('token', token, {
              httpOnly: false
          })

          res.redirect('/profile')
        } else{
          req.flash('danger', 'Incorrect password ')
          res.redirect('/login')
        }
        })
      }
    })
  }).catch((err)=>{console.log(err)})
})

app.get('/profile', protectRoute, async (req,res)=>{
  const user = req.user.user.email
  const auser = await renter_schema.findOne({email: user})
  // console.log(req.user, auser)

  const rentals = await book_listing_schema.find({rentedBy: user})
  // console.log(rentals)

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
  book_listing_schema.findOneAndUpdate({title: title}, {$set:{rentedBy: auser}}, {new:true})
  .then(message=>console.log(message))
  .catch(err=> console.log(err))
  
  res.redirect('back')
})

app.post('/unrent', (req,res)=>{
  const info = req.body
  const title = info.title
  const empty = ''
  book_listing_schema.findOneAndUpdate({title: title}, {$set:{rentedBy: empty }}, {new:true})
  .then(message=>console.log(message))
  .catch(err=> console.log(err))
  res.redirect('/profile')
})

app.get('/adminregister', (req,res)=>{
    res.render('adminregister')
})

app.post('/adminregister', async(req,res)=>{
      const regInfo = req.body
      const password = regInfo.password
    
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(password, salt)
    
        run()
        async function run(){
            try {
                const admin = new admin_user_schema({
                    email: regInfo.email,
                    password: hashedPassword
                })
                await admin.save()
                res.redirect('/admin')
            }
            catch (err) {
              console.log(err.message)
              req.flash('danger','An Error Occured,Please try again')
              res.redirect('/adminregister')
            
            }
        }
})

app.get('/admin',protectAdminRoute, async (req,res)=>{
      try{
        const books = await book_listing_schema.find()
          res.render('admin', {books: books})
      } catch(err){
          console.log(err)
      }
  })
      
function protectAdminRoute(req, res, next){
    const token = req.cookies.admintoken
    try{
        const user = jwt.verify(token, adminkey)

        req.user = user
        // console.log(req.user)
        next()
    }
    catch(err){
        res.clearCookie('admintoken')
        return res.render('adminlogin')
    }
}
  
app.post('/adminlogin', (req,res)=>{
    const loginInfo = req.body

    const email = loginInfo.email
    const password = loginInfo.password

    admin_user_schema.findOne({email})
    .then((admin)=>{
        admin_user_schema.findOne({email: email}, (err,details)=>{
            if(!details){
                req.flash('danger','Incorrect email')
                res.redirect('/admin')
            } else{
                bcrypt.compare(password, admin.password, async (err,data)=>{
                    if(data){
                        const payload1 = {
                            user:{
                                email: admin.email
                            }
                        }
                        const token1 = jwt.sign(payload1, adminkey,{
                            expiresIn: '3600s'
                        })

                        res.cookie('admintoken', token1, {
                            httpOnly: false
                        })

                        res.redirect('/admin')
                    } else{
                        req.flash('danger', 'incorrect password')
                        res.redirect('/admin')
                    }
                })
            }
        })
    }).catch((err)=>{
        console.log(err)
    })
})

app.get('/addbook',protectAdminRoute, (req,res)=>{
  res.render('addbook')
})

app.post('/add', async(req,res)=>{
    const details = req.body
    newbook()

    async function newbook(){
        try{
            const book = new book_listing_schema({
                title: details.title,
                author: details.author,
                category: details.category,
                ISBN: details.ISBN,
                img: details.image,
                status: details.status
            })
            await book.save()
            req.flash('success', 'New Book Successfully Added!')
            res.redirect('/addbook')
        } catch(err){
            req.flash('danger', 'An Error Ocurred, Please Try Again')
            res.redirect('/addbook')
            console.log(err)
        }
    }
})

app.get('/edit/:id',protectAdminRoute, async (req,res)=>{
  const bookID = req.params.id
  const book = await book_listing_schema.findOne({_id: bookID})
  res.render('edit-book', {book: book})
})

app.post('/edit', (req,res)=>{
  const details = req.body
  const id = details.id
  const filter = {_id: id}

  book_listing_schema.findOneAndUpdate(filter, {$set: {title: details.title,author: details.author, category: details.category,ISBN: details.ISBN, img: details.image, status: details.status}}, {new:true}, (err)=>{
      if(err){
        console.log(err)
        req.flash('danger', "An Error Occured, Please Try Again!")
        res.redirect('back')
      }
      req.flash('success', "Book Updated Succesfully!")
        res.redirect('back')
    })
})

app.get('/delete/:id',protectAdminRoute, (req,res)=>{
  const id = req.params.id
  const filter = {_id: id}

  book_listing_schema.findOneAndDelete(filter, (err)=>{
    if(err){
      console.log(err)
      res.redirect('/admin')
    }
    res.redirect('/admin')
  })
})

app.get('/view/:id', async (req,res)=>{
  const id = req.params.id
  const filter = {_id: id}
  const book = await book_listing_schema.findOne(filter)
  if(req.cookies.token){
    const token = req.cookies.token
    const user = jwt.verify(token, 'asecret')
    req.user = user
    const auser = req.user.user.email
    const theuser = await renter_schema.findOne({email: auser})
    res.render('viewbook', {book: book, user:auser, username: theuser.username })
  } else {
    const auser = 'a'
    const theuser = ''
    res.render('viewbook', {book: book, user:auser, username: theuser.username })
  }
  
})

app.get('/adminlogout', (req, res)=>{
  res.clearCookie('admintoken')
  res.redirect('/admin')
})

const port = process.env.PORT || 5000
app.listen(port, ()=>{
    console.log(`App started on port ${port}`)
} )