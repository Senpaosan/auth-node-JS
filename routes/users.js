const express = require("express")
const router = express.Router()

const Person = require('../model/person')
const posting = require('../model/Posting')

const bcrypt = require('bcrypt')

router.get('/register', (req, res) => res.render('register'))

router.post('/register', (req, res) => {
    const name = req.body.usr
    const email = req.body.email
    const password = req.body.pswd
    const confirmPassword = req.body.cpswd

    let errors = []
    if (!name || !email || !password || !confirmPassword){
        errors.push({message: 'Please fill in all fields!'})
    }

    if (password.length < 10){
        errors.push({message: 'Password have to be at least 10 characters!'})
    } else {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).+$/
        if (!passwordRegex.test(password)){
            errors.push({
                message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*(),.?":{}|<>)'
            })
        }
    }

    if (password !== confirmPassword){
        errors.push({message: "Password didn't match!"})
    }

    if (errors.length > 0){
        res.render('register', {errors})
    } else {
        Person.findOne({email: email})
        .then(user => {
            if (user){
                errors.push({message: 'Email Already Exist!'})
                res.render('register', {errors})
            } else {
                bcrypt.hash(password, 10, (err, hashPassword) => {
                    if (err){
                        errors.push({message: 'Server error. Please try again'})
                        return res.render('register', {errors})
                    }
                    const newUser = new Person({
                        name: name,
                        email: email,
                        password: hashPassword,
                    })

                    newUser.save()
                    .then(user => {
                        res.render('login', {message: 'Acoount is Created! Please login!'})
                    })
                })
            }
        })
    }
})

router.get('/login', (req, res) => res.render('login'))

router.post('/login', async(req, res) => {
    const email = req.body.email
    const password = req.body.password

    const user = await Person.find({email: email})
    if (typeof user[0] == "undefined"){
        res.render("login", {message: "The user is not found!"})
    } else {
        bcrypt.compare(password, user[0].password, (err, isMatch) => {
            if (err){
                return res.render("login", {message: "Server error. Please try again later"})
            }

            if(isMatch){

                req.session.email = email
                req.session.name = user[0].name
                res.redirect("/")
            } else {
                res.render("login", {message: "Wrong password or email"})
            }
        })
    }
})

router.get("/logout", (req, res) => {
    req.session.destroy(function(){
        res.render("login", {message: "You have logged out!"})
    })
})

router.get("/newpost", (req, res) => {
    res.render('newpost')
})

router.post('/save', async(req, res) => {
    const postinggg = new posting({
        title: req.body.title,
        description: req.body.desc,
        author: req.session.name
    })

    await postinggg.save()
    res.redirect('/')
})

router.get('/delete/:id', async (req, res) => {
    try {
        const post = await posting.findById(req.params.id);
        
        if (!post) {return res.status(404).redirect('/');}
        
        if (post.author !== req.session.name) {
            return res.status(403).redirect('/');
        }
        
        await posting.deleteOne({ _id: req.params.id });
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).redirect('/');
    }
});

module.exports = router
