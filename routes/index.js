var express = require('express');
var router = express.Router();

// The homepage of the site
router.get('/', restrict, function(req, res, next) {
	var db = req.db;
	var config = require('./config');
	
	// get the top 5 results based on viewcount
	// db.kb.find({kb_published:'true'}).sort({kb_viewcount: -1}).limit(config.settings.num_top_results).exec(function (err, top_results) {
	db.kb.find({kb_published:'true'}).limit(config.settings.num_top_results).exec(function (err, top_results) {
 		res.render('index', { 
			 title: '雷火知识库', 
			 "top_results": top_results, 
			 session: req.session,
			 message: clear_session_value(req.session, "message"),
			 message_type: clear_session_value(req.session, "message_type"),
			 config: config
		});
	});
});

router.post('/protected/action', function(req, res) {
	// get article
	req.db.kb.findOne({kb_published:'true', _id: req.body.kb_id}, function (err, result) {
		// check password
		if(req.body.password == result.kb_password){
			// password correct. Allow viewing the article this time
			req.session.pw_validated = "true";
			res.redirect('/kb/' + result._id);
		}else{
			// password incorrect
			req.session.pw_validated = null;
			res.render('error', { message: 'Password incorrect. Please try again.' });
		}
	});
});

router.get('/kb/:id', restrict, function(req, res) {
  var db = req.db;
  var classy = require("markdown-it-classy");
  var markdownit = req.markdownit;
  markdownit.use(classy);
  var helpers = req.handlebars.helpers;
  var config = require('./config');
  
  db.kb.findOne({_id: req.params.id}, function (err, result) {
	// render 404 if page is not published
	if(result == null || result.kb_published == "false"){
		res.render('error', { message: '404 - Page not found' });
	}else{
		// check if has a password
		if(result.kb_password){
			if(result.kb_password != ""){
				if(req.session.pw_validated == "false" || req.session.pw_validated == undefined || req.session.pw_validated == null){
					res.render('protected_kb', { 
						title: "Protected Article",
						"result": result,
						session: req.session
					});
					return;
				}
			}
		}
		
		// add to old view count
		var old_viewcount = result.kb_viewcount;
		if(old_viewcount == null){
			old_viewcount = 0;
		}

		var new_viewcount = old_viewcount + 1;
		db.kb.update({ _id: req.params.id }, 
			{ 
				$set: { kb_viewcount:  new_viewcount} 
			}, { multi: false }, function (err, numReplaced) {
			
			// clear session auth and render page
			req.session.pw_validated = null;
			
			// show the view
			res.render('kb', { 
				title: result.kb_title, 
				"result": result,
				// "kb_body": markdownit.render(result.kb_body),
				"kb_body": result.kb_body,
				config: config,
				session: req.session,
				helpers: helpers
			});
		});
	}
  });
});

// render the editor
router.get('/edit/:id', restrict, function(req, res) {
  var db = req.db;
  var config = require('./config');
  
  db.kb.findOne({_id: req.params.id}, function (err, result) {
  	/*
		result:
		{ kb_title: '111111111111',
		  kb_body: '<p>2121212121212</p>',
		  kb_published: 'false',
		  kb_keywords: '',
		  kb_published_date: Wed Jan 20 2016 17:09:47 GMT+0800 (中国标准时间),
		  kb_last_updated: Wed Jan 20 2016 17:44:37 GMT+0800 (中国标准时间),
		  kb_author: '123456@qq.com',
		  _id: 'Yq2GBJK0qO6k03qS',
		  kb_password: '' 
		}

  	*/
	res.render('edit', { 
		title: 'Edit article', 
		"result": result,
		session: req.session,
		config: config,
		editor: true,
		message: clear_session_value(req.session, "message"),
		message_type: clear_session_value(req.session, "message_type"),
		helpers: req.handlebars.helpers
	});
  });
});

// insert new KB form action
router.post('/insert_kb', restrict, function(req, res) {
  	var db = req.db;
	var lunr_index = req.lunr_index;
  
  	var published_state = "false";
	if(req.body.frm_kb_published == "on"){
		published_state = "true";
	}
	
	// if empty, remove the comma and just have a blank string
	var keywords = req.body.frm_kb_keywords[1];
	if(keywords.trim() == ","){
		keywords = "";
	}
    var doc = { 
        kb_title: req.body.frm_kb_title,
		kb_body: req.body.frm_kb_body,
		kb_published: published_state,
		kb_keywords: keywords,
		kb_published_date: new Date(),
		kb_last_updated: new Date(),
		kb_author: req.session.user
	};

	db.kb.insert(doc, function (err, newDoc) {
		if(err){
			console.log(err);
		}else{
			// setup keywords
			var keywords = "";
			if(req.body.frm_kb_keywords != undefined){
				keywords = req.body.frm_kb_keywords.toString().replace(/,/g, ' ');
			}
			
			// create lunr doc
			var lunr_doc = { 
				kb_title: req.body.frm_kb_title,
				kb_keywords: keywords,
				id: newDoc._id
			};
			
			// add to lunr index
			lunr_index.add(lunr_doc);
			
			req.session.message = "New article successfully created";
			req.session.message_type = "success";
			
			// redirect to new doc
			res.redirect('/edit/' + newDoc._id);
		}
	});
});

// Update an existing KB article form action
router.get('/suggest', suggest_allowed, function(req, res) {
	var config = require('./config');
	
	res.render('suggest', { 
		title: 'Suggest article',
		config: config,
		editor: true,
		is_admin: req.session.is_admin,
		helpers: req.handlebars.helpers,
		session: req.session
	});
});

// Update an existing KB article form action
router.post('/insert_suggest', suggest_allowed, function(req, res) {
	var db = req.db;
	var lunr_index = req.lunr_index;
	
	// if empty, remove the comma and just have a blank string
	var keywords = req.body.frm_kb_keywords[1];
	if(keywords != null){
		if(keywords.trim() == ","){
			keywords = "";
		}
	}
	
	var doc = { 
        kb_title: req.body.frm_kb_title,
		kb_body: req.body.frm_kb_body,
		kb_published: "false",
		kb_keywords: keywords,
		kb_published_date: new Date(),
		kb_last_updated: new Date(),
		kb_author: req.session.user
	};

	db.kb.insert(doc, function (err, newDoc) {
		if(err){
			console.log(err);
		}else{
			
			// setup keywords
			var keywords = "";
			if(req.body.frm_kb_keywords != undefined){
				keywords = req.body.frm_kb_keywords.toString().replace(/,/g, ' ');
			}
			
			// create lunr doc
			var lunr_doc = { 
				kb_title: req.body.frm_kb_title,
				kb_keywords: keywords,
				id: newDoc._id
			};
			
			// add to lunr index
			lunr_index.add(lunr_doc);
			
			// redirect to new doc
			req.session.message = "Suggestion successfully processed";
			req.session.message_type = "success";
			res.redirect('/');
		}
	});
});

// Update an existing KB article form action
router.post('/save_kb', restrict, function(req, res) {
  	var db = req.db;
	var lunr_index = req.lunr_index;
	var published_state = "false";
	if(req.body.frm_kb_published == "on"){
		published_state = "true";
	}
	
	// if empty, remove the comma and just have a blank string
	var keywords = req.body.frm_kb_keywords[1];
	if(keywords.trim() == ","){
		keywords = "";
	}


 	db.kb.findOne({_id: req.body.frm_kb_id}, function (err, article) {
		
		// update author if not set
		var author;
		if(article.kb_author == null || article.kb_author == undefined){
			author = req.session.user;
		}else{
			author = article.kb_author;
		}
		
		// set published date to now if none exists
		var published_date;
		if(article.kb_published_date == null || article.kb_published_date == undefined){
			published_date = new Date();
		}else{
			published_date = article.kb_published_date;
		}
		
		db.kb.update({_id: req.body.frm_kb_id},{ $set: 
				{   kb_title: req.body.frm_kb_title,
					kb_body: req.body.frm_kb_body,
					kb_published: published_state,
					kb_keywords: keywords,
					kb_last_updated: new Date(),
					kb_author: author,
					kb_published_date: published_date,
					kb_password: req.body.frm_kb_password
				}
			}, {},  function (err, numReplaced) {
			if(err){
				req.session.message = "Failed to save. Please try again";
				req.session.message_type = "danger";
			}else{
				// setup keywords
				var keywords = "";
				if(req.body.frm_kb_keywords != undefined){
					keywords = req.body.frm_kb_keywords.toString().replace(/,/g, ' ');
					
				}
				
				// create lunr doc
				var lunr_doc = { 
					kb_title: req.body.frm_kb_title,
					kb_keywords: keywords,
					id: req.body.frm_kb_id
				};
				
				// update the index
				lunr_index.update(lunr_doc, false);
				
				req.session.message = "Successfully saved";
				req.session.message_type = "success";
				res.redirect('/edit/' + req.body.frm_kb_id);
			}
		});
	});
});

// logout
router.get('/logout', function(req, res) {
  	req.session.user = null;
	req.session.message = null;
	req.session.message_type = null;
	res.redirect('/');
});

// users
router.get('/users', restrict, function(req, res) {
	var config = require('./config');
	
	req.db.users.find({}, function (err, users) {
		res.render('users', { 
		  	title: 'Users',
			users: users,
			config: config,
			is_admin: req.session.is_admin,
			helpers: req.handlebars.helpers,
			session: req.session
		});
	});
});

// users
router.get('/user/edit/:id', restrict, function(req, res) {
	var config = require('./config');
	
	req.db.users.findOne({_id: req.params.id}, function (err, user) {
		res.render('user_edit', { 
		  	title: 'User edit',
			user: user,
			session: req.session,
			config: config,
			message: clear_session_value(req.session, "message"),
			message_type: clear_session_value(req.session, "message_type")
		});
	});
});

// users
router.get('/users/new', restrict, function(req, res) {
	var config = require('./config');
		
	req.db.users.findOne({_id: req.params.id}, function (err, user) {
		res.render('user_new', { 
		  	title: 'User - New',
			user: user,
			session: req.session,
			config: config,
			message: clear_session_value(req.session, "message"),
			message_type: clear_session_value(req.session, "message_type")
		});
	});
});

// users
router.get('/users/reg', function(req, res) {
	var config = require('./config');
	console.log("错误");
	req.db.users.findOne({_id: req.params.id}, function (err, user) {
		res.render('reg', { 
		  	title: '用户 - 注册',
			user: user,
			session: req.session,
			config: config,
			message: clear_session_value(req.session, "message"),
			message_type: clear_session_value(req.session, "message_type")
		});
	});
});

// kb list
router.get('/articles', restrict, function(req, res) {
	var config = require('./config');
	
	req.db.kb.find({}, function (err, articles) {
		res.render('articles', { 
		  	title: 'Articles',
			articles: articles,
			session: req.session,
			config: config,
			helpers: req.handlebars.helpers
		});
	});
});

// update the published state based on an ajax call from the frontend
router.post('/published_state', restrict, function(req, res) {
	req.db.kb.update({ _id: req.body.id}, 
		{ 
			$set: { 
				kb_published: req.body.state
			} 
		}, { multi: false }, function (err, numReplaced) {
			console.log(err);
	});
});	

// insert a user
router.post('/user_insert', restrict, function(req, res) {
  	var db = req.db;
	var bcrypt = req.bcrypt;
	var url = require('url');
	
	// set the account to admin if using the setup form. Eg: First user account
	var url_parts = url.parse(req.header('Referer'));

	var is_admin = "false";
	if(url_parts.path == "/setup"){
		is_admin = "true";
	}
	
	var doc = { 
        user_email: req.body.user_email,
		user_password: bcrypt.hashSync(req.body.user_password),
		is_admin: is_admin
	};
	
	db.users.insert(doc, function (err, doc) {
		// show the view
		if(err){
			req.session.message = "User exists";
			req.session.message_type = "danger";
			res.redirect('/user/edit/' + doc._id);
		}
		req.session.message = "User account inserted.";
		req.session.message_type = "success";
		
		// if from setup we add user to session and redirect to login.
		// Otherwise we show user edit screen
		if(url_parts.path == "/setup"){
			req.session.user = req.body.user_email;
			res.redirect('/login');
		}else{
			res.redirect('/user/edit/' + doc._id);
		}
	});
});

// update a user
router.post('/user_update', restrict, function(req, res) {
  	var db = req.db;
	var bcrypt = req.bcrypt;
	
	db.users.update({ _id: req.body.user_id }, 
		{ 
			$set: { 
				user_password: bcrypt.hashSync(req.body.user_password)
			} 
		}, { multi: false }, function (err, numReplaced) {
		
		// show the view
		req.session.user = req.body.user_email;
		req.session.message = "User account updated.";
		req.session.message_type = "success";
		res.redirect('/user/edit/' + req.body.user_id);
	});
});

// login form
router.get('/login', function(req, res) {
	var config = require('./config');
	
	req.db.users.count({}, function (err, user_count) {  
		// we check for a user. If one exists, redirect to login form otherwise setup
		if(user_count > 0){
			// set needs_setup to false as a user exists
			req.session.needs_setup = false;
			res.render('login', { 
			  	title: 'Login', 
				referring_url: req.header('Referer'),
				config: config,
				message: clear_session_value(req.session, "message"), 
				message_type: clear_session_value(req.session, "message_type")
			});
		}else{
			// if there are no users set the "needs_setup" session
			req.session.needs_setup = true;
			res.redirect('/setup');
		}
	});
});

// setup form is shown when there are no users setup in the DB
router.get('/setup', function(req, res) {
	var config = require('./config');
	
	req.db.users.count({}, function (err, user_count) {
		// dont allow the user to "re-setup" if a user exists.
		// set needs_setup to false as a user exists
		req.session.needs_setup = false;
		if(user_count == 0){
			res.render('setup', { 
			  	title: 'Setup', 
				config: config,
				message: clear_session_value(req.session, "message"), 
				message_type: clear_session_value(req.session, "message_type")
			});
		}else{
			res.redirect('/login');
		}
	});
});

// login the user and check the password
router.post('/login_action', function(req, res){
    var db = req.db;
	var bcrypt = req.bcrypt;
	var url = require('url');
	
	db.users.findOne({user_email: req.body.email}, function (err, user) {  

		// check if user exists with that email
		if(user === undefined || user === null){
			req.session.message = "A user with that email does not exist.";
			req.session.message_type = "danger";
			res.redirect('/login');
		}else{
			// we have a user under that email so we compare the password
			if(bcrypt.compareSync(req.body.password, user.user_password) == true){
				req.session.user = req.body.email;
				req.session.user_id = user._id;
				req.session.is_admin = user.is_admin;
				if(req.body.frm_referring_url === undefined || req.body.frm_referring_url == ""){
					res.redirect('/');
				}else{
					var url_parts = url.parse(req.body.frm_referring_url, true);
					if(url_parts.pathname == "setup" || url_parts.pathname == "login"){
						res.redirect(req.body.frm_referring_url);
					}else{
						res.redirect('/');
					}
				}
			}else{
				// password is not correct
				req.session.message = "Access denied. Check password and try again.";
				req.session.message_type = "danger";
				res.redirect('/login');
			}
		}
	});
});

// delete user
router.get('/user/delete/:id', restrict, function(req, res) {
  	var db = req.db;
	
	// remove the article
	if(req.session.is_admin == "true"){
		db.users.remove({_id: req.params.id}, {}, function (err, numRemoved) {			
			req.session.message = "User deleted.";
			req.session.message_type = "success";
			res.redirect("/users");
	  	});
	}else{
		req.session.message = "Access denied.";
		req.session.message_type = "danger";
		res.redirect("/users");
	}
});

// delete article
router.get('/delete/:id', restrict, function(req, res) {
  	var db = req.db;
	var lunr_index = req.lunr_index;
	
	// remove the article
	db.kb.remove({_id: req.params.id}, {}, function (err, numRemoved) {
		
		// setup keywords
		var keywords = "";
		if(req.body.frm_kb_keywords != undefined){
			keywords = req.body.frm_kb_keywords.toString().replace(/,/g, ' ');
		}
		
		// create lunr doc
		var lunr_doc = { 
			kb_title: req.body.frm_kb_title,
			kb_keywords: keywords,
			id: req.body.frm_kb_id
		};
		
		// remove the index
		lunr_index.remove(lunr_doc, false);
		
		// redirect home
		res.redirect('/articles');
  	});
});

router.post('/file/new_dir', restrict, function (req, res, next) {
	var mkdirp = require('mkdirp');
	
	// if new directory exists
	if(req.body.custom_dir){
		mkdirp("public/uploads/" + req.body.custom_dir, function (err) {
			console.log(err);
			if (err){
				req.session.message = "Directory creation error. Please try again";
				req.session.message_type = "danger";
				res.redirect('/files');
			}else{
				req.session.message = "Directory successfully created";
				req.session.message_type = "success";
				res.redirect('/files');
			}
		});
	}else{
		req.session.message = "Please enter a directory name";
		req.session.message_type = "danger";
		res.redirect('/files');
	}
});

// upload the file
var multer  = require('multer')
var upload = multer({ dest: 'public/uploads/' });
router.post('/file/upload', restrict, upload.single('upload_file'), function (req, res, next) {
	var fs = require('fs');
	
	if(req.file){
		// check for upload select
		var upload_dir = "public/uploads/";
		if(req.body.directory != "/uploads"){
			upload_dir = "public/" + req.body.directory;
		}
		
		var file = req.file;
		var source = fs.createReadStream(file.path);
		var dest = fs.createWriteStream(upload_dir + "/" + file.originalname.replace(/ /g,"_"));

		// save the new file
		source.pipe(dest);
		source.on("end", function() {});

		// delete the temp file.
		fs.unlink(file.path, function (err) {});
	
		req.session.message = "File uploaded successfully";
		req.session.message_type = "success";
		res.redirect('/files');
	}else{
		req.session.message = "File upload error. Please select a file.";
		req.session.message_type = "danger";
		res.redirect('/files');
	}
});

// delete a file via ajax request
router.post('/file/delete', restrict, function(req, res) {
	var fs = require('fs');

	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type,Accept");

	fs.unlink("public/" + req.body.img, function (err) {
		if (err){
			console.log(err);
			res.send({'data': 'Error'});
		}
		res.send({'data': 'Success'});
	});
});

router.get('/files', restrict, function(req, res) {
	var config = require('./config');
	var glob = require("glob");
	var fs = require("fs");
	
	// loop files in /public/uploads/
	glob("public/uploads/**", {nosort: true}, function (er, files) {
		
		// sort array
		files.sort();
		
		// declare the array of objects
		var file_list = new Array();
		var dir_list = new Array();
		
		// loop these files
		for (var i = 0; i < files.length; i++) {
			
			// only want files
			if(fs.lstatSync(files[i]).isDirectory() == false){
				// declare the file object and set its values
				var file = {
					id: i,
					path: files[i].substring(6)
				};
				
				// push the file object into the array
				file_list.push(file);
			}else{
				var dir = {
					id: i,
					path: files[i].substring(6)
				};
				
				// push the dir object into the array
				dir_list.push(dir);
			}
		}
		
		// render the files route
		res.render('files', {
			title: 'Files', 
			files: file_list,
			dirs: dir_list,
			session: req.session,
			config: config,
			message: clear_session_value(req.session, "message"),
			message_type: clear_session_value(req.session, "message_type"),
		});
	});
});

// insert form
router.get('/insert', restrict, function(req, res) {
	var config = require('./config');
	var glob = require("glob");
	var fs = require("fs");
	
	// loop files in /public/uploads/
	glob("public/uploads/**", {nosort: true}, function (er, files) {
		
		// sort array
		files.sort();
		
		// declare the array of objects
		var file_list = new Array();
		var dir_list = new Array();
		
		// loop these files
		for (var i = 0; i < files.length; i++) {
			
			// only want files
			if(fs.lstatSync(files[i]).isDirectory() == false){
				// declare the file object and set its values
				var file = {
					id: i,
					path: files[i].substring(6)
				};
				
				// push the file object into the array
				file_list.push(file);
			}else{
				var dir = {
					id: i,
					path: files[i].substring(6)
				};
				
				// push the dir object into the array
				dir_list.push(dir);
			}
		}
		
		// render the files route
		res.render('insert', {
			title: '新建文章', 
			dirs: dir_list,
			session: req.session,
			config: config,
			editor: true,
			message: clear_session_value(req.session, "message"),
			message_type: clear_session_value(req.session, "message_type"),
		});
	});
	// res.render('insert', {
	// 	title: 'Insert new', 
	// 	session: req.session,
	// 	editor: true,
	// 	config: config
	// });
	



});

// search kb's
router.get('/search/:tag', restrict, function(req, res) {
	var db = req.db;
	var search_term = req.params.tag;
	var lunr_index = req.lunr_index;
	var config = require('./config');
	
	// we strip the ID's from the lunr index search
	var lunr_id_array = new Array();
	lunr_index.search(search_term).forEach(function(id) {
		lunr_id_array.push(id.ref);
	});
  
	// we search on the lunr indexes
	db.kb.find({ _id: { $in: lunr_id_array}, kb_published:'true'}, function (err, results) {
		res.render('index', { 
			title: 'Results', 
			"results": results, 
			session: req.session,
			message: clear_session_value(req.session, "message"),
			message_type: clear_session_value(req.session, "message_type"), 
			search_term: search_term,
			config: config
		});
	});
});

// search kb's
router.post('/search', restrict, function(req, res) {
	var db = req.db;
	var search_term = req.body.frm_search;
	var lunr_index = req.lunr_index;
	var config = require('./config');

	// we strip the ID's from the lunr index search
	var lunr_id_array = new Array();
	lunr_index.search(search_term).forEach(function(id) {
		lunr_id_array.push(id.ref);
	});
	
	// we search on the lunr indexes
	db.kb.find({ _id: { $in: lunr_id_array}, kb_published:'true'}, function (err, results) {
		res.render('index', { 
			title: 'Results', 
			"results": results, 
			session: req.session, 
			search_term: search_term,
			message: clear_session_value(req.session, "message"),
			message_type: clear_session_value(req.session, "message_type"),
			config: config
		});
	});
});

// export files into .md files and serve to browser
router.get('/export', restrict, function(req, res) {
	var db = req.db;
	var fs = require('fs');
	var JSZip = require("jszip");
	
	// dump all articles to .md files. Article title is the file name and body is contents
	db.kb.find({}, function (err, results) {
		
		// files are written and added to zip.
		var zip = new JSZip();
		for (var i = 0; i < results.length; i++) {
			// add and write file to zip
			zip.file(results[i].kb_title + ".md", results[i].kb_body);
		}
		
		// save the zip and serve to browser
		var buffer = zip.generate({type:"nodebuffer"});
		fs.writeFile("data/export.zip", buffer, function(err) {
			if (err) throw err;
			res.set('Content-Type', 'application/zip')
			res.set('Content-Disposition', 'attachment; filename=data/export.zip');
			res.set('Content-Length', buffer.length);
			res.end(buffer, 'binary');
			return;
		});
	});
});

function clear_session_value(session, session_var){
	if(session_var == "message"){
		var sess_message = session.message;
		session.message = null;
		return sess_message;
	}
	if(session_var == "message_type"){
		var sess_message_type = session.message_type;
		session.message_type = null;
		return sess_message_type;
	}
}

// This is called on the suggest url. If the value is set to false in the config
// a 403 error is rendered.
function suggest_allowed(req, res, next){
	var config = require('./config');

	if(config.settings.suggest_allowed == true){
		next();
		return;
	}else{
		res.render('error', { message: '403 - Forbidden' });
	}
}

// This is called on all URL's. If the "password_protect" config is set to true
// we check for a login on thsoe normally public urls. All other URL's get
// checked for a login as they are considered to be protected. The only exception
// is the "setup", "login" and "login_action" URL's which is not checked at all.
function restrict(req, res, next){
	var config = require('./config');
	var url_path = req.url;
				
	// if not protecting we check for public pages and don't check_login
	if(url_path.substring(0,5).trim() == "/"){
		if(config.settings.password_protect == false){
			next();
			return;
		}
	}
	if(url_path.substring(0,7) == "/search"){
		if(config.settings.password_protect == false){
			next();
			return;
		}
	}
	if(url_path.substring(0,3) == "/kb"){
		if(config.settings.password_protect == false){
			next();
			return;
		}
	}
	
	if(url_path.substring(0,12) == "/user_insert"){
		next();
		return;
	}
	
	// if the "needs_setup" session variable is set, we allow as 
	// this means there is no user existing
	if(req.session.needs_setup == true){
		res.redirect('/setup');
		return;
	}

	// if not a public page we 
	check_login(req, res, next);
}

// does the actual login check
function check_login(req, res, next){
	if(req.session.user){
		next();
	}else{
		res.redirect('/login');
	}
}

module.exports = router;
