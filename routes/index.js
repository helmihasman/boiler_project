var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

/* GET home page. */
//router.get('/', function(req, res, next) {
//  res.render('index', { title: 'Home' });
//});

//router.get('/documents',function(req,res,next){
//    res.render('documents',{title:"Documents"});
//});
//
//router.get('/alert',function(req,res,next){
//    res.render('alert',{title:"Alert"});
//});
//
//router.get('/employee_management',function(req,res,next){
//    res.render('employee_management',{title:"Employee Management"});
//});
//
//router.get('/employee_details',function(req,res,next){
//    res.render('employee_details',{title:"Employee Details"});
//});
//
//router.get('/route_management',function(req,res,next){
//    res.render('route_management',{title:"Route Management"});
//});
//
//router.get('/set_route',function(req,res,next){
//    res.render('set_route',{title:"Set Route"});
//});
//
//router.get('/attendance',function(req,res,next){
//    res.render('attendance',{title:"Attendance"});
//});
//
//router.get('/login',function(req,res,next){
//    res.render('login',{title:"Login"});
//});
//
//router.get('/profile',function(req,res,next){
//    res.render('profile',{title:"Profile"});
//});
//
//router.get('/tracking',function(req,res,next){
//    res.render('tracking',{title:"Tracking"});
//});
//
//router.get('/path_playback',function(req,res,next){
//    res.render('path_playback',{title:"Path Playback"});
//});
//
//router.get('/map_management',function(req,res,next){
//    res.render('map_management',{title:"Map Management"});
//});
//
//router.get('/geofencing',function(req,res,next){
//    res.render('geofencing',{title:"Geofencing"});
//});



module.exports = router;
