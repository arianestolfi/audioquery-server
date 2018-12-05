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
      .
    when('/chat', {
            templateUrl: 'parts/chat.html',
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
        url: '/freesound/sounds/' + audiodata.id + '/?fields=id,name,previews,images,duration,license,username,url' ,
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
          var sound      = document.createElement('audio');

          var buffers = [];
          //var source   = audioCtx.createBufferSource();
          var response ;
          var imgid = '#img' + audiodata.playerid;
          var divid = 'audio' + audiodata.playerid;
          // var requests = [];
          // var myBuffer;
          // var msource;




          $scope.loop = false;
          $scope.soundvolume = 1;
          $scope.soundspeed = 1;
          $scope.isPlaying = false;
          $scope.seekpos = 0;
          if (sound.currentTime){
            $scope.seekpos = sound.currentTime;
          };
          $scope.durationMax = sound.duration;


          var myBuffer;
          var msource;

          $scope.windowid = 'imgwindow' + audiodata.playerid;
          $scope.containerid = 'windowcont' + audiodata.playerid;


          console.log($scope.windowid);
          console.log($scope.containerid);


          sound.crossOrigin = "anonymous";
          sound.id       = 'aud' + audiodata.playerid;
          sound.preload = 'preload';
          // sound.controls = 'controls';
          // sound.loop = 'loop';
          sound.src      = itemsrc;
          sound.type     = 'audio/mpeg';

          $scope.isPlaying = false;

          //$scope.isPlaying = sound.isPlaying;
   
          // buffer stuff
          ////////////////////////////////////////////////
          $scope.buffersound = function(){
            //do the request for the sound
            var request = new XMLHttpRequest();
            request.open("GET", itemsrc, true);
            request.responseType = "arraybuffer";

            request.onload = function() {
            audioCtx.decodeAudioData(request.response, function(buffer) {
                    if (!buffer) {
                        alert('error decoding file data: ' + itemsrc);
                        return;
                    }
                    // loader.bufferList[index] = buffer;
                    // if (++loader.loadCount == loader.urlList.length)
                    //     loader.onload(loader.bufferList);
                    // console.log(buffer);
                    // msource.buffer = buffer;
                    // console.log(buffer.length);

                    // myBuffer = buffer;
                    // msource = audioCtx.createBufferSource();
                    // myBuffer.start(0);
                    // myBuffer.loop;

                    response = request.response;
                    // console.log(response);
                    // here we create copies

                    var source   = audioCtx.createBufferSource();
                    source.buffer = buffer;
                    buffers.push(source.buffer);
                    console.log(buffers);


                    //console.log(source.buffer);
                    //source.connect(gainNode);
                    


                    // msource.buffer = myBuffer;
                    // msource.connect(gainNode);


                }    
              );
            }

            request.onerror = function() {
              alert('BufferLoader: XHR error');        
            } 

            request.send();
            // console.log(myBuffer);
            //////////////////////////////////

          }

          

          

          // put element on playlist
          document.getElementById(divid).appendChild(sound);

          if (audiodata.newsound === 1) {
            sound.autoplay = 'autoplay';
            $scope.isPlaying = true;
            $scope.buffersound;
          }
          counter=0;

          sound.onplay = function() {
            if(!$scope.loop){
              $scope.$parent.logger2('played: ' + $scope.freesound.name);
            }
            else{
              if(counter<1){
                $scope.$parent.logger2('looping: ' + $scope.freesound.name);
              }
              counter++;
            }

        $scope.$apply(function () {
          $scope.seekpos = sound.currentTime;
        })


          }

          sound.onpause = function() {
              $scope.$parent.logger2('paused: ' + $scope.freesound.name);
          }

          $scope.$watch('loop', function(newValue, oldValue) {
          // if (newValue)
          //   console.log($scope.loop.booleanVal);
            sound.addEventListener('ended', function() {
              if ($scope.loop.booleanVal) {

                this.currentTime = 0;
                $scope.isPlaying = false;
                $scope.playsound();
                // sound.play();
                
              }
              else{
               
               //console.log($scope.loop.booleanVal);
                // sound.pause();
                this.currentTime = 0;

                 $scope.playsound();
                 // sound.pause();
                
                $scope.$parent.logger2('loopstop: ' + $scope.freesound.name);
                counter=0;
              }
              return $scope.isPlaying; 

          }, false);
        }, true);



        $scope.playsound = function() {

         if ($scope.isPlaying){
          sound.pause();
          $scope.isPlaying = false;
          console.log('play' + $scope.isPlaying);
          }
          else{

            var playPromise = sound.play();
             $scope.isPlaying = true;

            if (playPromise !== undefined) {
                playPromise.then(_ => {

                // $scope.isPlaying = true;
                console.log('play' + $scope.isPlaying);
      
            // Automatic playback started!
            // Show playing UI.
            })
            .catch(error => {
            // Auto-play was prevented
            // Show paused UI.
            });
            }
          }

          // source.start(0);
          // itemsrc.start(0);
        }  


      //   $scope.playsound = function() {

          
      //     var playPromise = sound.play();

      //     if (playPromise !== undefined) {
      //         playPromise.then(_ => {

      //         if ($scope.isPlaying){
      //           sound.pause();
      //           $scope.isPlaying = false;
      //       console.log('pause' + $scope.isPlaying);
            

      //     }
      //     else {
      //         //sound.play();
      //         $scope.isPlaying = true;
      //         console.log('hu');

      //     }
      // // Automatic playback started!
      // // Show playing UI.
      //     })
      //     .catch(error => {
      // // Auto-play was prevented
      // // Show paused UI.
      //     });
      //     }



      //     // source.start(0);
      //     // itemsrc.start(0);
      //   }  


        $scope.setvolume = function(val){
          // console.log($scope.soundvolume);
          // source.volume = val;

          sound.volume = val;
          // console.log(sound.volume);
          // msource.volume = val;
          borderval = val + 'px';

        }

        $scope.setspeed = function(val){
          // console.log($scope.soundspeed);
          // source.playbackRate = 1/val;
          sound.playbackRate = 1/val;
          // msource.playbackRate = 1/val;
          // borderval = val + 'px';

        }

        $scope.stopsound = function(){
          
          $scope.isPlaying = false;
          sound.pause();
          sound.currentTime = 0;
          // msource.playbackRate = 1/val;
          // borderval = val + 'px';

        }

        seekslider = document.getElementById("slider-" + audiodata.playerid);

        sound.addEventListener("timeupdate", function(){ seektimeupdate(); });

        $scope.setseek = function(val){

          sound.currentTime=val;

        }


        function seektimeupdate(){

        seekslider = document.getElementById("slider-" + audiodata.playerid);
        
        var nt = sound.currentTime;
        seekslider.value = nt;
        //console.log(nt);
        var curmins = Math.floor(sound.currentTime / 60);
        var cursecs = Math.floor(sound.currentTime - curmins * 60);
        var durmins = Math.floor(sound.duration / 60);
        var dursecs = Math.floor(sound.duration - durmins * 60);
        if(cursecs < 10){ cursecs = "0"+cursecs; }
        if(dursecs < 10){ dursecs = "0"+dursecs; }
        if(curmins < 10){ curmins = "0"+curmins; }
        if(durmins < 10){ durmins = "0"+durmins; }
  
  }

         $scope.$watch('sound.currentTime', function(newValue, oldValue) {
        //if (newValue)
        //   //   console.log($scope.loop.booleanVal);
        //   $scope.seekpos = sound.currentTime;
        $('#')
        console.log(newValue);
        });


        $scope.removethis = function() {
          //$scope.$parent.sounds.splice(index, 1);
          $scope.$parent.removeitem(audiodata.playerid);
          $scope.$parent.logger2('removed: ' + $scope.freesound.name);
        }



        // console.log(msource.buffer);
        //           // msource.buffer = buffer;
        // console.log(msource.buffer.length);

        //console.log($scope.loop);

        
///
        // console.log(itemsrc);

      // var mySource = audioCtx.createBufferSource();
    // myBuffer.start(0);
    // myBuffer.loop;
      // mySource.connect(gainNode);

        var msource = audioCtx.createMediaElementSource(sound);
        
        msource.connect(gainNode);
        sources.push(msource);
        //sources.push(source);
        

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
      elem.draggable({containment:'parent'});
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
