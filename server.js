var express = require('express');
var bodyParser = require('body-parser');
var expressSanitizer = require('express-sanitizer');
var cookieParser = require('cookie-parser');
var fileUpload = require('express-fileupload');
var crypto = require('crypto');
var request = require('request');
var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressSanitizer());
app.use(cookieParser());
app.use(fileUpload());
app.use(express.static('public'));


var offline = false;

// init main db
var fs = require('fs');
var dbFile = './uploadr.db';
var exists = fs.existsSync(dbFile);
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(dbFile);

db.on("error", function(error) {
  console.log("Getting an error : ", error);
}); 

var msgtitle;
var msgtext;
var msgcolor;
var showMsg = false;



let rawdata = fs.readFileSync('./data/message.json');  
let messageData = JSON.parse(rawdata); 
msgtitle = messageData.msgtitle;
msgtext = messageData.msgtext;
msgcolor = messageData.msgcolor;
showMsg = messageData.showMsg;

// if ./.data/sqlite.db does not exist, create it, otherwise print records to console
db.serialize(function(){
  if (!exists) {
    db.run('CREATE TABLE uploads (id TEXT, file_name TEXT, file_size INTEGER, ref INTEGER PRIMARY KEY)');
    db.run('CREATE TABLE admins (email TEXT, pass TEXT, userid TEXT, passsalt TEXT, sessionid TEXT, sessionsalt TEXT)');
    db.run('CREATE TABLE codes (code TEXT, used TEXT, type TEXT, ref INTEGER PRIMARY KEY)');
    console.log('New db created');
    
  }
  else {
    console.log('Database "Uploadr" ready to go');
  }
});

// requestable pages

app.get('/', function(request, response) {
    response.sendFile(__dirname + '/views/main.html');
  });
  app.get('/saves', function(request, response) {
    response.sendFile(__dirname + '/views/saves.html');
  });


  app.get('/api/fileinfo/:fileID', function(req, res) {
    db.all(`SELECT * FROM uploads WHERE id = "${req.sanitize(req.params.fileID)}"`, function(err, rows) {
      res.json({"completed": "true", "name": rows[0].file_name, "size": rows[0].file_size});
    });
  });

  app.post('/api/upload', function(req,res){
    if(req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === null) {
      return res.json({"completed" : "false","msg" : "Please Verify The Captcha BeFore Continuing"});
    }
    var secretKey = "6LfRjIwUAAAAAMn5c2kMkv8y2nVyyhNeDT3Bsd4V";
    var verificationUrl = "https://www.google.com/recaptcha/api/siteverify?secret=" + secretKey + "&response=" + req.body['g-recaptcha-response'] + "&remoteip=" + req.connection.remoteAddress;
    request(verificationUrl,function(error,response,body) {
      body = JSON.parse(body);
      // Success will be true or false depending upon captcha validation.
      if(body.success !== undefined && !body.success) {
        return res.json({"completed" : "false","msg" : "Failed captcha verification"});
      }
      if (Object.keys(req.files).length == 0) {
        return res.json({"completed": "false", "msg": "No files were selected, please try again."});
      }
    
      // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
      let sampleFile = req.files.sampleFile;
      if(req.files.sampleFile.data.length > 1073741824) {
        console.log("didnt upload");
        return res.json({"completed" : "false","msg" : "Your File Was Over 1GB"});
      }
      var fileID = uuidv4();
      //1073741824
      fs.mkdirSync(`./public/uploads/${fileID}`);
      
      // Use the mv() method to place the file somewhere on your server
      sampleFile.mv(`./public/uploads/${fileID}/${req.sanitize(req.files.sampleFile.name)}`, function(err) {
        if (err)
          return res.status(500).send(err);
          var stats = fs.statSync(`./public/uploads/${fileID}/${req.sanitize(req.files.sampleFile.name)}`);
          var fileSizeInBytes = stats["size"];
          // INSERT INTO numtest VALUES (ROUND(234.358,1));
          var fileSize = fileSizeInBytes / 1000000.0;
          db.run(`INSERT INTO uploads (id, file_name, file_size) VALUES ("${fileID}", "${req.sanitize(req.files.sampleFile.name)}", ROUND(${fileSize},1))`)
          res.json({"completed": "true", "msg": `Upload worked! You and anyone else can download the file <a href="/f/${fileID}" target="_self">here</a>. Enjoy and thanks for using Uploadr!`});
      });
    });

  });

  function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  app.get('/f/:fileID', function(req, res) {
    db.all(`SELECT * FROM uploads WHERE id = "${req.sanitize(req.params.fileID)}"`, function(err, rows) {

      if(rows[0] !== undefined && rows[0] !== null) {

        res.sendFile(__dirname + '/views/download.html');

      } else {

        res.sendFile(__dirname + '/views/notfound.html');

      }

    });
  });

  app.get('/notfound', function(req, res) {
    res.sendFile(__dirname + '/views/notfound.html');
  });

  app.get('/api/get/:fileID', function(req, res) {
    const testFolder = "./public/uploads/" + req.sanitize(req.params.fileID);

    db.all(`SELECT * FROM uploads WHERE id = "${req.sanitize(req.params.fileID)}"`, function(err, rows) {

      if(rows[0] !== undefined && rows[0] !== null) {

        fs.exists(testFolder, (exists) => {
          if (exists) {

            fs.readdir(testFolder, (err, files) => {
              files.forEach(file => {
              res.download(__dirname + "/public/uploads/" + req.sanitize(req.params.fileID) + "/" + file, file);
              });
            })

          } else {

            res.redirect("/notfound");

          }

        });


          /*

              fs.readdir(testFolder, (err, files) => {
                files.forEach(file => {
                console.log(file);
                res.download(__dirname + "/public/uploads/" + req.sanitize(req.params.fileID) + "/" + file, file);
                });
              })

          */

      } else {

        res.redirect("/notfound");

      }

    });
  });

  // admin login
  // db.run('CREATE TABLE admins (email TEXT, pass TEXT, userid TEXT, passsalt TEXT, sessionid TEXT, sessionsalt TEXT)');

  app.post('/backend/admin/create', function(req,res){
    db.all(`SELECT * FROM admins WHERE UPPER(email) = UPPER("${req.sanitize(req.body.email)}")`, function(err, rows) {
      if(isEmpty(req.body.email) || isEmpty(req.body.password)) {
  
        res.json({"completed": false, "reason": "Account Creation Failed, Please Make Sure All Fields Are Filled In"});
    
      } else if (req.sanitize(req.body.password).length < 7) {
    
        res.json({"completed": false, "reason": "Acount Creation Failed, Please Make Sure Your Password Is More Than 6 Characters"});
    
      } else if (req.sanitize(req.body.email).length > 30) {
    
        res.json({"completed": false, "reason": "Acount Creation Failed, Please Make Sure Your Username Is Less Than 30 Characters"});
    
      } else if (!isEmpty(rows)) {
        res.json({"completed": false, "reason": "An Account With This Username Already Exists, Please Pick a Different Username"});
      } else {
      // get password salt and hash
        let spass = req.sanitize(req.body.password);
        var passinfo = saltHashPassword(spass);
        var psalt = passinfo.salt;
        var phash = passinfo.passwordHash;
        var userid = uuidv4();
       // db.run('CREATE TABLE admins (email TEXT, pass TEXT, userid TEXT, passsalt TEXT, sessionid TEXT, sessionsalt TEXT)');
      db.run(`INSERT INTO admins VALUES ("${req.sanitize(req.body.email)}", "${phash}", "${userid}", "${psalt}", "notloggedin", "notloggedinsalt")`);
    
      res.json({"completed": true, "reason": null});
    
      }
    });
  });




  app.post('/backend/admin/login', function(req,res){

    if(isEmpty(req.body.email) || isEmpty(req.body.password)) {

      res.json({"valid": false, "reason": "Login Failed, Please Make Sure All Fields Are Filled In"});
  
    } else {
  
      // salt and hash user info from form
      // db.run('CREATE TABLE users (username TEXT, pass TEXT, userid TEXT, displayname TEXT, passsalt TEXT, sessionid TEXT, sessionsalt TEXT, isbanned INTEGER)');
      
      
      db.all(`SELECT * FROM admins WHERE email = "${req.sanitize(req.body.email)}"`, function(err, rows) {

        if(rows !== undefined) {
  
          if (rows[0].pass === sha512(req.sanitize(req.body.password), rows[0].passsalt).passwordHash) {
  
            var generatedSessionID = genSessionID(req.sanitize(rows[0].userid));
            res.json({"valid": true, "sessionid": generatedSessionID, "uploadradmin": req.sanitize(rows[0].userid)});
  
          } else {
  
            res.json({"valid": false, "reason": "Invalid Username or Password"});
  
          }
  
        } else if (rows === undefined) {

          res.json({"valid": false, "reason": "Invalid Username or Password"});
  
        } else {

          res.json({"valid": false, "reason": "An unknown error ocurred, please try again"});
  
        }
      });
  
      
    }
  



  }); 

  app.get('/vip', function(req, res) {
    res.sendFile(__dirname + '/views/vip.html');
  });


  app.get('/s', function(req, res) {
    res.redirect("/saves")
  });

  app.get('/api/msg', function(req, res) {
    if(showMsg === false) {
      res.json({"showmsg": false});
    } else if(showMsg === true) {
      res.json({"showmsg": true, "title": msgtitle, "msg": msgtext, "color": msgcolor});
    } else {
      res.json({"showmsg": false});
    }
  });

  app.get('/admin/g', function(req, res) {
    if(req.sanitize(req.cookies.uploadr_admin_session) === undefined || req.sanitize(req.cookies.uploadr_admin_id) === undefined) {
      res.redirect("/admin");
    } else if(isEmpty(req.sanitize(req.cookies.uploadr_admin_session)) || isEmpty(req.sanitize(req.cookies.uploadr_admin_id))) {
      res.redirect("/admin");
    } else {
// CREATE TABLE admins (email TEXT, pass TEXT, userid TEXT, passsalt TEXT, sessionid TEXT, sessionsalt TEXT)
      db.all(`SELECT * FROM admins WHERE userid = "${req.sanitize(req.cookies.uploadr_admin_id)}"`, function(err, rows) {
            if(rows[0] === undefined) {
              res.redirect("/admin");
            } else if (req.cookies.uploadr_admin_session === rows[0].sessionid) {
              res.sendFile(__dirname + '/views/g.html');
            } else {
              res.redirect("/admin");
            }

      });

    }
  });

  app.get('/admin', function(req, res) {
    if(req.sanitize(req.cookies.uploadr_admin_session) === undefined || req.sanitize(req.cookies.uploadr_admin_id) === undefined) {
        res.sendFile(__dirname + '/views/adminLogin.html');
    } else if(isEmpty(req.sanitize(req.cookies.uploadr_admin_session)) || isEmpty(req.sanitize(req.cookies.uploadr_admin_id))) {
      res.sendFile(__dirname + '/views/adminLogin.html');
    } else {
// CREATE TABLE admins (email TEXT, pass TEXT, userid TEXT, passsalt TEXT, sessionid TEXT, sessionsalt TEXT)
      db.all(`SELECT * FROM admins WHERE userid = "${req.sanitize(req.cookies.uploadr_admin_id)}"`, function(err, rows) {
            if(rows[0] === undefined) {
              res.sendFile(__dirname + '/views/adminLogin.html');
            } else if (req.cookies.uploadr_admin_session === rows[0].sessionid) {
              res.sendFile(__dirname + '/views/admin.html');
            } else {
              res.sendFile(__dirname + '/views/adminLogin.html');
            }

      });

    }
  });

  app.post('/backend/admin/remove', function(req,res){

    db.all(`SELECT * FROM admins WHERE userid = "${req.sanitize(req.cookies.uploadr_admin_id)}"`, function(err, rows) {

      var isValid = verifyAdminSession(rows, req.sanitize(req.cookies.uploadr_admin_id), req.sanitize(req.cookies.uploadr_admin_session));
      if(isValid) {
        if(req.sanitize(req.body.removeFileID) === undefined || req.sanitize(req.body.removeFileID) === null) {
          return;
        } else {
          db.run(`DELETE FROM uploads WHERE id = "${req.sanitize(req.body.removeFileID)}";`);
          res.json({"completed": "true", "msg": `Removal Of Upload With ID ${req.sanitize(req.body.removeFileID)} Complete!`});
        }

      } else {
        res.json({"completed": "false", "msg": `Removal Of Upload With ID ${req.sanitize(req.body.removeFileID)} Failed, Please Try Again.`});
        return;
      }

    });

  });

  app.post('/backend/admin/message', function(req,res){

    db.all(`SELECT * FROM admins WHERE userid = "${req.sanitize(req.cookies.uploadr_admin_id)}"`, function(err, rows) {
/* 
      var msgtitle = "Server Issues Currently";
      var msgtext = "We will update everyone when we know more, please stand by!!!";
      var msgcolor = "Yellow";
*/
      var isValid = verifyAdminSession(rows, req.sanitize(req.cookies.uploadr_admin_id), req.sanitize(req.cookies.uploadr_admin_session));
      if(isValid) {
        if(req.body.enabled === "Yes") {
          showMsg = true;
        } else {
          showMsg = false;
        }
        if(req.body.color === "Custom") {
            msgcolor = req.body.alertHex;
            msgtext = req.body.alertText;
            msgtitle = req.body.alertTitle;
            res.json({"completed": true});
        } else {
            msgcolor = req.body.color;
            msgtext = req.body.alertText;
            msgtitle = req.body.alertTitle;
            res.json({"completed": true});
        }
        var messagePrefs = {"showMsg": showMsg, "msgcolor": msgcolor, "msgtext": msgtext, "msgtitle": msgtitle};
        fs.writeFileSync('./data/message.json', JSON.stringify(messagePrefs));

      } else {
        console.log("not valid");
      }


    });
  });

  app.post('/backend/admin/generate', function(req, res){
    db.all(`SELECT * FROM admins WHERE userid = "${req.sanitize(req.cookies.uploadr_admin_id)}"`, function(err, rows) {

      var isValid = verifyAdminSession(rows, req.sanitize(req.cookies.uploadr_admin_id), req.sanitize(req.cookies.uploadr_admin_session));
      if(isValid) {
        // req.body.size
        // CREATE TABLE codes (code TEXT, used TEXT, type TEXT, ref INTEGER PRIMARY KEY)
        //(id, file_name, file_size)
        if(req.body.size === undefined) {
          res.json({"completed" : false, "msg" : "It Seems You Didn't Pick A Key Type, Please Try Again"});
        } else {
            var codeID = uuidv4();
            var type;
            if(req.sanitize(req.body.size) === "Unlimited") {
              type = "unlimited";
            } else if(req.sanitize(req.body.size) === "5GB") {
              type = "5GB";
            } else {
              res.json({"completed" : false, "msg" : "It Seems You Didn't Pick A Valid Key Type, Please Try Again"});
              return;
            }
            db.run(`INSERT INTO codes (code, used, type) VALUES ("${codeID}", "false", "${type}")`);
            res.json({"completed": true, "type": type, "key": codeID});
        }
      } else {
        console.log(req.sanitize(req.body));
        return;
      }

    });

  });

  function verifyAdminSession(data, userid, usersession) {

    if(isEmpty(usersession) || isEmpty(userid)) {

      return false;

    } else if (data[0] === undefined) {

      return false;

    } else {
      if((usersession) === undefined || (userid) === undefined) {
        return false;
    } else if(isEmpty(userid) || isEmpty(usersession)) {
      return false;
    } else {
            if(data[0] === undefined) {
              return false;
            } else if (usersession === data[0].sessionid && userid === data[0].userid) {
              return true;
            } else {
              return false;
            }
        }
    }

    

  }


 

  // hashing stuff

  var genRandomString = function(length){
    return crypto.randomBytes(Math.ceil(length/2))
            .toString('hex') /** convert to hexadecimal format */
            .slice(0,length);   /** return required number of characters */
  };
  
  var sha512 = function(password, salt){
    var hash = crypto.createHmac('sha512', salt); /** Hashing algorithm sha512 */
    hash.update(password);
    var value = hash.digest('hex');
    return {
        salt:salt,
        passwordHash:value
    };
    
  };
  
  function saltHashPassword(userpassword) {
    var salt = genRandomString(16); /** Gives us salt of length 16 */
    var passwordData = sha512(userpassword, salt);
    return passwordData;
  }

  function genSessionID(iduser) {
    if(isEmpty(iduser) === true) {
        return;
    } else {
    var generated = uuidv4();
    var idinfo = saltHashPassword(generated);
    var idsalt = idinfo.salt;
    var idhash = idinfo.passwordHash;
    // db.run('CREATE TABLE admins (email TEXT, pass TEXT, userid TEXT, passsalt TEXT, sessionid TEXT, sessionsalt TEXT)');
    db.run(`UPDATE admins SET sessionid = "${idhash}", sessionsalt = "${idsalt}"  WHERE userid = "${iduser}";`);
    return idhash;
    }
  
  }

  function isEmpty(str) {
    return (!str || 0 === str.length);
  }

  app.listen(3000);