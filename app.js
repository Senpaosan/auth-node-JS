require('dotenv').config()
const express = require('express')
const app = express()
const expressLayout = require('express-ejs-layouts')
const mongoose = require('mongoose')
const session = require('express-session')
const posting = require('./model/Posting')

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB is Connected!'))
.catch(err => {
    console.error('Failed to connect MongoDB', err)
    process.exit(1)
})

app.use(expressLayout)
app.set('view engine', 'ejs')

app.use(express.urlencoded({
    extended: false
}))

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))


app.use('/users', require('./routes/users'))

app.get('/', async (req, res) => {
    if (typeof req.session.email != 'undefined'){
        const user = req.session.name
        const myPostings = await posting.find({author: user}).sort({createdAt: 'desc'})
        const otherPostings = await posting.find({author: {$ne: user}}).sort({createdAt: 'desc'})
        
        res.render('dashboard',{
                user: user, 
                myPostings: myPostings, 
                otherPostings: otherPostings})
    } else{
        res.render('login')
    }
})

const port = process.env.PORT || 3500
app.listen(port, console.log(`Server strated on port ${port}`))