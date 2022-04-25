const mysql = require("mysql");
const {v4 :uuidv4}=require('uuid');
const db = mysql.createConnection({
    user:"root",
    host:"localhost",
    password:"password",
    database:"TourPlanner"
});
const loc = [
    {
        name: "Qutub Minar",
        geometry: {
            type: "point",
            coordinates: [28.5246,77.1857]
        },
        description:"Beautiful Place"
    },
    {
        name: "Taj Mahal",
        geometry: {
            type: "point",
            coordinates: [27.1726,78.0422]
        },
        description:"Beautiful Place"
    },
    {
        name: "Red Fort",
        geometry: {
            type: "point",
            coordinates: [28.6558,77.2411]
        },
        description:"Beautiful Place"
    },
    {
        name: "Britania Chowk",
        geometry: {
            type: "point",
            coordinates: [28.6838,77.1460]
        },
        description:"Beautiful Place"
    },
    {
        name: "Rohini",
        geometry: {
            type: "point",
            coordinates: [28.7243,77.1354]
        },
        description:"Beautiful Place"
    }
]
for(location of loc){
    const lon = location.geometry.coordinates[0],
    lat = location.geometry.coordinates[1],
    name=location.name,
    description=location.description;
    db.query('INSERT INTO locations(lon,lat,name,description,id) VALUES(?,?,?,?,?)',
    [lon,lat,name,description,uuidv4()],(err,result)=>{
        if(err){
            console.log(err);
        }
        console.log(result);
    })
}