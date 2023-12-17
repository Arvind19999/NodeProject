import express from "express"
import path from "path";
import mongoose, { now } from "mongoose";
import cookieParser from "cookie-parser";
import  Jwt  from "jsonwebtoken";
import bcrypt from "bcrypt";

import {name} from "./features.js";
// import { decode } from "punycode";

mongoose.connect("mongodb://localhost:27017",{
    dbName : "Backend"
})
.then(()=>{
    console.log("Database connected Successfully")
})
.catch(err=>{
    console.log(err)
})

const mongooseSchema = new mongoose.Schema({
    name : String,
    email:String
})

const Message = mongoose.model("Message",mongooseSchema)

const userSchema = new mongoose.Schema({
    name : String,
    email:String,
    password : String
})

const User = mongoose.model("User",userSchema)
const app = express();

//Using Middleware
app.use(express.static(path.join(path.resolve(),"public")));
app.use(express.urlencoded({extended:true}))
app.use(cookieParser());
//Settig up View Engine
app.set("view engine","ejs")

//Middlewares
const isAuthenticated = async (req,res,next)=>{
    const token = req.cookies.token
    if(token){
        const decodedData = Jwt.verify(token,"fhjgdhsfjdsffdh");
        // console.log(decodedData.id)
        console.log("This is the decoded data "+decodedData.id)
        req.user = await User.findById(decodedData.id) //session data

        console.log("This is the session data " + req.user);
        next();
    }
    else{
        res.render('login')
    }
}

const users = [];
//Get Routes
app.get('/',(req,res,next)=>{
const localPath = path.resolve()
res.render("index",{name})
// next();
})

app.get("/success",(req,res)=>{
    res.render("success")
})

app.get("/add",(req,res)=>{
    Message.create({name:"Testing",email:"testing@gmail.com"})
    .then((data)=>console.log(data))
    .catch(err=>console.log(err))
    res.send("Data added successfully")
})

app.get('/login',isAuthenticated,(req,res)=>{
    res.render('home',{name:req.user.name});
})

app.get("/users",(req,res)=>{
    res.json({
        users
    })
})

app.get("/register",(req,res)=>{
    res.render("register")
})

app.get('/home',(req,res)=>{  //Hitting form action for logOut
    res.cookie("token",null,{
        httpOnly : true,
        expires : new Date(Date.now())
    });
    res.redirect('/login')
})


//Post Routes
app.post("/contact",async (req,res)=>{
    // users.push({userName : req.body.name,userEmail : req.body.email})
    const name = req.body.name
    const email = req.body.email
    await Message.create({name:name,email:email})
    res.redirect("/success");
})

app.post('/login',async (req,res)=>{
    const userEmail = req.body.email
    const userPassword = req.body.password
    let users = await User.findOne({email:userEmail})
    if(!users){
        return res.redirect("/register")
    }

    const isMatch = await bcrypt.compare(userPassword,users.password)
    if(!isMatch){
        return res.render("login",{Message: "Incorrect Email or Password"})
    }
    const token = Jwt.sign({id:users._id},"fhjgdhsfjdsffdh")
    res.cookie("token",token, {
        httpOnly:true,
        expires: new Date(Date.now()+ 60*1000)
    });
    res.render('home',{name : userEmail})

})


app.post('/register',async (req,res)=>{
    console.log(req.body)
    const userName = req.body.name
    const userEmail = req.body.email
    const userPassword = req.body.password
    let users = await User.findOne({email : userEmail})
    if(users){
        return res.redirect("/login")
    }
    const hashedPassword = await bcrypt.hash(userPassword,10)
     users = await User.create({name:userName,email:userEmail,password:hashedPassword})
     req.user = {name:userName,email:userEmail}
    const token = Jwt.sign({id:users._id},"fhjgdhsfjdsffdh")
    res.cookie("token",token, {
        httpOnly:true,
        expires: new Date(Date.now()+ 60*1000)
    });
    res.render('home',{name : req.user.name})
})


app.listen(4040,()=>{
    console.log("Server is working properly");
});