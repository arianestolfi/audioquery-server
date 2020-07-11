var app = angular.module('app', [
    'ngRoute',
    'ngTouch',
    'ngSanitize'


]).config(function($sceProvider){
    $sceProvider.enabled(false);
    //para permitir links externos
});


function addLeadingZeros (n, length)
{
    var str = (n > 0 ? n : -n) + "";
    var zeros = "";
    for (var i = length - str.length; i > 0; i--)
        zeros += "0";
    zeros += str;
    return n >= 0 ? zeros : "-" + zeros;
}





//testController end

//prevent reloading of page when changing adress
app.run(['$route', '$location', '$rootScope', function ($route, $location, $rootScope) {
        var original = $location.path;
        $location.path = function (path, reload) {
            if (reload === false) {
                var lastRoute = $route.current;
                var un = $rootScope.$on('$locationChangeSuccess', function () {
                    $route.current = lastRoute;
                    un();
                });
            }

            return original.apply($location, [path]);
        };
    }])


app.config(function ($routeProvider, $locationProvider, $httpProvider) {

    $locationProvider.html5Mode(true);
    $routeProvider
    .when('/chat/:rooms/:sounds', {
            templateUrl: 'parts/chat.html',
            controller: 'queryController'
        })
    .when('/chat/:sounds', {
            templateUrl: 'parts/chat.html',
            controller: 'queryController'
        })
      .when('/chat', {
            templateUrl: 'parts/chat.html',
            controller: 'queryController'
        }).when('/connect', {
            templateUrl: 'parts/connect.html',
            controller: 'queryController'
        }).when('/player/:sounds', {
            templateUrl: 'parts/player.html',
            controller: 'queryController'
        })
      .when('/player', {
            templateUrl: 'parts/player.html',
            controller: 'queryController'
        }).otherwise({
        templateUrl: 'parts/list.html',
            controller: 'queryController'
    });

            //$locationProvider.html5Mode(true);

  //headers http
$httpProvider.defaults.useXDomain = true;
$httpProvider.defaults.withCredentials = true;
delete $httpProvider.defaults.headers.common["X-Requested-With"];
$httpProvider.defaults.headers.common["Accept"] = "application/json";
$httpProvider.defaults.headers.common["Content-Type"] = "application/json";

  });

app.directive('ngMain', function() {
  return {

    templateUrl: 'parts/query.html'
    }

});

//custom player for audioquery
app.directive ('assPlayer', ['$rootScope', function($rootScope){

  return {
    restrict: 'E',
    //transclude: true,
    scope: {
      'audiodata' : '='
    },
    templateUrl: 'parts/ass-player.html',
    link: function ($scope, element, attribute) {
      var audiodata = $scope.audiodata;
      // use audiodata.playerid
      var req = {
        method: 'GET', 
        url: '/freesound/sounds/' + audiodata.id + '/?fields=id,name,previews,images,duration,license,username,url,similar_sounds' ,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };

      $.ajax(req).
        then(function(response) {
        // when the response is available

          $scope.$apply(function () {
            $scope.freesound = response;
            $scope.soundsrc = $scope.freesound.previews['preview-hq-mp3'];
            // var sound = ngAudio.load($scope.freesound.previews['preview-hq-mp3']);

          }); 

          var itemid = $scope.freesound.id;
          var itemsrc = $scope.freesound.previews['preview-hq-mp3'];
          //create audio element
          // console.log($scope.audiodata.newsound);
          var itemauthor = $scope.freesound.username;
          var credits = document.createElement("span");
          var license = $scope.freesound.license;
          credits.innerHTML =  'sound: ' + $scope.freesound.name + ' by: ' + itemauthor + '; ';
          
          if (license == "http://creativecommons.org/licenses/by/3.0/") {
                      document.getElementById('sources').appendChild(credits);
          }
          //this has to be replaced
          
          
          var imgid = '#img' + audiodata.playerid;
          var divid = 'audio' + audiodata.playerid;

          $scope.windowid = 'imgwindow' + audiodata.playerid;
          $scope.containerid = 'windowcont' + audiodata.playerid;

          var sound      = document.createElement('audio');

          //drag boxes ids
          $scope.loopstart = 'start' + audiodata.playerid;
          $scope.loopend = 'end' + audiodata.playerid;

          //settings

          //starts at zero
          $scope.seekpos= 0;
          $scope.offset = 0;
          $scope.elapsed = 0;
          //unaware of AudioContext (do webkit audioContext)
          $scope.startedAt = 0;
          $scope.pausedAt = 0;

          //no loop and max coverage
          $scope.loop = false;
          $scope.newloopstart = 0;
          $scope.newloopend = $scope.freesound.duration;

          $scope.soundvolume = 0.5;
          $scope.soundpan = 0;

          $scope.soundspeed = 1;     
          $scope.pitchshifting = false;
          
          speedslider = document.getElementById("speed-" + audiodata.playerid);
          $scope.soundspeed = speedslider.value;

          var request = new XMLHttpRequest();
                request.open('GET', itemsrc, true);
                request.responseType = 'arraybuffer';
                request.addEventListener('load', function() {
                    audioCtx.decodeAudioData(
                        request.response,
                        function(buffer) {

                          //once we have the buffer, create the Sound                            
                          sound = new $scope.Sound(buffer);
                           
                        },
                        function(e) {
                            console.error('ERROR: context.decodeAudioData:', e);
                        }
                    );
                });
                request.send();


          $scope.Sound = function(buffer){

            $scope.sourceNode = null;
            $scope.soundspeed = 1;

            $scope.play =  function() {

              $scope.sourceNode = audioCtx.createBufferSource();

              // $scope.volume = audioCtx.createGain();
              // $scope.sourceNode.connect($scope.volume);

              // $scope.volume.connect(gainNode);
              
              $scope.panNode = audioCtx.createStereoPanner();
              $scope.sourceNode.connect($scope.panNode);

              $scope.volume = audioCtx.createGain();
              $scope.panNode.connect($scope.volume);
              
              $scope.volume.connect(gainNode);


              //console.log(buffer);
              $scope.sourceNode.buffer = buffer;
              $scope.sourceNode.loop = $scope.loop;
              $scope.setspeed($scope.soundspeed);
              $scope.setvolume($scope.soundvolume);
              $scope.offset = $scope.seekpos;
               //console.log($scope.offset + "check offset" );
              $scope.startedAt = audioCtx.currentTime - $scope.offset;
              $scope.timetoend = $scope.newloopend - $scope.offset; 

              //check if this works with the loop
              $scope.sourceNode.start(0, $scope.offset, $scope.timetoend);
              $scope.cursor();
              //console.log("playing");
              $scope.onplay();
              $scope.playing = true;

              $scope.sourceNode.onended = function(event) {

                if (!$scope.loop){

                 $scope.$apply(function () {
                  $scope.stop();
                  });
                } else {

                  $scope.$apply(function () {
                    if ($scope.newloopstart<$scope.newloopend){
                  //$scope.pause();
                  $scope.loopupdate();
                  $scope.offset = $scope.newloopstart;
                  $scope.seekpos = $scope.offset;
                  $scope.play();
                }else{
                  $scope.stop();
                }

                  });
                }

                console.log('ended');
                //console.log($scope.newloopstart);
                //console.log($scope.newloopend);
                
              }              
          };

          $scope.pause = function() {
                    //console.log('started at ' + audioCtx.currentTime);
                      $scope.elapsed = audioCtx.currentTime - $scope.startedAt;

                      $scope.onpause();
                      $scope.stop();
                      $scope.playing = false;

                      $scope.seekpos = $scope.elapsed;
                      //this works fine;
                      //$scope.pausedAt = elapsed;
                      $scope.offset = $scope.elapsed;
                      $scope.cursor();


                  };

                   $scope.stop = function() {
                      if ($scope.sourceNode) {          
                          $scope.sourceNode.disconnect();
                          $scope.sourceNode.stop(0);
                          $scope.sourceNode = null;
                      }
                      $scope.pausedAt = 0;
                      $scope.startedAt = 0;
                      //$scope.offset=0;
                      $scope.offset=$scope.newloopstart;
                      $scope.seekpos = $scope.newloopstart;
                      //$scope.seekpos = 0;

                      $scope.playing = false;
                  };

                  $scope.getPlaying = function() {
                      return $scope.playing;
                  };
                
                  $scope.getCurrentTime = function() {
                      

                      if($scope.offset) {
                          //console.log($scope.offset + "is offset");
                          //return $scope.elapsed;
                          //console.log("offset");
                      //console.log(audioCtx.currentTime - $scope.startedAt + "offset");
                          return audioCtx.currentTime - $scope.startedAt;
                          //return $scope.seekpos;

                      }
                      else if($scope.startedAt) {

                        //when we play
                        //console.log($scope.startedAt + "startedAt");
                        //console.log(audioCtx.currentTime - $scope.startedAt + "return");
                          // var elaps = audioCtx.currentTime - $scope.startedAt;
                          // if (elaps >= $scope.loopend){
                          //   return $scope.loopstart;
                          // }

                          return audioCtx.currentTime - $scope.startedAt;
                          //console.log("started");

                          //return audioCtx.currentTime - $scope.startedAt - $scope.newloopstart;
                      }
                      console.log("else zero");
                      return 0;
                  };



            $scope.loopupdate = function(time){
              if ($scope.sourceNode){
                  
                  $scope.sourceNode.loop = $scope.loop;
                  $scope.sourceNode.loopStart = $scope.newloopstart;
                  $scope.sourceNode.loopEnd = $scope.newloopend;


                
                  console.log("loop updated");
              }
            }

                  $scope.setloopstart = function(){

                    var element = document.getElementById($scope.loopstart);
                    var boxwidth = angular.element(document.getElementById($scope.containerid))[0].clientWidth;
                     //console.log("pix start: " + element.offsetLeft);
                    
                    $scope.newloopstart = element.offsetLeft * $scope.freesound.duration / boxwidth;                   
                    console.log("sample start: " +  $scope.newloopstart);
                
                    $scope.loopupdate();
                    // if ($scope.sourceNode){
                    //   $scope.sourceNode.loopStart = $scope.newloopstart;
                      
                    // }

                  }

                    $scope.setloopend = function(){
                    
                    var element = document.getElementById($scope.loopend);

                    var boxwidth = angular.element(document.getElementById($scope.containerid))[0].clientWidth;
                     //console.log("pix end: " + element.offsetLeft);
                                  
                    

                 
                    $scope.newloopend = element.offsetLeft * $scope.freesound.duration / boxwidth;

                    console.log("sample end: " +  $scope.newloopend);

                    // var timetostop = $scope.newloopend - $scope.seekpos;
                    // $scope.loopupdate(timetostop);
                    // if ($scope.sourceNode){
                    //   $scope.sourceNode.loopEnd = $scope.newloopend;
                      
                    // }
                    

                  }


                
                  ////////////////////////
                  //updates the value of the player with the new value
                  $scope.setseek = function(val){

                    // $scope.offset=val;
                    // console.log($scope.offset);
                    

                    if ($scope.getPlaying()){



                      //$scope.volume.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.05);


                      $scope.pause();

                    $scope.offset=val;

                    // var previousvolume = $scope.volume.gain.value;
                    // console.log(previousvolume);

                   // $scope.volume.gain.exponentialRampToValueAtTime($scope.soundvolume, audioCtx.currentTime + 0.05);

                    

                    $scope.play();

                    }
                    else{
                    $scope.offset=val;

                    }
                    //sound.currentTime=val;
                  }

                  seekslider = document.getElementById("slider-" + audiodata.playerid);
                  //console.log(seekslider);
                  //seekslider.addEventListener("onclick", function(){ seektimeupdate(); });

                  // function seektimeupdate(){

                  // //seekslider = document.getElementById("slider-" + audiodata.playerid);
                  
                  // //console.log(seekslider.value);
                  // // var nt = sound.currentTime;
                  // // seekslider.value = nt;
                  // console.log("timeupdate");
                  // var nt = $scope.getCurrentTime();
                  // console.log(nt);
                  // //seekslider.value = nt;
                  // //console.log(nt);
                  // var curmins = Math.floor(nt / 60);
                  // var cursecs = Math.floor(nt - curmins * 60);
                  // var durmins = Math.floor(getDuration() / 60);
                  // var dursecs = Math.floor(getDuration() - durmins * 60);
                  // if(cursecs < 10){ cursecs = "0"+cursecs; }
                  // if(dursecs < 10){ dursecs = "0"+dursecs; }
                  // if(curmins < 10){ curmins = "0"+curmins; }
                  // if(durmins < 10){ durmins = "0"+durmins; }
            
                  // }
                  /////////////////////

                  

                
                  $scope.getDuration = function() {
                    return buffer.duration;
                  };

                  $scope.setvolume = function(val){
                  //$scope.sourceNode.volume = val;
                   if ($scope.sourceNode){
                    $scope.volume.gain.value = val;
                    }
                    else {
                      //$scope.playpause();
                      $scope.soundvolume = val;
                    }
                    
                    //gainNode.gain.value = val;
                    borderval = val + 'px';

                  }

                    $scope.setpan = function(val){
                  //$scope.sourceNode.volume = val;
                   if ($scope.sourceNode){
                    $scope.panNode.pan.value = val;
                    console.log(val)
                    }
                    else {
                      //$scope.playpause();
                      $scope.soundpan = val;
                    }
                    
                    //gainNode.gain.value = val;
                    borderval = val + 'px';

                  }

                    
              // $scope.pan = $scope.panNode.pan.setValueAtTime(panControl.value, audioCtx.currentTime);
              

                  $scope.setspeed = function(val){
                    if ($scope.sourceNode){
                    $scope.sourceNode.playbackRate.value = val;
                    }
                    else {

                      $scope.soundspeed = val;
                      //console.log("you have to play first");
                    }
                  }



                  $scope.playpause = function(){
                    if ($scope.getPlaying()) {
                      $scope.pause();
                      $scope.playing = false;

                    } else {

                      $scope.play();
                      $scope.playing = true;
                      $scope.loopupdate();
                                                

                      
                    }
                  }

               

                  if (audiodata.newsound === 1) {
                    //sound.autoplay = 'autoplay';
                    //play the sound invoking the playsound function
                    //$scope.isPlaying = true;
                    $scope.playing = false;



                     $scope.$apply(function () {

                      $scope.playpause();
                      $scope.playing = true;
                    });

                    //$scope.playing = false;
                    

                    
                  }
                  counter=0;

                   // put element on playlist
                  document.getElementById(divid).appendChild(sound);

                }

              var init = function (buffer){
                //console.log(buffer);
                
                //$scope.playing=true;
              }

  

          $scope.onplay = function() {


            //$scope.cursor();

            if(!$scope.loop){

              $scope.$parent.logger2('played: ' + $scope.freesound.name);
               // window.setInterval(function() {

               //    $scope.$apply(function () {
               //          $scope.seekpos = $scope.getCurrentTime();
               //          });
               //          //console.log('hi' + $scope.timenow);
               //        }, 100); 
              //console.log("currentTime" + $scope.getCurrentTime());
            }
            else{
              if(counter<1){
                $scope.$parent.logger2('looping: ' + $scope.freesound.name);
                 // window.setInterval(function() {

                 //  $scope.$apply(function () {
                 //        $scope.seekpos = $scope.getCurrentTime();
                 //        });
                 //        //console.log('hi' + $scope.timenow);
                 //      }, 100); 
                //console.log("currentTime" + $scope.getCurrentTime());
              }
              counter++;
              //console.log("currentTime" + $scope.getCurrentTime());
            }


            // $scope.$apply(function () {
            //   $scope.seekpos = $scope.getCurrentTime();
              
            // });
          }

          $scope.onpause = function() {
              $scope.$parent.logger2('paused: ' + $scope.freesound.name);
              //$scope.cursor();
          }

          $scope.removethis = function() {
          //$scope.$parent.sounds.splice(index, 1);
          //$scope.pause();
          //line inserted to corret problem of removing during loop
          $scope.loop = false;
          $scope.stop();
          $scope.$parent.removeitem(audiodata.playerid);
          $scope.$parent.logger2('removed: ' + $scope.freesound.name);
          
        }

       


          $scope.updateSeek = function() {
            if ($scope.sourceNode){

              
              $scope.$apply(function () {
                $scope.seekpos = $scope.elapsed;
              });
            // $scope.seekpos = $scope.getCurrentTime();
            }
            else{

             }
          }

      $scope.cursor = function() {
        window.setInterval(function() {
            if ($scope.sourceNode){
              if ($scope.seekpos<$scope.newloopend){
                  $scope.$apply(function () {
                    $scope.seekpos = $scope.getCurrentTime();
                    // $scope.updateSeek();
                    });
                  //console.log($scope.getCurrentTime() + "currentTime");
              }else if ($scope.seekpos >= $scope.newloopend && !$scope.loop){

                $scope.stop();
                //$scope.offset = $scope.newloopstart;
                $scope.$apply(function () {
                //$scope.seekpos = $scope.newloopstart;
                  console.log("do something");

                });
              }
              else if ($scope.seekpos >= $scope.newloopend && $scope.loop){
                 $scope.stop();

                 // console.log("do something");
                //$scope.offset = $scope.newloopstart;
                if ($scope.newloopstart>= $scope.newloopend){
                  $scope.$apply(function () {    
                  $scope.newloopstart=0;
                  // $scope.seekpos=$scope.newloopstart;
                  $scope.loopupdate();
                  });
                }
                $scope.$apply(function () {
                //$scope.seekpos = $scope.newloopstart;
                  console.log("do something");
                  // $scope.pause();
                  $scope.loopupdate();
                  $scope.offset = $scope.newloopstart;
                  $scope.seekpos = $scope.offset;
                   $scope.play();
                });
              }
          }else{

            if ($scope.newloopstart >= $scope.newloopend){
            console.log("no sourceNode");
              $scope.$apply(function () {

                $('.loopstart').css('position', 'absolute');
                $('.loopstart').css('left', 0); //or wherever you want it

                $scope.newloopstart = 0;
                $scope.seekpos = 0;
 
                });
            }
          }
                      
        }, 1);

        }



        $scope.getmousex = function(e){
                      
          var cont = document.getElementById("img" + $scope.containerid);
          var mybox = cont.clientWidth;
          console.log(mybox + "mybox");
          //$scope.pause();
          $scope.newoffset = (e.pageX - cont.offsetLeft)* $scope.freesound.duration / mybox;
          console.log("seek: " +  $scope.newoffset);
          //$scope.play();

      }


//search similar sounds
       
       $scope.searchsimilar = function(idsom){

        //$rootscope.makequery('teste');
        console.log('aqui')
       }




      }, function(response) {
        // error.
        //ok
      });

    },

  }
}]);



app.directive('resizable', function(){

    var resizableConfig = {containment: ".imgcontainer"};
    var draggableConfig = {containment: ".imgcontainer"};

    //console.log(jQuery.ui);


    return {
        restrict: 'A',
        scope: {
            callback: '&onResize'
        },
        link: function postLink(scope, elem) {
            elem.resizable(resizableConfig);
            elem.draggable(draggableConfig);
            elem.on('resizestop', function () {
                if (scope.callback) scope.callback();
            });
        }
    };


});


app.directive('audiosource', function(){
});

app.directive('dragMe', function() {
  return {
    restrict: 'A',
    link: function(scope, elem, attr, ctrl) {
      elem.draggable({containment:'parent', axis: 'x'});
      //elem.resizable({containment:'parent'});
    }
  };
});



app.directive('ngMain2', function() {
  return {
    templateUrl: 'parts/query.html'
  }
});

app.filter('reverse', function() {
  return function(items) {
    return items.slice().reverse();
  };
});

app.filter('numberFixedLen', function () {
    return function (a, b) {
        return (1e4 + a + "").slice(-b)
    }
});

app.filter('shortnum', function () {
    return function (a, b) {
        return (1e4 + a + "").slice(-b)
    }
});

app.filter('sectime', [function() {
    return function(seconds) {
        return new Date(1970, 0, 1).setSeconds(seconds);
    };
}])

app.filter('tostring', function() {
  return function(a) {
    return a.toString();
  };
});

app.filter('numberStr', function () {
    return function (string) {
        parseInt(number);
    }
});

app.filter('rawHtml', ['$sce', function($sce){
  return function(val) {
    return $sce.trustAsHtml(val);
  };
}]);

app.filter('reverse', function() {
  return function(items) {
    return items.slice().reverse();
  };
});


app.filter('array', function() {
  return function(items) {
    var filtered = [];
    angular.forEach(items, function(item) {
      filtered.push(item);
    });
   return filtered;
  };
});

app.filter("trustUrl", ['$sce', function ($sce) {
return function (recordingUrl) {
return $sce.trustAsResourceUrl(recordingUrl);
};
}]);


app.filter('urlnode', function(){
  return function(item) {
    var str = item;
 str.replace("http://freesound.org/apiv2/", "/freesound/");
  };
});

function findinarray(arraytosearch, key, valuetosearch) {

    for (var i = 0; i < arraytosearch.length; i++) {

    if (arraytosearch[i][key] == valuetosearch) {
    return i;
    }
    }
    return null;
    }
