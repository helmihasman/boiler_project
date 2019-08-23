var express = require('express');
var multer  =   require('multer');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var flash = require('express-flash');
var session = require('express-session');
var expressValidator = require('express-validator');
var methodOverride = require('method-override');
var fs = require('fs');

var mysql = require('mysql');
var request = require('request');

var fs = require("fs");

var Client = require('ibmiotf');

var routes = require('./routes/index');
var users = require('./routes/users');
//var customers = require('./routes/customers');
//var admin_users = require('./routes/admin_users');

var app = express();

var mysql = require("mysql");
var http = require('http').Server(app);
var io = require('socket.io')(http);


var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var Store = require('express-session').Store;

app.use(function(req, res, next){
  res.io = io;
  next();
});

//http.listen(80);
//var port = app.settings.port;
//var port2 = app.get('port');
http.listen(process.env.PORT || 3000, function(){
 // console.log('listening on **:'+process.env.PORT);
// console.log('listening on **:'+port);
// console.log('listening on **$:'+port2);
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(session({secret:"secretpassqchat123456"}));
app.use(function(req,res,next){
    res.locals.session = req.session;
    next();
});

app.use(logger('dev'));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true }));
app.use(cookieParser());
app.use(expressValidator());
app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/uploads', express.static(process.cwd() + '/uploads'));

app.use('/', routes);
app.use('/users', users);

//passport
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

var storage =   multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, './uploads');
  },
  filename: function (req, file, callback) {
    callback(null, file.fieldname + '-' + Date.now()+'.jpg');
  }
});

var storage_image =   multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, './uploads/image');
  },
  filename: function (req, file, callback) {
    callback(null, file.fieldname + '-' + Date.now()+'.jpg');
  }
});

var upload = multer({ storage : storage}).single('boiler_img');

var upload_image = multer({ storage : storage_image}).single('file');

app.use(methodOverride(function(req, res){
 if (req.body && typeof req.body == 'object' && '_method' in req.body) 
   { 
      var method = req.body._method;
      delete req.body._method;
      return method;
    } 
  }));


//var connect_mysql = mysql.createPool({
//     host:'us-cdbr-iron-east-04.cleardb.net',
//     user:'b753688ff4397b',
//     password:'a2c32182',
//     port:3306,
//     database:'ad_4a07813f131a943'
//});

//Compose boiler
var con = mysql.createConnection({
    host: "sl-us-south-1-portal.22.dblayer.com",
    user: "admin",
    password: "VGVWAANFSQDFHUFQ",
    database: "compose",
    port:39114
});


app.post("/login", passport.authenticate('local_qchat', {
    

    successRedirect: '/',

    failureRedirect: '/login',

    failureFlash: true

}), function(req, res, info){
    
    res.render('login',{'message' :req.flash('message')});

});

app.get('/login', function(req, res, next) {
  res.render('login', { title: 'Login' });
});

app.get('/', function(req, res, next) {
    
    var data_list = [];
    var steam_cost = 0;
    
    var d = new Date();
    d.setMinutes(d.getMinutes()+420);
    var ddate = d.getDate();
    var dmonth = d.getMonth()+1;
    var dyear = d.getFullYear();
    
    //real query
    //"SELECT count(readings_id) as number,sum(wf_out) as wf_sum,sum(steam) as st_sum,year(read_time) as year_s,month(read_time)as month_s,day(read_time) as day_s,hour(read_time) as hour_s FROM readings where year(read_time) = '"+dyear+"' and month(read_time) = '"+dmonth+"' and day(read_time) = '"+ddate+"' group by year(read_time),month(read_time),day(read_time),hour(read_time) order by year(read_time),month(read_time),day(read_time),hour(read_time)"
    
    
     con.query("SELECT count(readings_id) as number,sum(wf_out) as wf_sum,sum(steam) as st_sum,year(read_time) as year_s,month(read_time)as month_s,day(read_time) as day_s,hour(read_time) as hour_s FROM readings group by year(read_time),month(read_time),day(read_time),hour(read_time) order by year(read_time),month(read_time),day(read_time),hour(read_time)",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
           //console.log('Successful query\n');
           //console.log(rows);
           if(rows.length !== 0){
               for(var i=0;i<rows.length;i++){
                 var wf_avg = rows[i].wf_sum / rows[i].number;
                 var st_avg = rows[i].st_sum / rows[i].number;
                 var time_s = rows[i].hour_s+":00:00";
                 data_list.push({ time:time_s,pre:Math.round(wf_avg * 100) / 100,flow:Math.round(st_avg * 100) / 100});
                }
           }
           
           con.query("SELECT * FROM steam_cost",function(error,rows,fields){
                    if(!!error){
                        console.log('Error in the query '+error);
                    }
                    else{
                        //console.log('Successful query\n');
                        //console.log(rows);
                        steam_cost = parseFloat(rows[0].water_cost) + parseFloat(rows[0].fuel_cost) + parseFloat(rows[0].electric_cost) + parseFloat(rows[0].chemical_cost); 
                        //console.log(data_list);
                        con.query("SELECT * FROM boiler where id = '15'",function(error,rows,fields){
                                if(!!error){
                                    console.log('Error in the query '+error);
                                }
                                else{
                                    console.log(rows);
                                    res.render('index',{title:"Home",data:JSON.stringify(data_list),steam_cost:steam_cost,boiler:rows});
                                }
                            });
                        
                    }
                });
           //console.log(data_list);
           //res.render('index',{title:"Home",data:JSON.stringify(data_list)});
       }
   }); 
   
  //res.render('index', { title: 'Home' });
});

app.get('/demo', function(req, res, next) {
    
    var data_list = [];
    
     con.query("SELECT count(readings_id) as number,sum(wf_out) as wf_sum,sum(steam) as st_sum,year(read_time) as year_s,month(read_time)as month_s,day(read_time) as day_s,hour(read_time) as hour_s FROM readings group by year(read_time),month(read_time),day(read_time),hour(read_time) order by year(read_time),month(read_time),day(read_time),hour(read_time)",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
           //console.log('Successful query\n');
           //console.log(rows);
           if(rows.length !== 0){
               for(var i=0;i<rows.length;i++){
                 var wf_avg = rows[i].wf_sum / rows[i].number;
                 var st_avg = rows[i].st_sum / rows[i].number;
                 var time_s = rows[i].hour_s+":00:00";
                 data_list.push({ time:time_s,pre:Math.round(wf_avg * 100) / 100,flow:Math.round(st_avg * 100) / 100});
                }
           }
           //console.log(data_list);
           res.render('demo',{title:"demo",data:JSON.stringify(data_list)});
       }
   }); 
   
  //res.render('index', { title: 'Home' });
});

app.get('/graph_performance', function(req, res, next) {
  res.render('graph', { title: 'Performance' });
});

app.get('/boiler_list', function(req, res, next) {
    con.query("SELECT * FROM boiler",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
           //console.log('Successful query\n');
           //console.log(rows);
           res.render('boiler_list',{title:"Boiler List",data:rows});
       }
   }); 
 
});

app.get('/delete_data', function(req, res, next) {
    var count = 0;
    
    con.query("SELECT * from readings where boiler_id!='1' order by read_time desc",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
           //console.log('Successful query\n');
           //console.log(rows);
           //res.render('boiler_list',{title:"Boiler List",data:rows});
           
           for(var i=0;i<rows.length;i++){
               con.query("DELETE FROM readings where readings_id ='"+rows[i].readings_id+"'",function(error,rows,fields){
                    if(!!error){
                        console.log('Error in the query '+error);
                    }
                    else{
                        //console.log('Successful query\n');
                        //console.log(rows);
                        //res.render('boiler_list',{title:"Boiler List",data:rows});
                        console.log(count++);
                        next();
                    }
                });
                
           }
       }
   }); 
     
 
});

app.get('/add_boiler', function(req, res, next) {
  res.render('add_boiler', { title: 'Add Boiler' });
});

app.post('/boiler/add',function(req,res){
    
    upload(req,res,function(err) {
        //console.log("get select from body ="+req.body.dept_code);
        v_boiler_id = req.sanitize( 'boiler_id' ).escape(); 
        v_boiler_name = req.sanitize( 'boiler_name' ).escape(); 
        v_boiler_location = req.sanitize( 'boiler_location' ).escape();
        v_boiler_desc = req.sanitize( 'boiler_desc' ).escape();
        
        if(err) {
            return res.end("Error uploading file."+err);
        }
//        res.end("File is uploaded."+req.file.path);
        filepath = req.file.path;
        
        
        con.query("INSERT INTO boiler(boiler_name,boiler_location,boiler_desc,boiler_img,boiler_id) values ('"+v_boiler_name+"','"+v_boiler_location+"','"+v_boiler_desc+"','"+filepath+"','"+v_boiler_id+"')",function(error,rows,fields){
            if(error)
                {
                    var errors_detail  = ("Error Insert : %s ",error );   
                    req.flash('msg_error', errors_detail); 
                    res.render('add_boiler', 
                    { 
                        boiler_name: req.param('boiler_name'), 
                        boiler_location: req.param('boiler_location'),
                        boiler_desc: req.param('boiler_desc')
                    });
                }else{
                    
                    req.flash('msg_info', 'Add boiler success'); 
                    res.redirect('/boiler_list');
                }     
      }); 
    });      
});

app.get('/boiler/update/:boiler_id',function(req,res){
    var boiler_id = req.params.boiler_id;
   
   
   con.query("SELECT * FROM boiler WHERE id = ?",[boiler_id],function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
           //console.log('Successful query\n');
           //console.log(rows);
           res.render('edit_boiler',{title:"Edit Boiler",data:rows});
       }
   }); 
});

app.post('/boiler/update/:boiler_id',function(req,res){
    var boiler_id = req.params.boiler_id;
    upload(req,res,function(err) {
        //console.log("get select from body ="+req.body.dept_code);
        v_boiler_company = req.sanitize( 'boiler_company' ).escape(); 
        v_boiler_serial_no = req.sanitize( 'boiler_serial_no' ).escape();
        v_boiler_brand = req.sanitize( 'boiler_brand' ).escape();
        v_boiler_pressure = req.sanitize( 'boiler_pressure' ).escape(); 
        v_boiler_model = req.sanitize( 'boiler_model' ).escape();
        v_boiler_eff = req.sanitize( 'boiler_eff' ).escape();
        
        if(err) {
            return res.end("Error uploading file."+err);
        }
//        res.end("File is uploaded."+req.file.path);
        
        
        con.query("UPDATE boiler set boiler_company = '"+v_boiler_company+"', boiler_serial_no = '"+v_boiler_serial_no+"', boiler_brand = '"+v_boiler_brand+"', boiler_pressure = '"+v_boiler_pressure+"', boiler_model = '"+v_boiler_model+"', boiler_eff = '"+v_boiler_eff+"' where id = '"+boiler_id+"'",function(error,rows,fields){
            if(error)
                {
                    var errors_detail  = ("Error Insert : %s ",error );   
                    
                }else{
                    
                    req.flash('msg_info', 'Update boiler success'); 
                    res.redirect('/boiler_list');
                }    
      }); 
    });      
});

app.get('/boiler/delete/:boiler_id',function(req,res){
    var boiler_id = req.params.boiler_id;
   con.query("DELETE FROM boiler WHERE id = '"+boiler_id+"'",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
           //console.log('Successful query\n');
           //console.log(rows);

           req.flash('msg_info', 'Delete boiler success'); 
           res.redirect('/boiler_list');
       }
   }); 
});

app.get('/boiler_detail', function(req, res, next) {
    con.query("SELECT * FROM readings left join boiler on boiler.boiler_id = readings.boiler_id order by read_time desc",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
           //console.log('Successful query\n');
           //console.log(rows);
           res.render('boiler_details',{title:"Boiler Details",data:rows});
       }
   }); 
 
});

app.get('/report', function(req, res, next) {
    
    var data_list = [];
    
     con.query("SELECT count(readings_id) as number,sum(wf_out) as wf_sum,sum(steam) as st_sum,year(read_time) as year_s,month(read_time)as month_s,day(read_time) as day_s,hour(read_time) as hour_s FROM readings group by year(read_time),month(read_time),day(read_time),hour(read_time) order by year(read_time),month(read_time),day(read_time),hour(read_time)",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
           //console.log('Successful query\n');
           //console.log(rows);
           if(rows.length !== 0){
               for(var i=0;i<rows.length;i++){
                 var wf_avg = rows[i].wf_sum / rows[i].number;
                 var st_avg = rows[i].st_sum / rows[i].number;
                 var time_s = rows[i].hour_s+":00:00";
                 data_list.push({ time:time_s,pre:Math.round(wf_avg * 100) / 100,flow:Math.round(st_avg * 100) / 100});
                }
           }
           //console.log(data_list);
           res.render('report',{title:"Report",data:JSON.stringify(data_list)});
       }
   }); 
   
});

app.get('/error_detail', function(req, res, next) {
    con.query("SELECT * FROM error left join boiler on boiler.boiler_id = error.boiler_id order by error_time desc",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
           //console.log('Successful query\n');
           //console.log(rows);
           res.render('error_details',{title:"Error Details",data:rows});
       }
   }); 
 
});

app.get('/steam_cost', function(req, res, next) {
  res.render('add_steam_cost', { title: 'Add Steam Cost' });
});

app.post('/steam_cost/add',function(req,res){
    
    //upload(req,res,function(err) {
        //console.log("get select from body ="+req.body.dept_code);
        v_water_cost = req.sanitize( 'water_cost' ); 
        v_fuel_cost = req.sanitize( 'fuel_cost' );
        v_electric_cost = req.sanitize( 'electric_cost' ); 
        v_chemical_cost = req.sanitize( 'chemical_cost' ); 
        
        console.log("v_water_cost=="+v_water_cost);
        console.log("v_fuel_cost=="+v_fuel_cost);
        
        
//        if(err) {
//            return res.end("Error uploading file."+err);
//        }
//        res.end("File is uploaded."+req.file.path);
        
        
        con.query("UPDATE steam_cost set water_cost = '"+v_water_cost+"', fuel_cost = '"+v_fuel_cost+"', electric_cost = '"+v_electric_cost+"', chemical_cost = '"+v_chemical_cost+"' where cost_id = '1'",function(error,rows,fields){
            if(error)
                {
                    console.log("Error Insert : %s ",error );   
                    
                }else{
                    
                    req.flash('msg_info', 'Add steam cost success'); 
                    res.redirect('/');
                }     
      }); 
    //});      
});

app.get('/change_ent',function(req,res){
    
    //upload(req,res,function(err) {
        //console.log("get select from body ="+req.body.dept_code);
        
//        if(err) {
//            return res.end("Error uploading file."+err);
//        }
//        res.end("File is uploaded."+req.file.path);
        var readings;
        var count = 0;
       
        
        for(var k=0;k<1;k++){
        con.query("SELECT * FROM readings where day(read_time) = '3' and month(read_time)='8' and year(read_time)='2018' and steam_ent='undefined' limit 1",function(error,rows,fields){
            if(error)
                {
                    console.log("Error Insert : %s ",error );   
                    
                }else{
                    readings = rows;
                    
                    for(var i=0;i<readings.length;i++){
                        var reading_id = readings[i].readings_id;
                        console.log("SELECT * FROM compose.entalphy where pressure_bar >= "+parseFloat(readings[i].wf_out)+" order by entalphy_id limit 1");
                        con.query("SELECT * FROM compose.entalphy where pressure_bar >= "+parseFloat(readings[i].wf_out)+" order by entalphy_id limit 1",function(error,rows,fields){
                                if(error)
                                    {
                                        console.log("Error Insert : %s ",error );   

                                    }else{
                                        
                                        console.log("UPDATE readings set steam_ent = '"+rows[0].steam_kcal+"' where readings_id = '"+reading_id+"'");
                                        con.query("UPDATE readings set steam_ent = '"+rows[0].steam_kcal+"' where readings_id = '"+reading_id+"'",function(error,rows,fields){
                                                if(error)
                                                    {
                                                        console.log("Error Insert : %s ",error );   

                                                    }else{
                                                        console.log(count++);
                                                    }     
                                          });
                                    }     
                          });
                    }
                }     
      }); 
  
  }
    //});      
});

app.get('/update_steam', function(req, res, next) {
    
    var steam = 0;
    var steam_new = 0;
    var readings_id;
    var count = 0;
    
     con.query("SELECT * from readings",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
           for(var i=0;i<rows.length;i++){
               steam = rows[i].steam;
               steam_new = parseFloat(steam) / 2.1112;
               readings_id = rows[i].readings_id;
               
               con.query("UPDATE readings set steam_new = '"+steam_new+"' where readings_id = '"+readings_id+"'",function(error,rows,fields){
                        if(!!error){
                            console.log('Error in the query '+error);
                        }
                        else{
                            console.log(count++);
                        }
                    }); 
           }
       }
   }); 
   
  //res.render('index', { title: 'Home' });
});


//--------------------------REST API v1--------------------------------

app.get('/api/v1/test',function(req,res){
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);

//    var requestData = {
//            payload:{boiler_id:"3",value_name:"steam_flow",interval:"10",begin_date:"2019-01-01",end_date:"2019-01-01"}
//          };
          
     var requestData = {
            payload:{boiler_id:"3",data:[{boiler_id:"3",value_name:"stack_temperature",multiplier:"100",offset:"0"},{boiler_id:"3",value_name:"electric_power",multiplier:"100",offset:"0"}]}
          };
          
    request({
            url: "http://localhost:3000/api/v2/update_calibration_data",
            method: "POST",
            json: true,   // <--Very important!!!
            body:requestData
        }, function (error, response, body) {
    if (!error && response.statusCode === 200) {
        console.log(body);
//        var json_string = JSON.parse(body);
        res.status(200).send(body);
     }
     else{
         console.log("error="+error);
     }
    });
});

app.post('/api/v1/login',function(req,res){
    
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    
     var body = req.body;
     //console.log("request="+JSON.stringify(linen_list.payload.tag));
     var username = body.payload.username;
     var password = body.payload.password;
     

        //console.log("SELECT sum(soil) as soil, sum(clean) as clean,linen_category,year(time) as year_s,month(time) as month_s,day(time) as day_s FROM linen_record where month(time) = '"+dmonth+"' and year(time) = '"+dyear+"' left join linen on linen_record.id_linen = linen.linen_uuid group by year(linen_record.time),month(linen_record.time),day(linen_record.time),linen.linen_category");
        con.query("SELECT * FROM users where username = '"+username+"' and password = '"+password+"'",function(error,rows,fields){
            if(!!error){
                console.log('Error in the query '+error);
            }
            else{
                if(rows.length !== 0){
                    var result = {result:"1",action:"login",data:rows};
                    res.status(200).send(result);
                }
                else{
                    var result = {result:"0",action:"login",data:"",message:"Username or password is incorrect"};
                    res.status(200).send(result);
                }
            }
        });

});

app.get('/api/v1/geterrorbydate/:date',function(req,res){
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    
    var date = req.params.date;
    
   con.query("SELECT * FROM error where date(error_time) = '"+date+"' order by error_id desc",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
           //console.log('Successful query\n');
           //console.log(rows);
            var result = {result:"1",action:"geterrorbydate",data:rows};
            res.status(200).send(result);
       }
   }); 
});

app.get('/api/v1/getlatesterror/:limit',function(req,res){
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    
    var limit = req.params.limit;
    
   con.query("SELECT * FROM error order by error_time desc limit "+limit+"",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
           //console.log('Successful query\n');
           //console.log(rows);
            var result = {result:"1",action:"getlatesterror",data:rows};
            res.status(200).send(result);
       }
   }); 
});

app.get('/api/v1/getreadingsbydate/:date',function(req,res){
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    
    var date = req.params.date;
    
   con.query("SELECT * FROM readings where date(read_time) = '"+date+"' order by readings_id desc",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
           //console.log('Successful query\n');
           //console.log(rows);
            var result = {result:"1",action:"getreadingsbydate",data:rows};
            res.status(200).send(result);
       }
   }); 
});

app.get('/api/v1/getlatestreadings/:limit',function(req,res){
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    
    var limit = req.params.limit;
    
   con.query("SELECT * FROM readings order by readings_id desc limit "+limit+"",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
           //console.log('Successful query\n');
           //console.log(rows);
            var result = {result:"1",action:"getlatestreadings",data:rows};
            res.status(200).send(result);
       }
   }); 
});

app.get('/api/v1/getboilerlist',function(req,res){
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    
   con.query("SELECT * FROM boiler",function(error,rows,fields){
       if(!!error){
           console.log('Error in the query '+error);
       }
       else{
           //console.log('Successful query\n');
           //console.log(rows);
            var result = {result:"1",action:"getboilerlist",data:rows};
            res.status(200).send(result);
       }
   }); 
});

app.post('/api/v1/updateboiler',function(req,res){
    
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    
     var body = req.body;
     //console.log("request="+JSON.stringify(linen_list.payload.tag));
     var boiler_id = body.payload.boiler_id;
     var company = body.payload.company;
     var serial_no = body.payload.serial_no;
     var brand = body.payload.brand;
     var max_pressure = body.payload.max_pressure;
     var model = body.payload.model;
     var efficiency = body.payload.efficiency;
     

        //console.log("SELECT sum(soil) as soil, sum(clean) as clean,linen_category,year(time) as year_s,month(time) as month_s,day(time) as day_s FROM linen_record where month(time) = '"+dmonth+"' and year(time) = '"+dyear+"' left join linen on linen_record.id_linen = linen.linen_uuid group by year(linen_record.time),month(linen_record.time),day(linen_record.time),linen.linen_category");
        con.query("Update boiler set boiler_company = '"+company+"',boiler_serial_no = '"+serial_no+"',boiler_brand = '"+brand+"', boiler_pressure = '"+max_pressure+"', boiler_model = '"+model+"', boiler_eff = '"+efficiency+"' where id='"+boiler_id+"'",function(error,rows,fields){
            if(!!error){
                console.log('Error in the query '+error);
            }
            else{
                var result = {result:"1",action:"updateboiler",data:rows};
                res.status(200).send(result);
            }
        });

});

app.post('/api/v1/updatesteamcost',function(req,res){
    
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    
     var body = req.body;
     //console.log("request="+JSON.stringify(linen_list.payload.tag));
     var water_cost = body.payload.water_cost;
     var fuel_cost = body.payload.fuel_cost;
     var electric_cost = body.payload.electric_cost;
     var chemical_cost = body.payload.chemical_cost;
     

        //console.log("SELECT sum(soil) as soil, sum(clean) as clean,linen_category,year(time) as year_s,month(time) as month_s,day(time) as day_s FROM linen_record where month(time) = '"+dmonth+"' and year(time) = '"+dyear+"' left join linen on linen_record.id_linen = linen.linen_uuid group by year(linen_record.time),month(linen_record.time),day(linen_record.time),linen.linen_category");
        con.query("Update steam_cost set water_cost = '"+water_cost+"', fuel_cost = '"+fuel_cost+"', electric_cost = '"+electric_cost+"', chemical_cost = '"+chemical_cost+" where cost_id = '1'",function(error,rows,fields){
            if(!!error){
                console.log('Error in the query '+error);
            }
            else{
                var result = {result:"1",action:"updatesteamcost",data:rows};
                res.status(200).send(result);
            }
        });

});


//--------------------------REST API v2--------------------------------

app.post('/api/v2/login',function(req,res){
    
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    
     var body = req.body;
     //console.log("request="+JSON.stringify(linen_list.payload.tag));
     var username = body.payload.username;
     var password = body.payload.password;
     

        //console.log("SELECT sum(soil) as soil, sum(clean) as clean,linen_category,year(time) as year_s,month(time) as month_s,day(time) as day_s FROM linen_record where month(time) = '"+dmonth+"' and year(time) = '"+dyear+"' left join linen on linen_record.id_linen = linen.linen_uuid group by year(linen_record.time),month(linen_record.time),day(linen_record.time),linen.linen_category");
        con.query("SELECT * FROM users where username = '"+username+"' and password = '"+password+"'",function(error,rows,fields){
            if(!!error){
                console.log('Error in the query '+error);
            }
            else{
                if(rows.length !== 0){
                    var result = {result:"1",action:"login",data:rows};
                    res.status(200).send(result);
                }
                else{
                    var result = {result:"0",action:"login",data:"",message:"Username or password is incorrect"};
                    res.status(200).send(result);
                }
            }
        });

});

app.get('/api/v2/list_customer',function(req,res){
    
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);


        //console.log("SELECT sum(soil) as soil, sum(clean) as clean,linen_category,year(time) as year_s,month(time) as month_s,day(time) as day_s FROM linen_record where month(time) = '"+dmonth+"' and year(time) = '"+dyear+"' left join linen on linen_record.id_linen = linen.linen_uuid group by year(linen_record.time),month(linen_record.time),day(linen_record.time),linen.linen_category");
        con.query("SELECT * FROM customer",function(error,rows,fields){
            if(!!error){
                console.log('Error in the query '+error);
            }
            else{
                if(rows.length !== 0){
                    var result = {result:"1",action:"list_customer",data:rows};
                    res.status(200).send(result);
                }
                else{
                    var result = {result:"0",action:"list_customer",data:"",message:""};
                    res.status(200).send(result);
                }
            }
        });

});

app.get('/api/v2/dashboard_data',function(req,res){
    
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    
    var users_list,boiler_list;
    
        //console.log("SELECT sum(soil) as soil, sum(clean) as clean,linen_category,year(time) as year_s,month(time) as month_s,day(time) as day_s FROM linen_record where month(time) = '"+dmonth+"' and year(time) = '"+dyear+"' left join linen on linen_record.id_linen = linen.linen_uuid group by year(linen_record.time),month(linen_record.time),day(linen_record.time),linen.linen_category");
        con.query("SELECT user_id,username,name,company_name FROM users",function(error,rows,fields){
            if(!!error){
                console.log('Error in the query '+error);
            }
            else{
                
                users_list = rows;
                
                
            }
        });
        
           
        con.query("SELECT * FROM boiler",function(error,rows,fields){
            if(!!error){
                console.log('Error in the query '+error);
            }
            else{

             boiler_list = rows;
             
             if(rows.length !== 0){
                    var result = {result:"1",action:"dashboard_data",user_list:users_list,boiler_list:boiler_list};
                    res.status(200).send(result);
                }
                else{
                    var result = {result:"0",action:"dashboard_data",data:"",message:"Unexpected error"};
                    res.status(200).send(result);
                }

            }
        });
                

});

app.post('/api/v2/search_boiler',function(req,res){
    
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    
     var body = req.body;
     //console.log("request="+JSON.stringify(linen_list.payload.tag));
//     var keyword = body.payload.keyword;
     var keyword = body.payload.keyword;
     var customer_id = body.payload.customer_id;
     var boiler_type = body.payload.boiler_type;
     

        //console.log("SELECT sum(soil) as soil, sum(clean) as clean,linen_category,year(time) as year_s,month(time) as month_s,day(time) as day_s FROM linen_record where month(time) = '"+dmonth+"' and year(time) = '"+dyear+"' left join linen on linen_record.id_linen = linen.linen_uuid group by year(linen_record.time),month(linen_record.time),day(linen_record.time),linen.linen_category");
        con.query("SELECT * FROM boiler where boiler_owner = '"+customer_id+"' and boiler_type = '"+boiler_type+"'",function(error,rows,fields){
            if(!!error){
                console.log('Error in the query '+error);
            }
            else{
                if(rows.length !== 0){
                    var result = {result:"1",action:"search_boiler",data:rows};
                    res.status(200).send(result);
                }
                else{
                    var result = {result:"0",action:"search_boiler",data:"",message:"No results found"};
                    res.status(200).send(result);
                }
            }
        });

});

app.post('/api/v2/boiler_data',function(req,res){
    
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    
    var body = req.body;
    
    var boiler_id = body.payload.boiler_id;
     
    var boiler_data,value_range;
    
        //console.log("SELECT sum(soil) as soil, sum(clean) as clean,linen_category,year(time) as year_s,month(time) as month_s,day(time) as day_s FROM linen_record where month(time) = '"+dmonth+"' and year(time) = '"+dyear+"' left join linen on linen_record.id_linen = linen.linen_uuid group by year(linen_record.time),month(linen_record.time),day(linen_record.time),linen.linen_category");
        con.query("SELECT * from boiler where boiler_id = '"+boiler_id+"'",function(error,rows,fields){
            if(!!error){
                console.log('Error in the query '+error);
            }
            else{
                
                boiler_data = rows;
                
            }
        });
        
           
        con.query("SELECT * FROM value_range where boiler_id = '"+boiler_id+"'",function(error,rows,fields){
            if(!!error){
                console.log('Error in the query '+error);
            }
            else{

             value_range = rows;
             
             if(rows.length !== 0){
                    var result = {result:"1",action:"boiler_data",boiler_data:boiler_data,value_range:value_range};
                    res.status(200).send(result);
                }
                else{
                    var result = {result:"0",action:"boiler_data",data:"",message:"Unexpected error"};
                    res.status(200).send(result);
                }

            }
        });
                

});

app.post('/api/v2/history_data',function(req,res){
    
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    
     var body = req.body;
     //console.log("request="+JSON.stringify(linen_list.payload.tag));
     var boiler_id = body.payload.boiler_id;
     var value_name = body.payload.value_name;
     var interval = body.payload.interval;
     var begin_date = body.payload.begin_date;
     var end_date = body.payload.end_date;
     
//        console.log("SELECT reading_time as datetime,"+value_name+" as value FROM boiler_data where reading_time >= '"+begin_date+"' and reading_time <= '"+end_date+"' and boiler_id = '"+boiler_id+"'");
        con.query("SELECT reading_time as datetime,"+value_name+" as value FROM boiler_data where reading_time >= '"+begin_date+"' and reading_time <= '"+end_date+"' and boiler_id = '"+boiler_id+"'",function(error,rows,fields){
            if(!!error){
                console.log('Error in the query '+error);
            }
            else{
                if(rows.length !== 0){
                    var result = {result:"1",action:"history_data",value_name:value_name,data:rows};
                    res.status(200).send(result);
                }
                else{
                    var result = {result:"0",action:"history_data",data:""};
                    res.status(200).send(result);
                }
            }
        });

});

app.post('/api/v2/get_value_range',function(req,res){
    
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    
    var body = req.body;
    
    var boiler_id = body.payload.boiler_id;
     
    var boiler_data,value_range;
        
           
        con.query("SELECT * FROM value_range where boiler_id = '"+boiler_id+"'",function(error,rows,fields){
            if(!!error){
                console.log('Error in the query '+error);
            }
            else{

             value_range = rows;
             
             if(rows.length !== 0){
                    var result = {result:"1",action:"get_value_range",value_range:value_range};
                    res.status(200).send(result);
                }
                else{
                    var result = {result:"0",action:"get_value_range",data:"",message:"Unexpected error"};
                    res.status(200).send(result);
                }

            }
        });
                

});

app.post('/api/v2/update_value_range',function(req,res){
    
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    
    var body = req.body;
    
    var boiler_id = body.payload.boiler_id;
    var boiler_data = body.payload.data;
      
        
//        var result = {result:"1",action:"update_setting_data",message:""};
//        res.status(200).send(result);

        for(var i =0;i<boiler_data.length;i++){
            con.query("UPDATE value_range set critical_low = '"+boiler_data[i].critical_low+"', critical_high = '"+boiler_data[i].critical_high+"', warning_low = '"+boiler_data[i].warning_low+"', warning_high = '"+boiler_data[i].warning_high+"' where value_name = '"+boiler_data[i].value_name+"' and boiler_id = '"+boiler_id+"'",function(error,rows,fields){
                    if(!!error){
                        console.log('Error in the query '+error);
                    }
                    else{ 
                     
                    }
                });
        }
                    
       var result = {result:"1",action:"update_value_range",message:"Value range updated"};
       res.status(200).send(result);
//        con.query("SELECT * FROM value_range where boiler_id = '"+boiler_id+"'",function(error,rows,fields){
//            if(!!error){
//                console.log('Error in the query '+error);
//            }
//            else{
//
//             value_range = rows;
//             
//             if(rows.length !== 0){
//                    var result = {result:"1",action:"setting_data",value_range:value_range};
//                    res.status(200).send(result);
//                }
//                else{
//                    var result = {result:"0",action:"setting_data",data:"",message:"Unexpected error"};
//                    res.status(200).send(result);
//                }
//
//            }
//        });
                

});

app.post('/api/v2/get_general_setting',function(req,res){
    
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    
    var body = req.body;
    
    var boiler_id = body.payload.boiler_id;
     
    var value_range;
        
           
        con.query("SELECT * FROM steam_cost where boiler_id = '"+boiler_id+"'",function(error,rows,fields){
            if(!!error){
                console.log('Error in the query '+error);
            }
            else{

             value_range = rows;
             
             if(rows.length !== 0){
                    var result = {result:"1",action:"get_general_setting",general_setting:value_range};
                    res.status(200).send(result);
                }
                else{
                    var result = {result:"0",action:"get_general_setting",data:"",message:"Unexpected error"};
                    res.status(200).send(result);
                }

            }
        });
                

});

app.post('/api/v2/update_general_setting',function(req,res){
    
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    
    var body = req.body;
    
    var boiler_id = body.payload.boiler_id;
    var setting_data = body.payload.data;
     
                    
        con.query("UPDATE steam_cost set water_cost = '"+setting_data[0].water_cost+"',fuel_cost = '"+setting_data[0].fuel_cost+"',electric_cost='"+setting_data[0].electric_cost+"',steam_cost='"+setting_data[0].steam_cost+"',softener='"+setting_data[0].softener+"',ro='"+setting_data[0].ro+"',chemical = '"+setting_data[0].chemical+"' where boiler_id = '"+boiler_id+"'",function(error,rows,fields){
            if(!!error){
                console.log('Error in the query '+error);
            }
            else{
             
             if(rows.length !== 0){
                    var result = {result:"1",action:"update_general_setting"};
                    res.status(200).send(result);
                }
                else{
                    var result = {result:"0",action:"update_general_setting",message:"Unexpected error"};
                    res.status(200).send(result);
                }

            }
        });
                

});

app.post('/api/v2/daily_export',function(req,res){
    
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    
    var body = req.body;
    
    var boiler_id = body.payload.boiler_id;
     
    var boiler_data,value_range;
        
        var result = {result:"1",action:"daily_export",message:""};
        res.status(200).send(result);
                    
//        con.query("SELECT * FROM value_range where boiler_id = '"+boiler_id+"'",function(error,rows,fields){
//            if(!!error){
//                console.log('Error in the query '+error);
//            }
//            else{
//
//             value_range = rows;
//             
//             if(rows.length !== 0){
//                    var result = {result:"1",action:"setting_data",value_range:value_range};
//                    res.status(200).send(result);
//                }
//                else{
//                    var result = {result:"0",action:"setting_data",data:"",message:"Unexpected error"};
//                    res.status(200).send(result);
//                }
//
//            }
//        });
                

});

app.post('/api/v2/billing_export',function(req,res){
    
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    
    var body = req.body;
    
    var boiler_id = body.payload.boiler_id;
     
    var boiler_data,value_range;
        
        var result = {result:"1",action:"billing_export",message:""};
        res.status(200).send(result);
                    
//        con.query("SELECT * FROM value_range where boiler_id = '"+boiler_id+"'",function(error,rows,fields){
//            if(!!error){
//                console.log('Error in the query '+error);
//            }
//            else{
//
//             value_range = rows;
//             
//             if(rows.length !== 0){
//                    var result = {result:"1",action:"setting_data",value_range:value_range};
//                    res.status(200).send(result);
//                }
//                else{
//                    var result = {result:"0",action:"setting_data",data:"",message:"Unexpected error"};
//                    res.status(200).send(result);
//                }
//
//            }
//        });
                

});

app.post('/api/v2/data_export',function(req,res){
    
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    
    var body = req.body;
    
    var boiler_id = body.payload.boiler_id;
     
    var boiler_data,value_range;
        
        var result = {result:"1",action:"data_export",message:""};
        res.status(200).send(result);
                    
//        con.query("SELECT * FROM value_range where boiler_id = '"+boiler_id+"'",function(error,rows,fields){
//            if(!!error){
//                console.log('Error in the query '+error);
//            }
//            else{
//
//             value_range = rows;
//             
//             if(rows.length !== 0){
//                    var result = {result:"1",action:"setting_data",value_range:value_range};
//                    res.status(200).send(result);
//                }
//                else{
//                    var result = {result:"0",action:"setting_data",data:"",message:"Unexpected error"};
//                    res.status(200).send(result);
//                }
//
//            }
//        });
                

});

app.post('/api/v2/get_calibration_data',function(req,res){
    
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    
    var body = req.body;
    
    var boiler_id = body.payload.boiler_id;
     
    var boiler_data,value_range;
        
                    
        con.query("SELECT * FROM calibration where boiler_id = '"+boiler_id+"'",function(error,rows,fields){
            if(!!error){
                console.log('Error in the query '+error);
            }
            else{

             value_range = rows;
             
             if(rows.length !== 0){
                var result = {result:"1",action:"get_calibration_data",value_range:value_range};
                res.status(200).send(result);
            }
            else{
                var result = {result:"0",action:"get_calibration_data",data:"",message:"Unexpected error"};
                res.status(200).send(result);
            }
             
             

            }
        });
                

});

app.post('/api/v2/update_calibration_data',function(req,res){
    
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    
    var body = req.body;
    
    var boiler_id = body.payload.boiler_id;
    var boiler_data = body.payload.data;

                    
        for(var i =0;i<boiler_data.length;i++){
            con.query("UPDATE calibration set multiplier = '"+boiler_data[i].multiplier+"', offset = '"+boiler_data[i].offset+"' where value_name = '"+boiler_data[i].value_name+"' and boiler_id = '"+boiler_id+"'",function(error,rows,fields){
                    if(!!error){
                        console.log('Error in the query '+error);
                    }
                    else{ 
                     
                    }
                });
        }
                    
       var result = {result:"1",action:"update_calibration_data",message:"Calibration data updated"};
       res.status(200).send(result);
                

});

function createDateAsUTC(date) {
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()));
}


//--------------------IOT PLATFORM---------------------------

var appClientConfig = {
    "org": '4bnyyk',
    "id": Date.now()+"",
    "auth-key": 'a-4bnyyk-lexydedfxo',
    "auth-token": 'ApQCJ*Pg@Gs@A1ChaS',
    "type" : "shared" // make this connection as shared subscription
  };
  var appClient = new Client.IotfApplication(appClientConfig);

  appClient.connect();

  appClient.on("connect", function () {

      appClient.subscribeToDeviceEvents();
  });

  appClient.on("error", function (err) {
      console.log("Error : "+err);
  });


appClient.on("deviceEvent", function (deviceType, deviceId, eventType, format, payload) {
    
    //console.log("outside---"+payload);
//    if(eventType === "reader"){
//        var json_string = JSON.parse(payload);
//        console.log("json stirng="+JSON.stringify(json_string));
//    }
    
     if(eventType === "status1" && deviceId === 'boiler4'){
         //console.log("json_string---"+payload);
    var json_string = JSON.parse(payload);
    var json_value = json_string.d.c.split(',');
    var counter = json_value[0];
    var boiler_id = json_value[1];
    var steam_flow = json_value[2];
    var steam_pulse = json_value[3];
    var steam_pressure = json_value[4];
    var fw_flow = json_value[5];
    var fw_pulse = json_value[6];
    var fw_temp = json_value[7];
    var fw_pressure = json_value[8];
    var fuel_flow = json_value[9];
    var fuel_pulse = json_value[10];
    //console.log("boilerd---"+boiler_id);
    //var steam_ent;
    //var steam_new = parseFloat(steam) / 2.1112;
    //var read_time = createDateAsUTC(new Date());
    
    var d = new Date();
    d.setMinutes(d.getMinutes()+420);
    var ddate = d.getDate();
    var dmonth = d.getMonth()+1;
    var dyear = d.getFullYear();
    var dhour = d.getHours();
    var dminutes = d.getMinutes();
    var dseconds = d.getSeconds();
    var read_time = dyear+"-"+dmonth+"-"+ddate+" "+dhour+":"+dminutes+":"+dseconds;
    //console.log("json stirng="+JSON.stringify(json_string));
    
//    con.query('SELECT * FROM compose.entalphy where pressure_bar >= '+parseFloat(wf_out)+' order by entalphy_id limit 1',function(err,rows){
//         if(!!err){
//                    console.log('Error in the query '+err);
//                }
//                else{
//                    if(rows.length === 0){
//                        steam_ent = '0';
//                    }
//                    else{
//                        steam_ent = rows[0].steam_kcal;
//                    }
//                   //console.log(count++);
//                    //console.log('Successful query fff\n');
//                    //console.log(rows);
//                    //res.render('report_linen_print',{title:"Report",data:rows});
//                   
//                }
//         });
    
    con.query('INSERT into boiler_data(boiler_id,counter,reading_time,steam_flow,steam_pulse,steam_pressure,feed_water_flow,feed_water_pulse,feed_water_temp,feed_water_pressure,fuel_flow,fuel_pulse) values ("'+boiler_id+'","'+counter+'","'+read_time+'","'+steam_flow+'","'+steam_pulse+'","'+steam_pressure+'","'+fw_flow+'","'+fw_pulse+'","'+fw_temp+'","'+fw_pressure+'","'+fuel_flow+'","'+fuel_pulse+'")',function(err,rows){
         if(!!err){
                    console.log('Error in the query '+err);
                }
                else{
                   //console.log(count++);
                    //console.log('Successful query fff\n');
                    //console.log(rows);
                    //res.render('report_linen_print',{title:"Report",data:rows});
                   
                }
         });
         
    }
    
    else if(eventType === "status2" && deviceId === 'boiler4'){
        //console.log("json_string2---"+payload);
    var json_string = JSON.parse(payload);
    //console.log("json_string2---"+json_string);
    var json_value = json_string.d.c.split(',');
    var counter = json_value[0];
    var boiler_id = json_value[1];
    var fuel_pressure = json_value[2];
    var fuel_temp = json_value[3];
    var gas_flow_temp = json_value[4];
    var blowdown_counting = json_value[5];
    var feed_water_ph = json_value[6];
    var feed_water_hard = json_value[7];
    var gas_sensor = json_value[8];
    var blowdown_ph = json_value[9];
    var blowdown_hardness = json_value[10];
    //var steam_ent;
    //var steam_new = parseFloat(steam) / 2.1112;
    //var read_time = createDateAsUTC(new Date());
    
    con.query('SELECT * FROM boiler_data where  boiler_id = "'+boiler_id+'" and counter = "'+counter+'" and fuel_pressure IS NULL order by data_id desc limit 1',function(err,rows){
         if(!!err){
                    console.log('Error in the query '+err);
                }
                else{
                    if(rows.length === 0){
                        //steam_ent = '0';
                    }
                    else{
                        
                        var data_id = rows[0].data_id;
                        con.query('UPDATE boiler_data set fuel_pressure="'+fuel_pressure+'",fuel_temp="'+fuel_temp+'",gas_flow_temp="'+gas_flow_temp+'",blowdown_counting_time="'+blowdown_counting+'",feed_water_ph="'+feed_water_ph+'",feed_water_hardness="'+feed_water_hard+'",gas_sensor="'+gas_sensor+'",blowdown_ph="'+blowdown_ph+'",blowdown_hardness="'+blowdown_hardness+'" where data_id = "'+data_id+'"',function(err,rows){
                                if(!!err){
                                           console.log('Error in the query '+err);
                                       }
                                       else{
                                          //console.log(count++);
                                           //console.log('Successful query fff\n');
                                           //console.log(rows);
                                           //res.render('report_linen_print',{title:"Report",data:rows});

                                       }
                                });

                           //}
                    }
                   //console.log(count++);
                    //console.log('Successful query fff\n');
                    //console.log(rows);
                    //res.render('report_linen_print',{title:"Report",data:rows});
                   
                }
         });
    
    
    }
    
    
    
//    if(eventType === "status" && deviceType === 'boiler'){
//    var json_string = JSON.parse(payload);
//    var boiler_id = json_string.d.bid;
//    var lpg = json_string.d.lpg;
//    var steam = json_string.d.st;
//    var wf_out = json_string.d.wo;
//    var wf_in = json_string.d.wi;
//    var temp1 = json_string.d.t1;
//    var temp2 = json_string.d.t2;
//    var steam_ent;
//    var steam_new = parseFloat(steam) / 2.1112;
//    //var read_time = createDateAsUTC(new Date());
//    
//    var d = new Date();
//    d.setMinutes(d.getMinutes()+420);
//    var ddate = d.getDate();
//    var dmonth = d.getMonth()+1;
//    var dyear = d.getFullYear();
//    var dhour = d.getHours();
//    var dminutes = d.getMinutes();
//    var dseconds = d.getSeconds();
//    var read_time = dyear+"-"+dmonth+"-"+ddate+" "+dhour+":"+dminutes+":"+dseconds;
//    //console.log("json stirng="+JSON.stringify(json_string));
//    
//    con.query('SELECT * FROM compose.entalphy where pressure_bar >= '+parseFloat(wf_out)+' order by entalphy_id limit 1',function(err,rows){
//         if(!!err){
//                    console.log('Error in the query '+err);
//                }
//                else{
//                    if(rows.length === 0){
//                        steam_ent = '0';
//                    }
//                    else{
//                        steam_ent = rows[0].steam_kcal;
//                    }
//                   //console.log(count++);
//                    //console.log('Successful query fff\n');
//                    //console.log(rows);
//                    //res.render('report_linen_print',{title:"Report",data:rows});
//                   
//                }
//         });
//    
//    con.query('INSERT into readings(boiler_id,read_time,lpg,steam,wf_in,wf_out,temp1,temp2,steam_ent,steam_new) values ("'+boiler_id+'","'+read_time+'","'+lpg+'","'+steam+'","'+wf_in+'","'+wf_out+'","'+temp1+'","'+temp2+'","'+steam_ent+'","'+steam_new+'")',function(err,rows){
//         if(!!err){
//                    console.log('Error in the query '+err);
//                }
//                else{
//                   //console.log(count++);
//                    //console.log('Successful query fff\n');
//                    //console.log(rows);
//                    //res.render('report_linen_print',{title:"Report",data:rows});
//                   
//                }
//         });
//         
//    }
//    
//    if(eventType === "error"){
//        var json_string = JSON.parse(payload);
//        var boiler_id = json_string.d.bid;
//        var err = json_string.d.error.toString();
//        var error1 = err.charAt(0);
//        var error2 = err.charAt(1);
//        var condition = err.charAt(2);
//        var err_1,err_2,cond;
//        //var read_time = createDateAsUTC(new Date());
//        if(error1 === '0'){
//            err_1 = 'Feed water halt';
//        }
//        else if(error1 === '1'){
//            err_1 = 'Feed water';
//        }
//        else if(error1 === '2'){
//            err_1 = 'Lower water level';
//        }
//        else if(error1 === '3'){
//            err_1 = 'Water level controller is abnormal';
//        }
//        else if(error1 === '4'){
//            err_1 = 'Feed water insufficient';
//        }
//        else if(error1 === '5'){
//            err_1 = 'Idle combustion';
//        }
//        else if(error1 === '6'){
//            err_1 = 'Pump is abnormal';
//        }
//        
//        if(error2 === '0'){
//            err_2 = 'Combustion cease';
//        }
//        else if(error2 === '1'){
//            err_2 = 'Draft';
//        }
//        else if(error2 === '2'){
//            err_2 = 'Ignition';
//        }
//        else if(error2 === '3'){
//            err_2 = 'Low combustion';
//        }
//        else if(error2 === '4'){
//            err_2 = 'High combustion';
//        }
//        else if(error2 === '5'){
//            err_2 = 'Misfiring';
//        }
//        else if(error2 === '6'){
//            err_2 = 'Gas pressure is abnormal';
//        }
//        else if(error2 === '7'){
//            err_2 = 'Air pressure is abnormal';
//        }
//        
//        if(condition === '0'){
//            cond = 'Combustion and ignition is NOT OK';
//        }
//        else if(condition === '1'){
//            cond = 'Combustion and ignition is OK';
//        }
//
//        var d = new Date();
//        d.setMinutes(d.getMinutes()+420);
//        var ddate = d.getDate();
//        var dmonth = d.getMonth()+1;
//        var dyear = d.getFullYear();
//        var dhour = d.getHours();
//        var dminutes = d.getMinutes();
//        var dseconds = d.getSeconds();
//        var read_time = dyear+"-"+dmonth+"-"+ddate+" "+dhour+":"+dminutes+":"+dseconds;
//        //console.log("json stirng error="+JSON.stringify(json_string));
//
//        con.query('INSERT into error(boiler_id,error_time,error_1,error_2,cond,err_num_1,err_num_2) values ("'+boiler_id+'","'+read_time+'","'+err_1+'","'+err_2+'","'+cond+'","'+error1+'","'+error2+'")',function(err,rows){
//             if(!!err){
//                        console.log('Error in the query '+err);
//                    }
//                    else{
//                       //console.log(count++);
//                        //console.log('Successful query fff\n');
//                        //console.log(rows);
//                        //res.render('report_linen_print',{title:"Report",data:rows});
//
//                    }
//             });
//
//        }
     

});

io.on('connection', function (socket) {
//    console.log('a client connected');
//    var d = new Date();
//    //d.setMinutes(d.getMinutes()+420);
//    var ddate = d.getDate();
//    var dmonth = d.getMonth()+1;
//    var dyear = d.getFullYear();
//    
//    con.query("SELECT * from readings where boiler_id='1' order by read_time desc limit 1",function(err,rows){
//         if(err) throw err;
//         console.log(rows);
//         socket.emit('boiler1', rows);
//       });
//       
//    setInterval(function(){ 
//        //console.log('a client connected');
//       con.query("SELECT * from readings where boiler_id='1' order by read_time desc limit 1",function(err,rows){
//         if(err) throw err;
//
//         socket.emit('boiler1', rows);
//       });
//       }, 5000);


        con.query("SELECT * FROM readings where day(read_time) = '18' and month(read_time)='5' and year(read_time)='2018'",function(err,rows){
         if(err) throw err;
         console.log("kk connecyed");
            var data = rows;
            socket.emit('demo', rows);
//            for(var i=0;i<data.length;i++){
//                //console.log(data[0]);
//                //console.log(data);
//                socket.emit('boiler1', data);
//           }
       });
       

 });
 
io.on('connection', function (socket) {
    //console.log('a client connected');
    var d = new Date();
    d.setMinutes(d.getMinutes()+420);
    var ddate = d.getDate();
    var dmonth = d.getMonth()+1;
    var dyear = d.getFullYear();
    
    con.query("SELECT * from readings where boiler_id='1' order by read_time desc limit 1",function(err,rows){
         if(err) throw err;
         //console.log(rows);
         socket.emit('boiler1', rows);
       });
       
    setInterval(function(){ 
        //console.log('a client connected');
       con.query("SELECT * from readings where boiler_id='1' order by read_time desc limit 1",function(err,rows){
         if(err) throw err;

         socket.emit('boiler1', rows);
       });
       }, 5000);


 });
 
io.on('connection', function (socket) {
    //console.log('a client connected');
    var d = new Date();
    d.setMinutes(d.getMinutes()+420);
//    var ddate = d.getDate();
//    var dmonth = d.getMonth()+1;
//    var dyear = d.getFullYear();
    var ddate = '3';
    var dmonth = '8';
    var dyear = '2018';
    
    con.query("SELECT avg(lpg) as avg_lpg, avg(steam) as avg_steam, avg(temp1) as avg_temp, avg(temp2) as avg_temp2, avg(steam_ent) as avg_steam_ent from readings where boiler_id='1' and year(read_time) = '"+dyear+"' and month(read_time) = '"+dmonth+"' and day(read_time) = '"+ddate+"' and lpg != '0'",function(err,rows){
         if(err) throw err;
         //console.log(rows);
         socket.emit('effeciency', rows);
       });
       
    setInterval(function(){ 
        //console.log('a client connected');
       con.query("SELECT avg(lpg) as avg_lpg, avg(steam) as avg_steam, avg(temp1) as avg_temp, avg(temp2) as avg_temp2, avg(steam_ent) as avg_steam_ent from readings where boiler_id='1' and year(read_time) = '"+dyear+"' and month(read_time) = '"+dmonth+"' and day(read_time) = '"+ddate+"' and lpg != '0'",function(err,rows){
         if(err) throw err;
         //console.log(rows);
         socket.emit('effeciency', rows);
       });
       }, 300000);


 });
 
io.on('connection', function (socket) {
    //console.log('a client connected');
    
    con.query("SELECT * FROM error order by error_id desc limit 5",function(err,rows){
         if(err) throw err;
         //console.log(rows);
         socket.emit('notification', rows);
       });
       
    setInterval(function(){ 
        //console.log('a client connected');
       con.query("SELECT * FROM error order by error_id desc limit 5",function(err,rows){
         if(err) throw err;
         //console.log(rows);
         socket.emit('notification', rows);
       });
       }, 30000);


 });
 
// io.on('connection', function (socket) {
////    console.log('a client connected');
//    var d = new Date();
//    d.setMinutes(d.getMinutes()+420);
//    var ddate = d.getDate();
//    var dmonth = d.getMonth()+1;
//    var dyear = d.getFullYear();
//    var dhour = d.getHours();
//    var dminutes = d.getMinutes();
//    var dseconds = d.getSeconds();
//    var read_time = dyear+"-"+dmonth+"-"+ddate+" "+dhour+":"+dminutes+":"+dseconds;
//    
//    //console.log("SELECT * from error where boiler_id='1' and error_time > DATE_SUB('"+read_time+"',INTERVAL 1 MINUTE) order by error_time desc limit 1");
//    con.query("SELECT * from error where boiler_id='1' and error_time > DATE_SUB('"+read_time+"',INTERVAL 1 MINUTE) order by error_time desc limit 1",function(err,rows){
//         if(err) throw err;
//
//         socket.emit('error1', rows);
//       });
//       
//    setInterval(function(){ 
//       con.query("SELECT * from error where boiler_id='1' and error_time > DATE_SUB('"+read_time+"',INTERVAL 1 MINUTE) order by error_time desc limit 1",function(err,rows){
//         if(err) throw err;
//         console.log('b client connected');
//         socket.emit('error1', rows);
//       });
//       }, 1000);
//
// });
 

passport.use('local_qchat', new LocalStrategy({

  usernameField: 'username',

  passwordField: 'password',

  passReqToCallback: true //passback entire req to call back
} , function (req, username, password, done){

      
      if(!username || !password ) { return done(null, false, req.flash('message','All fields are required.')); }

      var salt = '7fa73b47df808d36c5fe328546ddef8b9011b2c6';

      con.query("select * from employee where employee_email = '"+username+"'", function(err, rows){

          //console.log("err=="+err); 
          //console.log("rroows=="+JSON.stringify(rows));

        if (err) return done(req.flash('message',err));

        if(!rows.length){ return done(null, false, req.flash('message','Invalid username or password.')); }
        
//        salt = salt+''+password;
//
//        var encPassword = crypto.createHash('sha1').update(salt).digest('hex');
        
        var encPassword = password;
        var dbPassword  = rows[0].employee_password;
        
        if(!(dbPassword === encPassword)){
            
            return done(null, false, req.flash('message','Invalid username or password.'));

         }
        // console.log("rowwww = "+JSON.stringify(rows[0]));
        return done(null, rows[0]);

      });

    }

));

passport.serializeUser(function(user, done){
        
//    console.log("rowwwwss = "+JSON.stringify(user));
    done(null, user);

});

passport.deserializeUser(function(user, done){
    
    done(null, user);
    
});



function isAuthenticated(req, res, next) {
   
  if (req.isAuthenticated())

    return next();

  res.redirect('/login');

}
 
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


//http.listen(3000, function(){
//  console.log('listening on *:3000');
//});
//app.listen(1337);

//module.exports = app;
module.exports = {app: app, server: http};
