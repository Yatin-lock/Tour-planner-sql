const express = require("express");
const mysql = require("mysql");
var cors = require('cors');
const app = express();
const {v4 :uuidv4}=require('uuid');
const session=require('express-session');
const bcrypt = require('bcrypt');
const e = require("express");
const saltrounds=10;
app.use(express.json());
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
app.use(bodyParser.urlencoded({extended:true}));
app.use(cors({
    origin:"http://localhost:3000",
    credentials:true
}))


app.use(
    session({
        key:"userId",
        secret:"secretcode",
        resave:true,
        saveUninitialized:true,
        // cookie:{
        //     expires: 60*60*24
        // }
    })
);

function distanceLatLongToKM(lat1,lat2, lon1, lon2){
    lon1 =  lon1 * Math.PI / 180;
    lon2 = lon2 * Math.PI / 180;
    lat1 = lat1 * Math.PI / 180;
    lat2 = lat2 * Math.PI / 180;
    let dlon = lon2 - lon1;
    let dlat = lat2 - lat1;
    let a = Math.pow(Math.sin(dlat / 2), 2)
    + Math.cos(lat1) * Math.cos(lat2)
    * Math.pow(Math.sin(dlon / 2),2);
  
    let c = 2 * Math.asin(Math.sqrt(a));
    let r = 6371;
    return(c * r);
  }
const db = mysql.createConnection({
    user:"root",
    host:"localhost",
    password:"password",
    database:"TourPlanner"
});
app.post('/register',(req,res)=>{
    const {email:username,password} = req.body.user;
    // console.log(username,password);
    db.query('SELECT * FROM user WHERE username=?;',
    [username],
    (err,result)=>{
        if(err) {
            console.log(err);
        }
        if(result[0]){
            res.send({authenticated:false,msg:'User already exists'});
        }
        else{
            bcrypt.hash(password,saltrounds,
                (err,hash)=>{
                if(err)
                    res.status(500).send('internal server error');
                else{
                    db.query('INSERT INTO user (username, password,id) VALUES(?,?,?);',
                    [username,hash,uuidv4()],
                    (err,result)=>{
                        if(err)
                            res.send({authenticated:false,msg:'user already registered'});
                        else if(result){
                            res.send({authenticated:true,msg:'Success'});
                            req.session.user = username;
                        }
                    });
                }   
            })
        }
        
    })

})
app.post('/login',(req,res)=>{
    const{username,password} = req.body;
    db.query('SELECT * FROM user WHERE username=?;',
    [username,password],
    (err,result)=>{
        if(err) {
            console.log(err);
        }
        if(result[0]){
            bcrypt.compare(password,result[0].password,(error,response)=>{
                if(response){
                    req.session.user = username;
                    res.send({authenticated:true,msg:'Success'});
                    return;
                }
                else{
                    res.send({authenticated:false,msg:'Incorrect username or password'});
                }
            });
        }
        else{
            res.send({authenticated:false,msg:'Incorrect username or password'});
        }
        
    })
})
app.post('/add/locations',(req,res)=>{
    const {location,description,geometry}  = req.body;
    const {coordinates} = geometry;
    const lon = coordinates[1],lat=coordinates[0],id=uuidv4();
    let f=1;
    db.query('INSERT INTO locations(name,description,id) VALUES(?,?,?)',
    [location,description,id],
    (err,result)=>{
        if(result){
        }
        else{
            f=0;
        }
    })
    db.query('INSERT INTO coordinates(lon,lat,id) VALUES(?,?,?)',
    [lon,lat,id],
    (err,result)=>{
        if(result){
        }
        else{
            f=0;
        }
    })
    if(f){
        res.send({authenticated:true,msg:'data successfully added'});
    }
    else{
        res.send({authenticated:false,msg:'data not added'});
    }
})
app.post('/getLocs',(req,res)=>{
    let locs=[];
    db.query('SELECT * FROM locations natural join coordinates',
    (err,locations)=>{
        if(locations){
            for(location of locations){
                const loc={
                    name:location.name,
                    geometry:{
                        type:'point',
                        coordinates:[location.lon,location.lat]
                    },
                    description: location.description,
                    id:location.id
                }
                locs.push(loc);
            }
        }
        res.send(locs);
    })
})


app.post('/getLoc',(req,res)=>{
    const {id} = req.body;
    db.query('SELECT * FROM locations natural join coordinates where id = ?',
        [id],
        (err,location)=>{
            if(err)
                console.log(err);
            if(location){
                const loc={
                    name:location[0].name,
                    geometry:{
                        type:'point',
                        coordinates:[location[0].lon,location[0].lat]
                    },
                    description: location[0].description,
                    id:location[0].id
                }
                res.send({authenticated:true,data:{loc}});
            }
            else{
                res.send({authenticated:false,msg:'Invalid ID'});
            }
        })
})

app.post('/getRating',(req,res)=>{
    const {id} = req.body;
    let ratingsArray = [];
    db.query('SELECT * FROM ratings where locID = ?',
    [id],
    (err,ratings)=>{
        if(err)
            console.log(err);
        for(let r1 of ratings){
            const r = {
                rating: r1.rating,
                username: r1.username,
                desc: r1.ratingDesc
            }
            ratingsArray.push(r);
        }
        res.send(ratingsArray);
    });
    
})

app.post('/add/rating',(req,res)=>{
    const {rating,desc,user,id} = req.body.netRating;
    console.log(rating,desc,user,id);
    db.query('insert into ratings(rating,username,ratingDesc,locID) values(?,?,?,?)',
    [rating,user,desc,id],
    (err,result)=>{
        if(err){
            console.log(err);
        }
        if(result){
            res.send({authenticated:true})
        }
    })

})

app.get('/getUser',(req,res)=>{
    if(req.session.user)
        res.send({loggedIn:true,user:req.session.user});
    else res.send({loggedIn:false});
    console.log(req.session.user);
})

const port = 4000;
app.listen(port,()=>{
    console.log(`Listening on port ${port}`);
})