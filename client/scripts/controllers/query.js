app.controller('queryController', ['$scope','$window', '$http', '$location', '$filter', '$sce', '$interval',  function ($scope, $window, $http, $location, $filter, $sce, $interval ) {

    $scope.languages = [ { name: "de", id: 1 }, { name: "bg", id: 2 }, { name: "hu", id: 3 }, { name: "nl", id: 4 }, { name: "el", id: 5 }, { name: "ka", id: 6 }, { name: "da", id: 7 }, { name: "it", id: 8 }, { name: "es", id: 9 }, { name: "ja", id: 10 }, { name: "fr", id: 11 }, { name: "fi", id: 12 }, { name: "ur", id: 13 }, { name: "tr", id: 14 }, { name: "pt", id: 15 }, { name: "ro", id: 16 }, { name: "ru", id: 17 },  { name: "en", id: 18 }  ];
    $scope.selectedLangIn = $scope.languages[14];
    $scope.selectedLangOut = $scope.languages[17];
    var sounds = [];
    $scope.sounds = sounds;

// Counter used to generate new player ids
var playersCounter = 0;

var query = $scope.query;
$scope.recordings = false;

$scope.about= 'estreito';


//$scope.query = 'gfun';


    $scope.$watch('selectedLangOut', function(){
	q = $scope.query;
	lin = $scope.selectedLangIn;
	lout = $scope.selectedLangOut;
	if (q !== undefined)
	    $scope.makeTranslationQuery("/translation/" + lin["name"] + "/" + lout["name"] + "/" + q, q);
    })

    $scope.$watch('selectedLangIn', function(){
	q = $scope.query;
	lin = $scope.selectedLangIn;
	lout = $scope.selectedLangOut;
	if (q !== undefined)
	    $scope.makeTranslationQuery("/translation/" + lin["name"] + "/" + lout["name"] + "/" + q, q);
    })

    $scope.$watch('query', function() {

	console.log("Translating keyword!")
	try {
	    console.log("***" + $scope.query + "***");

	    if (($scope.query !== "") && ($scope.query !== undefined))
		$scope.makeTranslationQuery("/translation/" + $scope.selectedLangIn["name"] + "/" + $scope.selectedLangOut["name"] + "/" + $scope.query, $scope.query);
	} catch(err){
	    console.log("Translation not ready");
	    console.log(err)
	}

    	// console.log("making query");
	$scope.makequery('/freesound/search/text/?query=' + $scope.query + '&fields=id,name,previews,tags,images,duration,license&filter=license:("Creative Commons 0" OR "Attribution")&page_size=40');
	//$scope.gifquery('http://api.giphy.com/v1/gifs/search?q='+ $scope.query +'&api_key=E6C8oBZ2WghTaR2HujVpSZJML1fvTpm3&limit=5');

    });

    $scope.searchTranslatedKeyword = function(){
	tk = document.getElementById("translations").innerHTML;
	$scope.query = tk;
	document.getElementById("translations").innerHTML = "";
    }


$scope.trustSrc = function(src) {
    return $sce.trustAsResourceUrl(src);
}


$scope.singlequery = function(soundid) {


  var req = {
    method: 'GET',
    url: '/freesound/sounds/'+ soundid + '/?fields=id,name,previews,images,duration,license',
    headers: {
      'Content-Type': 'application/json'
    }

  };

  $.ajax(req).
      then(function(response) {
        // when the response is available
        console.log(response);

      $scope.$apply(function () {
        $scope.response = response;
        $scope.sound = response.results;

      });
      }, function(response) {
        // error.

        //ok
      }, function(response) {
        // error.
      });

}

    $scope.makeTranslationQuery = function(urlbase, query) {

	console.log("[DVL] makeTranslationQuery");
	console.log(urlbase)

	try{
	    t = document.getElementById("translations");
	    t.innerHTML = "";
	} catch(err){
	    console.log(err);
	}

    var req = {
	method: 'GET',
	url: urlbase,
	headers: {
	    'Content-Type': 'application/json',
	    'app_id': "ef0a2bd1",
	    'app_key': "497f43eacd7fc39f621ee8e9ae851315"
	}
    };

    $.ajax(req).
    	then(function(response) {

            // when the response is available
	    // try to parse the response as a JSON message
	    console.log(response)

	    try {
		jr = JSON.parse(response);
		t = document.getElementById("translations");
		if ((t !== undefined) && (t !== null)){
		    for (word in jr["text"]){
			if (jr["text"][word] !== undefined) {
			    t.innerHTML = jr["text"][word];
			}
			else {
			    t.innerHTML = "";
			}
		    }
		}
		else {
		    t.innerHTML = "";
		}
	    } catch(err) {
		console.log(err)
		console.log("No translations available")
		t = document.getElementById("translations");
		t.innerHTML = "";
	    }

    	}, function(response) {
            // error.
            //ok
    	}, function(response) {
            // error.

    	});
}


$scope.makequery = function(urlbase) {


  var req = {
   method: 'GET',
   url: urlbase,
   headers: {
     'Content-Type': 'application/json'
   }

  };

  $.ajax(req).
      then(function(response) {
        // when the response is available
        console.log(response);

      $scope.$apply(function () {
          $scope.response = response;
          $scope.results = response.results;
          //change the next link
          if (response.next){
        $scope.next = response.next;
        $scope.next = $scope.next.replace("http://freesound.org/apiv2/", "/freesound/");
      //console.log($scope.next);
        }
        //change the previous link
        if (response.previous){
        $scope.previous = response.previous;
        $scope.previous = $scope.previous.replace("http://freesound.org/apiv2/", "/freesound/");
        }
      });
      }, function(response) {
        // error.

        //ok
      }, function(response) {
        // error.

      });

}

$scope.gifquery = function(urlgif){
var req = {
   method: 'GET',
   url: urlgif,
   headers: {
     'Content-Type': 'application/json'
   }

  };

  $.ajax(req).
      then(function(response) {
        // when the response is available
        console.log(response);

      $scope.$apply(function () {
          $scope.gifresponse = response;
          //$scope.gifresults = response.results;
          //change the next link
          if (response.next){
        $scope.next = response.next;
        $scope.next = $scope.next.replace("http://freesound.org/apiv2/", "/freesound/");
      //console.log($scope.next);
        }
        //change the previous link
        if (response.previous){
        $scope.previous = response.previous;
        $scope.previous = $scope.previous.replace("http://freesound.org/apiv2/", "/freesound/");
        }
      });
      }, function(response) {
        // error.

        //ok
      }, function(response) {
        // error.

      });


}


//verifying url for pre-selected samples

var queryString = $location.path();

if (queryString) {

  var ids = queryString.split("=");
  var ids = ids[1];

  if (ids) {
     var ids = ids.split(",");

  for (var i = 0; i < ids.length;i++) {
    var playerid = playersCounter++;
    $scope.sounds.push({id: ids[i], newsound: 0, playerid: playerid++});
  }
  //$scope.sounds = sounds;
  console.log(sounds);
  }

}

$scope.player = function(itemid) {
  var playerid = playersCounter++;


    //adding to sounds
    console.log("ADDING ");
    console.log(itemid);
    console.log($scope.sounds);
    console.log($scope);

    for (el in $scope.results){
	if ($scope.results[el]["id"] === itemid){

	    // $.post("/semantic",
	    // 	   {"sessionID": $scope.sessionID, "tags": $scope.results[el]["tags"]},
	    // 	   function(data){
	    // 	       console.log("RECEIVED DATA:");
	    // 	       console.log(data)
	    // 	   }
	    // 	  );

	    $.ajax({
		url: '/semantic',
		dataType: 'json',
		type: 'post',
		contentType: 'application/json',
		data: JSON.stringify({"sessionID": $scope.sessionID, "tags": $scope.results[el]["tags"]}),
		processData: false,
		success: function( data, textStatus, jQxhr ){
		    console.log(data);
		    textField = document.getElementById("recommendations");
		    textField.innerHTML = "";
		    for (r in data){
			console.log(r)
			textField.innerHTML += data[r]["title"];
		    }
		    console.log("End");
		},
		error: function( jqXhr, textStatus, errorThrown ){
		    console.log( errorThrown );
		}
	    });

	    // for (tag in $scope.results[el]["tags"]){

	    // 	// t = $scope.results[el]["tags"][tag];
	    // 	// updText = `PREFIX ns:<http://ns#> INSERT DATA \{ <${$scope.sessionID}> ns:hasTag "${t}" \}`
	    // 	// console.log(updText);
	    // }
	}
    }


  //adding to sounds
  $scope.sounds.unshift({id: itemid, newsound: 1, playerid: playerid});

  //change url
  $scope.updateAddress();

  //tell the sound to play
    //var played = document.getElementById("aud" + itemid);
      //played.play();


}

$scope.sicronize = function() {
  var list = document.getElementsByTagName("audio");
  //console.log(list);
  for (i= 0; i < list.length; i++) {
    list[i].currentTime = 0;
  }

}

$scope.queuesound = function(itemid) {
  var playerid = playersCounter++;

  //adding to sounds
  $scope.sounds.unshift({id: itemid, newsound: 0, playerid: playerid});

  //change url
  $scope.updateAddress();

  //tell the sound to play
    //var played = document.getElementById("aud" + itemid);
      //played.play();


}

//to write logs in the console
$scope.logger = function(message) {
  var marker = 'audioquery:';
  var timeStamp = Math.floor(Date.now() / 1000);
  var timeStamp = "[" + timeStamp + "] ";
  console.log(timeStamp + '' + marker + 'query: ' + $scope.query + message);

}

$scope.logger2 = function(message) {
  var marker = 'audioquery:';
  var timeStamp = Math.floor(Date.now() / 1000);
  var timeStamp = "[" + timeStamp + "] ";
  console.log(timeStamp + '' + marker + message);

};

$scope.updateAddress = function() {

var curadress = $location.path();

if (curadress === "/"){
 curadress = $location.path();
 console.log(curadress + "slash");
}else {
  curadress = $location.path() + "/";
  console.log(curadress + "no slash");
}
  curadress = curadress.split('sounds=')[0];
  var newadress = $scope.sounds.length > 0 ? 'sounds=' : '';
  for (var position = 0; position < $scope.sounds.length; position++) {
    newadress += (position > 0 ? ',' : '') + $scope.sounds[position].id;
  }

  newadress = curadress + newadress;

  $location.path(newadress, false);
}

$scope.removeitem = function(playerid) {
  //remove item
  // $scope.sounds.splice(index, 1);
  var newsounds = [];
  for (var position = 0; position < $scope.sounds.length; position++) {
    if ($scope.sounds[position].playerid !== playerid) {
      newsounds.push($scope.sounds[position]);
    }
  }
  //change array
  $scope.sounds = newsounds;
  //change url
  $scope.updateAddress();
  //console.log('a');
}

$scope.logDownload = function () {
  $window.ga('send', 'event', 'Download', 'File Name'); //This would log a GA Event
  //$location.path('your path to download the file'); //use this if you are linking to an angular route
};

$scope.play = function(itemsrc, itemid) {

  var playerid = playersCounter++;
  //verify adress
  var curadress = $location.path();
  if (curadress) {
    var partsadress = curadress.split("=");
    var adress = partsadress[0] + "=" + itemid + ',' + partsadress[1];
  } else {
    var adress = 'sounds=' + itemid;
  }

  //change url
  $location.path(adress, false);


  //create audio element
  var sound      = document.createElement('audio');

  //create audio buffer
  sound.crossOrigin = "anonymous";
  sound.id       = 'aud' + itemid;
  sound.controls = 'controls';
  //sound.loop = 'loop';
  sound.src      = itemsrc;
  sound.type     = 'audio/mpeg';
  //put element on playlist
  $('#audios').prepend(sound);
  //if (loaded) {} else {
  sound.play();
  //}

  //binding new objects to sudio context

  // var source = audioCtx.createMediaElementSource(sound);
  // source.connect(gainNode);
  // gainNode.connect(audioCtx.destination)
}

// $scope.$watch('masterval', function(newValue, oldValue) {

// console.log($scope.masterval);

// }, true);

$scope.changevol = function(val){

  $scope.masterval = val;

  gainNode.gain.value = $scope.masterval;


}


//recorder from thomas vassalo

$scope.startRecording = function () {
    //$('#recStatus').fadeIn();
    //var input = gainNode;
    var input = gainNode;
    //__log('Media stream created.'); input.connect(audio_context.destination); __log('Input connected to audio context destination.');

    recorder = new Recorder(input);
    console.log('Recorder initialised.');

    recorder && recorder.record();
    var now = new Date();
  }

  $scope.stopRecording = function (){
  //$('#recStatus').fadeOut();
    recorder && recorder.stop();
    console.log('Recorder stop');

    var now = new Date();
    createDownloadLink();
    var now = new Date();
    $scope.recordings = true;
    recorder.clear();
  }

  function createDownloadLink() {
    recorder && recorder.exportWAV(function (blob) {
      var url = URL.createObjectURL(blob);
      var li = document.createElement('li');
      var au = document.createElement('audio');
      console.log(au);
      var hf = document.createElement('a');

      au.controls = true;
      au.src = url;
      hf.href = url;
      //hf.download = new Date().toISOString() + '.wav';
      var now = new Date();
      var patchName = location.pathname.substring(1);
      patchName = patchName.replace(/\.[^/.]+$/, "");
      hf.download = patchName + now.toISOString() + '.wav';
      hf.innerHTML = hf.download;
      console.log(hf.download);
      li.appendChild(au);
      li.appendChild(hf);
      recordingslist.appendChild(li);
      hf.click();
    });
  }

var WORKER_PATH = './scripts/controllers/recorderWorker.js';

  var Recorder = function(source, cfg){
    var config = cfg || {};
    var bufferLen = config.bufferLen || 4096;
    var numChannels = config.numChannels || 2;
    this.context = source.context;
    this.node = (this.context.createScriptProcessor ||
                 this.context.createJavaScriptNode).call(this.context,
                 bufferLen, numChannels, numChannels);
    var worker = new Worker(config.workerPath || WORKER_PATH);
    worker.postMessage({
      command: 'init',
      config: {
        sampleRate: this.context.sampleRate,
        numChannels: numChannels
      }
    });
    var recording = false,
      currCallback;

    this.node.onaudioprocess = function(e){
      if (!recording) return;
      var buffer = [];
      for (var channel = 0; channel < numChannels; channel++){
          buffer.push(e.inputBuffer.getChannelData(channel));
      }
      worker.postMessage({
        command: 'record',
        buffer: buffer
      });
    }

    this.configure = function(cfg){
      for (var prop in cfg){
        if (cfg.hasOwnProperty(prop)){
          config[prop] = cfg[prop];
        }
      }
    }

    this.record = function(){
      recording = true;
    }

    this.stop = function(){
      recording = false;
    }

    this.clear = function(){
      worker.postMessage({ command: 'clear' });
    }

    this.getBuffer = function(cb) {
      currCallback = cb || config.callback;
      worker.postMessage({ command: 'getBuffer' })
    }

    this.exportWAV = function(cb, type){
      currCallback = cb || config.callback;
      type = type || config.type || 'audio/wav';
      if (!currCallback) throw new Error('Callback not set');
      worker.postMessage({
        command: 'exportWAV',
        type: type
      });
    }

    worker.onmessage = function(e){
      var blob = e.data;
      currCallback(blob);
    }

    source.connect(this.node);
    this.node.connect(this.context.destination);    //this should not be necessary
  };

  Recorder.forceDownload = function(blob, filename){
    var url = (window.URL || window.webkitURL).createObjectURL(blob);
    var link = window.document.createElement('a');
    link.href = url;
    link.download = filename || 'output.wav';
    var click = document.createEvent("Event");
    click.initEvent("click", true, true);
    link.dispatchEvent(click);
  }

  window.Recorder = Recorder;

  //master volume
  var mastervol = function(){
  }



}]);


app.controller('chatController', ['$scope', '$window', '$http', '$location', '$filter', '$sce', '$interval',  function ($scope, $window, $http, $location, $filter, $sce, $interval ) {


//new stuff

  var FADE_TIME = 150; // ms
  var TYPING_TIMER_LENGTH = 400; // ms
  var COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
  ];

  // Initialize variables
  var $window = $(window);
  var $usernameInput = $('.usernameInput'); // Input for username
  var $messages = $('.messages'); // Messages area
  var $inputMessage = $('#chatbox'); // Input message input box

  var $loginPage = $('.login.page'); // The login page
  var $chatPage = $('.chat.page'); // The chatroom page

  // Prompt for setting a username
  var username;
  var connected = false;
  var typing = false;
  var lastTypingTime;
  //var $currentInput = $usernameInput.focus();

  var chatQuery = $scope.chatQuery;

 var socket = io();
 startChat();

  $scope.languages = [{ name: "pt", id: 1 }, { name: "en", id: 2 }, { name: "it", id: 3 }, { name: "sp", id: 4 }];
  $scope.selectedOption = $scope.languages[1];

// var socket = io.connect( "http://localhost:3000");

 // var socket = io('//localhost:3000');
 //    socket.on('socketToMe', function (data) {
 //      console.log(data);
 //    });


// $scope.$watch('chatQuery', function() {
//   console.log("making query by watch");
//   // $scope.makequery('/freesound/search/text/?query=' + $scope.query + '&fields=id,name,previews,tags,images,duration,license&filter=license:("Creative Commons 0" OR "Attribution")&page_size=40');
//   //$scope.gifquery('http://api.giphy.com/v1/gifs/search?q='+ $scope.query +'&api_key=E6C8oBZ2WghTaR2HujVpSZJML1fvTpm3&limit=5');

// });


////CHAT

function startChat() {
setUsername();
}

  function addParticipantsMessage (data) {
    var message = ' Welcome, ';
    if (data.numUsers === 1) {

      message += "there's 1 participant";
    } else {

      message += "there are " + data.numUsers + " participants";
    }
    // log(message);
  }

  // Sets the client's username
  function setUsername () {
    //username = cleanInput($usernameInput.val().trim());
    username = Math.floor(Math.random()*100);
    // username = $usernameInput.val();
    console.log(username);

    // If the username is valid
    if (username) {
      $loginPage.fadeOut();
      //console.log("page faded");
      $chatPage.show();
      //$loginPage.off('click');
      //$currentInput = $inputMessage.focus();

      // Tell the server your username
      socket.emit('add user', username);
    }
  }

  // Sends a chat message
  function sendMessage () {
    var message = $inputMessage.val();
    // Prevent markup from being injected into the message
    message = cleanInput(message);
    // if there is a non-empty message and a socket connection
    if (message && connected) {
      $inputMessage.val('');
      addChatMessage({
        username: username,
        message: message
      }, { prepend: false });
      // tell server to execute 'new message' and send along one parameter
      socket.emit('new message', message);
    }
  }

  // Log a message
  function log (message, options) {
    var $el = $('<li>').addClass('log').text(message);
    addMessageElement($el, options);
  }

  // Adds the visual chat message to the message list
  function addChatMessage (data, options) {
    // Don't fade the message in if there is an 'X was typing'
    var $typingMessages = getTypingMessages(data);
    options = options || {};
    if ($typingMessages.length !== 0) {
      options.fade = false;
      $typingMessages.remove();
    }

   var $usernameDiv = $('<span class="username"/>')
      .text(data.username)
      .css('color', getUsernameColor(data.username));
    var $messageBodyDiv = $('<span class="messageBody">');
      // .text(data.message);

    var words = data.message.split(' ');
    for (var i = 0; i < words.length; i++) {
      var $wordDiv = $('<span/>').text(words[i] + " ");
      $messageBodyDiv.append($wordDiv);
      $messageBodyDiv.append($());
    };

    var typingClass = data.typing ? 'typing' : '';
    var $messageDiv = $('<li class="message"/>')
      .data('username', data.username)
      .addClass(typingClass)
      .append($usernameDiv, $messageBodyDiv);

    addMessageElement($messageDiv, options);
    $('.messageBody span').click(function(){
          $('#mainsearch').val(this.textContent);
        $('#mainsearch').change();


        //$scope.query = this.textContent;
        console.log(this.textContent);
      });
  }

  // Adds the visual chat typing message
  function addChatTyping (data) {
    data.typing = true;
    data.message = 'is typing';
    addChatMessage(data, { prepend: false });
  }

  // Removes the visual chat typing message
  function removeChatTyping (data) {
    getTypingMessages(data).fadeOut(function () {
      $(this).remove();
    });
  }

  // Adds a message element to the messages and scrolls to the bottom
  // el - The element to add as a message
  // options.fade - If the element should fade-in (default = true)
  // options.prepend - If the element should prepend
  //   all other messages (default = false)
  function addMessageElement (el, options) {
    var $el = $(el);

    // Setup default options
    if (!options) {
      options = {};
    }
    if (typeof options.fade === 'undefined') {
      options.fade = true;
    }
    if (typeof options.prepend === 'undefined') {
      options.prepend = false;
    }

    // Apply options
    if (options.fade) {
      $el.hide().fadeIn(FADE_TIME);
    }
    if (options.prepend) {
      $messages.prepend($el);
    } else {
      $messages.append($el);
    }
    //$messages[0].scrollTop = $messages[0].scrollHeight;
  }

  // Prevents input from having injected markup
  function cleanInput (input) {
    return $('<div/>').text(input).html();
  }

  // Updates the typing event
  function updateTyping () {
    if (connected) {
      if (!typing) {
        typing = true;
        socket.emit('typing');
      }
      lastTypingTime = (new Date()).getTime();

      setTimeout(function () {
        var typingTimer = (new Date()).getTime();
        var timeDiff = typingTimer - lastTypingTime;
        if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
          socket.emit('stop typing');
          typing = false;
        }
      }, TYPING_TIMER_LENGTH);
    }
  }

  // Gets the 'X is typing' messages of a user
  function getTypingMessages (data) {
    return $('.typing.message').filter(function (i) {
      return $(this).data('username') === data.username;
    });
  }

  // Gets the color of a username through our hash function
  function getUsernameColor (username) {
    // Compute hash code
    var hash = 7;
    for (var i = 0; i < username.length; i++) {
       hash = username.charCodeAt(i) + (hash << 5) - hash;
    }
    // Calculate color
    var index = Math.abs(hash % COLORS.length);
    return COLORS[index];
  }

  // Keyboard events

  $window.keydown(function (event) {


    // Auto-focus the current input when a key is typed
    if (!(event.ctrlKey || event.metaKey || event.altKey)) {
      // $currentInput.focus();
    }
    // When the client hits ENTER on their keyboard
    if (event.which === 13) {
      if (username) {
        sendMessage();
        socket.emit('stop typing');
        typing = false;
      } else {

        //setUsername();
      }
    }
  });

  $inputMessage.on('input', function() {
    updateTyping();
  });

  // Click events

  // Focus input when clicking anywhere on login page
  $loginPage.click(function () {
    // $currentInput.focus();
  });

  // Focus input when clicking on the message input's border
  $inputMessage.click(function () {
    $inputMessage.focus();
  });

  // Socket events

  // Whenever the server emits 'login', log the login message
  socket.on('login', function (data) {
    connected = true;
    // Display the welcome message
    var message = "hello";
    // log(message, {
    //   prepend: false
    // });
    // addParticipantsMessage(data);
  });

  // Whenever the server emits 'new message', update the chat body
  socket.on('new message', function (data) {
    addChatMessage(data, { prepend: false });
  });

  // Whenever the server emits 'user joined', log it in the chat body
  socket.on('user joined', function (data) {
    //log(data.username + ' joined');

    //addParticipantsMessage(data);
  });

  // Whenever the server emits 'user left', log it in the chat body
  socket.on('user left', function (data) {
    //log(data.username + ' left');
    //addParticipantsMessage(data);
    removeChatTyping(data);
  });

  // Whenever the server emits 'typing', show the typing message
  socket.on('typing', function (data) {
    addChatTyping(data);
  });

  // Whenever the server emits 'stop typing', kill the typing message
  socket.on('stop typing', function (data) {
    removeChatTyping(data);
  });

  socket.on('disconnect', function () {
    log('you have been disconnected');
  });

  socket.on('reconnect', function () {
    log('you have been reconnected');
    if (username) {
      socket.emit('add user', username);
    }
  });

  socket.on('reconnect_error', function () {
    log('attempt to reconnect has failed');
  });


/////END OF CHAT


}]);
