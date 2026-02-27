
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));
mongoose.set("bufferCommands", false); // fail fast if not connected
console.log("MONGODB_URI =", process.env.MONGODB_URI ? "LOADED" : "MISSING");
const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

mongoose.connect(process.env.MONGODB_URI)
.then(()=>console.log("MongoDB Connected"))
.catch(err=>console.error(err));

// Schemas
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: { type: String, default: "worker" }
});
const officeSchema = new mongoose.Schema({
  name: String,
  lat: Number,
  lng: Number,
  radiusMeters: { type: Number, default: 100 }
});
const attendanceSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  type: String,
  serverTime: { type: Date, default: Date.now },
  lat: Number,
  lng: Number,
  distanceMeters: Number,
  photoPath: String,
  status: String
});

const User = mongoose.model("User", userSchema);
const Office = mongoose.model("Office", officeSchema);
const Attendance = mongoose.model("Attendance", attendanceSchema);

// JWT Middleware
function auth(req,res,next){
  const token = req.headers.authorization?.split(" ")[1];
  if(!token) return res.status(401).json({message:"No token"});
  try{
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  }catch(err){ return res.status(401).json({message:"Invalid token"}); }
}

// Haversine distance
function getDistance(lat1, lon1, lat2, lon2){
  const R = 6371000;
  const dLat = (lat2-lat1)*Math.PI/180;
  const dLon = (lon2-lon1)*Math.PI/180;
  const a = 
    Math.sin(dLat/2)*Math.sin(dLat/2) +
    Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180) *
    Math.sin(dLon/2)*Math.sin(dLon/2);
  const c = 2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
  return R*c;
}

// Multer
const storage = multer.diskStorage({
  destination: (req,file,cb)=>cb(null,"uploads"),
  filename: (req,file,cb)=>cb(null,Date.now()+"-"+file.originalname)
});
const upload = multer({storage});

// Login
app.post("/auth/login", async (req,res)=>{
  const {email,password} = req.body;
  const user = await User.findOne({email});
  if(!user) return res.status(400).json({message:"User not found"});
  const match = await bcrypt.compare(password,user.password);
  if(!match) return res.status(400).json({message:"Wrong password"});
  const token = jwt.sign({id:user._id,role:user.role},process.env.JWT_SECRET);
  res.json({token});
});

// Punch
app.post("/attendance/punch", auth, upload.single("photo"), async (req,res)=>{
  const {lat,lng,type} = req.body;
  const office = await Office.findOne();
  if(!office) return res.status(400).json({message:"Office not configured"});

  const distance = getDistance(
    parseFloat(lat), parseFloat(lng),
    office.lat, office.lng
  );

  const inside = distance <= office.radiusMeters;
  const status = inside ? "approved" : "rejected";

  const attendance = await Attendance.create({
    userId: req.user.id,
    type,
    lat,
    lng,
    distanceMeters: distance,
    photoPath: req.file?.path,
    status
  });

  res.json(attendance);
});

// Seed route (create admin + office)
app.get("/seed", async (req,res)=>{
  await User.deleteMany({});
  await Office.deleteMany({});
  const hash = await bcrypt.hash("Admin@123",10);
  await User.create({name:"Admin",email:"admin@test.com",password:hash,role:"admin"});
  await Office.create({name:"Main Office",lat:12.9716,lng:77.5946,radiusMeters:100});
  res.send("Seeded! Admin: admin@test.com / Admin@123");
});

app.listen(4000,()=>console.log("Server running on http://localhost:4000"));
