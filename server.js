var express = require('express'),
    path = require('path'),
    http = require('http');

var mongo = require('mongodb'),
    Server = mongo.Server,
    Db = mongo.Db;

var ipAddress = process.argv[2];

var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/OFF');

var UserSchema = mongoose.Schema({
	first_name: String,
	last_name:  String,
	screen_name: String,
	email: String,
	password: String });

var User = mongoose.model('User', UserSchema, 'users');

var theDb = mongoose.connection;
theDb.on('error', console.error.bind(console, 'connection error:'));
theDb.once('open', function callback () {
  console.log('yey');
  console.log(theDb.collections);
});

var serverdb = new Server('localhost',{auto_reconnect: true});

var db = new Db('OFF', serverdb, {safe: false});

db.open(function(err, db){
   if(!err)
   {
    console.log("Connected to the DB");
   }
   else
    console.log(err);
});

users = db.collection('users');

var app = express();

var chatSession = {
	text: "",
	status: -1 };

var peeps = 0;

app.configure(function(){
	app.set('port', process.env.PORT || 80);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.bodyParser());
	app.use(require('stylus').middleware(__dirname + '/public'));
	app.use(express.static(path.join(__dirname, 'public')));
});

app.get('/', function(request, response){
		response.redirect('/signin');
});

app.get('/signin', function(request, response){
		response.render('signinOrUp', 202);	
});

app.post('/member', function(request, response){
                console.log(request.body);
                console.log(request.body.userEmail);
                User.find({email: request.body.userEmail}, function(err, docs){
                              					 if( docs[0] === undefined )
						 		   response.send({success:0});
								 if(docs[0].password === request.body.pwd && docs[0] !== undefined)
								 { 
 								   console.log(docs[0].screen_name);
								   response.send(docs[0].screen_name);
								   response.send({success:1});
								 }
								 else
								 { 
								   response.send({success:0}); 
								 } 
		});
                
});

app.post('/newusr', function(request, response){
                //console.log("BODY \n");
		//console.log(request.body);
	     	//console.log("\n");
                var body = request.body;
	        addUser(body.firstname, body.lastname, body.e_mail, body.screenName, body.pass, request.ip);
                response.redirect('/home');
});	

var files = new Object();

app.post('/storeFile', function(request, response){
        console.log(request.body);
        if( request.body.check !== 'undefined' )
        {
           var fileName = request.body.fileName;
           var fileURL = request.body.url;
 
           files[fileName] = { url: fileURL };

           console.log(files[fileName]);

	   response.send(getFileNamesAsString());
        }
        else
           response.send(getFileNamesAsString());
        
});

app.post('/getFile', function(request, response){
        console.log(request.body);
        console.log(files[request.body.fileName].url);
        response.send(files[request.body.fileName].url);
});

function getFileNamesAsString(){
        
        var retval = "";

        for( var name in files )
        {
          if( name !== 'undefined' )
          {
            if( retval === "" && typeof(files[name]) === 'object' )
               retval = name;

            else if( retval !== "" && typeof(files[name]) === 'object' )
               retval = retval + '\n' + name;
          }
        }

        return retval;
}

app.get('/home', function(request, response){		
		response.render('home');
		console.log("page visited by : " + request.ip);
});			   

app.post('/updateMsg', function(request, response){
		//console.log(request.body);
		//console.log("IP: "+request.ip);
                if( request.body !== null )
		{
                  if( request.body.check == 0 )
		  {
                      chat(request.body.screen_name, request.body.text, request.ip);
                  }
                  else
		    chatSession.status = 1;
		}
                //console.log(chatSession);
                response.send(chatSession.text);
});

app.post('/guestusr', function(request, response){
		response.send(++peeps);
});

app.get('/aboutus', function(request, response){
		response.render('aboutUs', 200);
});

function chat(name, text, ip){

        if( name === null || name === "" || name === 'Guest')
	   name = 'Guest ['+ ip + ']';

	if( chatSession.text === "" )
	   chatSession.text += '['+name+']' + ' : ' + text;

        else
           chatSession.text += '\n['+name+']' + ' : ' + text;
        chatSession.status = 0;
}

function addUser(fname, lname, email, screenName, pwd, ip){
        console.log("adding new user");
	var toAdd = new User({first_name: fname, last_name: lname, screen_name: screenName, password: pwd, email: email});

	toAdd.save(function(err, toAdd){
		if(err)
		  console.log(err);
		else
		  console.log(toAdd);
	});
}

console.log( process.argv[2] );

var server = http.createServer(app).listen(app.get('port'), process.argv[2] , function(){
	console.log("Server listening on port " + app.get('port'));
});

