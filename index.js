const express    = require('express'),
			app        = express(),
			request    = require('request'),
			bodyParser = require('body-parser'),
			ngrok      = require('ngrok'),
			fs         = require('fs'),
			spawn      = require('child_process').spawn,
			gpio       = require('rpi-gpio');

/* CONFIG 
  ===================================== */
const ngrokToken   = '',
      slackWebhook = '';

	// globals
	const PORT = 4390;
	const pin = 7;
	let ngrokURL,
		  postData,
	    isProcessing = false,
	    watching = false,
	    motionReady = true;


/* EXPRESS SERVER 
  ===================================== */

	// Express config
	app.use(express.static('public'));
	app.use(bodyParser.urlencoded({extended: true})); 

	// Express routes
	app.get('/', function(req, res) {
	  res.send('Ngrok is working!');
	});

	app.post('/photo', (req, res) => {
		if ( photoCommand(req) ) {
			res.send('Sure, one moment please');
		} else {		
			res.send('Sorry, I\'m busy taking a photo, try again shortly');
		}	
	});

	// Lets start our Express server
	const server = app.listen(PORT, () => { 
		onServerInit();
	});

/* FUNCTIONS
  ===================================== */

	function onServerInit() {
		// create ngrok tunnel
		ngrokConnect();	
		
		// setup event listeners
		eventListeners();	
	}

	function eventListeners() {
		// watch for new image files
		fs.watch('public', function (event, filename) {
		  if (filename && event == 'change' && watching == false) {
		    watching = true;
		  	
		  	let date = new Date().toLocaleString('en-GB', {timeZone: 'Australia/Sydney'});

	  		slackPost(postData.url, {
					  response_type: 'in_channel',
					  text: postData.title,
					  attachments:[{
					  	title: date,
						  image_url: ngrokURL + '/' + filename.replace('~','')
						}]
					}
	  		);
	  		// the timeout is to prevent the script from running multiple times on new file creation
			  setTimeout(() => {
		      watching = false;
		    }, 100);
		  }		
		});
		
		// GPIO listener
		gpio.on('change', function(channel, value) {
			// console.log('Channel ' + channel + ' value is now ' + value);
			if ( value ) {
				motionDetected();	
			}			
		});
		gpio.setup(pin, gpio.DIR_IN, gpio.EDGE_BOTH);
	}

	let ngrokConnect = async () => {
		let options = {addr: PORT};
		try {
			if ( ngrokToken ) {
				options = {addr: PORT, authtoken: ngrokToken};
			}
			ngrokURL = await ngrok.connect(options);
			console.log('Server started. ngrok tunnel running at url: ' + ngrokURL);
	 	} catch(err) {
	    console.error(err);
	  }	
		// notify slack channel
	  slackPost(slackWebhook, {text:'Hello! I\'m online and the ngrok tunnel is running at url: ' + ngrokURL });
	}

	function photoCommand(req) {	
		if ( isProcessing ) {		
			return false;
		}
		console.log('received /photo command');

		postData = {
			title: 'Here\'s your photo ' + req.body.user_name,
			url: req.body.response_url
		};
		takePhoto();
		return true;
	}

	function takePhoto() {
		isProcessing = true;
		let filename = Date.now().toString() + '.jpg';
		let params = ['-w', 640, '-h', 480, '-o', 'public/' + filename, '-ex', 'sports', '--nopreview', '--timeout', 1];

		console.log('> raspistill ' + params.join(' '));
		spawn('raspistill', params);	
	}

	function slackPost(url, data) {	
		request.post({
		  headers: {'content-type' : 'application/json'},
		  url:    url,
		  body:   JSON.stringify(data)
		}, function(error, response, body) {
		  if ( body === 'ok') {
				console.log('successfully posted to Slack');
		  } else if (!url) {
		  	console.log('Error: Please setup a Slack Webhook');
		  } else {
		  	console.log('Error: Ensure your Slack Webhook address is correct');
		  }
		});

		isProcessing = false;
	}

	function motionDetected() {
		if ( isProcessing || !motionReady) {
			return;
		}
		motionReady = false;
		console.log('motion detected');	

		// timeout to prevent mulitple photos within time range
		setTimeout(() => {motionReady = true;} , 20000);

		postData = {
			title: 'Cheeeeese! :cheese_wedge:',
			url: slackWebhook
		};
		takePhoto();
	}
