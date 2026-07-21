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
        })
      .when('/connect', {
            templateUrl: 'parts/connect.html',
            controller: 'queryController'
        })
        .when('/player/:sounds', {
            templateUrl: 'parts/player.html',
            controller: 'queryController'
        })
      .when('/player', {
            templateUrl: 'parts/player.html',
            controller: 'queryController'
        })
      .when('/list', {
            templateUrl: 'parts/list.html',
            controller: 'queryController'
        }).otherwise({
        templateUrl: 'parts/player.html',
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
app.directive('assPlayer', ['$rootScope', '$timeout', function($rootScope, $timeout) {
    return {
        restrict: 'E',
        scope: { 'audiodata': '=' },
        templateUrl: 'parts/ass-player.html',
        link: function($scope, element, attribute) {
            var audiodata = $scope.audiodata;
            var counter = 0;

            // --- 1. INITIAL STATE ---
            $scope.playing = false;
            $scope.seekpos = 0;
            $scope.newloopstart = 0;
            $scope.newloopend = 0;
            $scope.soundspeed = 1;
            $scope.soundvolume = 0.5;
            $scope.soundpan = 0;
            
            // Dynamic IDs
            $scope.windowid = 'imgwindow' + audiodata.playerid;
            $scope.containerid = 'windowcont' + audiodata.playerid;
            $scope.loopstart = 'start' + audiodata.playerid;
            $scope.loopend = 'end' + audiodata.playerid;

            // --- 2. LOGGING HANDLERS ---
            $scope.onplay = function() {
                if (!$scope.loop) $scope.$parent.logger2('played: ' + $scope.freesound.name);
                else { if (counter < 1) $scope.$parent.logger2('looping: ' + $scope.freesound.name); counter++; }
            };
            $scope.onpause = function() { $scope.$parent.logger2('paused: ' + $scope.freesound.name); };

            // --- 3. AUDIO ENGINE ---
            $scope.Sound = function(buffer) {
                $scope.sourceNode = null;

                $scope.play = function() {
                    if (audioCtx.state === 'suspended') audioCtx.resume();
                    $scope.stopNodes(); 

                    $scope.sourceNode = audioCtx.createBufferSource();
                    $scope.panNode = audioCtx.createStereoPanner();
                    $scope.volume = audioCtx.createGain();

                    $scope.sourceNode.connect($scope.panNode);
                    $scope.panNode.connect($scope.volume);
                    $scope.volume.connect(gainNode);

                    $scope.sourceNode.buffer = buffer;
                    
                    var speed = parseFloat($scope.soundspeed) || 1;
                    $scope.sourceNode.playbackRate.value = speed;
                    $scope.volume.gain.value = parseFloat($scope.soundvolume) || 0.5;
                    if ($scope.panNode.pan) $scope.panNode.pan.value = parseFloat($scope.soundpan) || 0;

                    // STRICT BOUNDARIES
                    var offset = parseFloat($scope.seekpos);
                    if (offset < $scope.newloopstart || offset >= $scope.newloopend) {
                        offset = $scope.newloopstart;
                        $scope.seekpos = offset;
                    }

                    var durationToPlay = $scope.newloopend - offset;

                    // Sync hardware clock
                    $scope.startedAt = audioCtx.currentTime - (offset / speed);
                    
                    // start(when, offset, duration)
                    $scope.sourceNode.start(0, offset, Math.max(0, durationToPlay));
                    $scope.playing = true;
                    $scope.onplay();
                };

                $scope.pause = function() {
                    if ($scope.playing) {
                        $scope.seekpos = $scope.getCurrentTime();
                        $scope.playing = false;
                        $scope.stopNodes();
                        $scope.onpause();
                    }
                };

                $scope.stop = function() {
                    $scope.playing = false;
                    $scope.stopNodes();
                    $scope.seekpos = $scope.newloopstart; // Reset to loopstart handle
                };

                $scope.stopNodes = function() {
                    if ($scope.sourceNode) {
                        try { $scope.sourceNode.stop(0); } catch (e) {}
                        $scope.sourceNode.disconnect();
                        $scope.sourceNode = null;
                    }
                };

                $scope.getCurrentTime = function() {
                    if ($scope.playing && $scope.startedAt) {
                        return (audioCtx.currentTime - $scope.startedAt) * (parseFloat($scope.soundspeed) || 1);
                    }
                    return $scope.seekpos;
                };
            };

            // --- 4. LOADING ---
            var req = {
                method: 'GET',
                url: '/freesound/sounds/' + audiodata.id + '/?fields=id,name,previews,images,duration,license,username,url,similar_sounds',
                headers: { 'Content-Type': 'application/json' }
            };

            $.ajax(req).then(function(response) {
                $scope.$apply(function() {
                    $scope.freesound = response;
                    $scope.soundsrc = $scope.freesound.previews['preview-hq-mp3'];
                    $scope.newloopend = $scope.freesound.duration;
                });

                var request = new XMLHttpRequest();
                request.open('GET', $scope.soundsrc, true);
                request.responseType = 'arraybuffer';
                request.onload = function() {
                    audioCtx.decodeAudioData(request.response, function(buffer) {
                        new $scope.Sound(buffer);
                        if (audiodata.newsound === 1) $scope.$apply(function() { $scope.play(); });
                    });
                };
                request.send();
            });

            // --- 5. 10ms OBSERVER LOOP ---
            $scope.cursorInterval = window.setInterval(function() {
                if (!$scope.freesound) return;

                $scope.$apply(function() {
                    if ($scope.playing) {
                        var now = $scope.getCurrentTime();
                        
                        // boundary reached
                        if (now >= $scope.newloopend) {
                            if ($scope.loop && $scope.newloopstart < $scope.newloopend) {
                                $scope.seekpos = $scope.newloopstart;
                                $scope.play(); // Auto loop restart
                            } else {
                                $scope.stop();
                            }
                        } else {
                            $scope.seekpos = now;
                        }
                    } 
                    
                    // Requirement: Handle reset if crossing
                    if ($scope.newloopstart >= $scope.newloopend && $scope.newloopend > 0) {
                        $scope.newloopstart = 0;
                        $('#' + $scope.loopstart).css('left', 0);
                    }
                });
            }, 10);

            // --- 6. DRAG HANDLERS (With Safety Fix for clientWidth) ---
            $scope.setloopstart = function() {
                var el = document.getElementById($scope.loopstart);
                // Use the class to find the container reliably
                var cont = element[0].querySelector('.dragcontainer');
                if (el && cont) {
                    var boxwidth = cont.clientWidth;
                    $scope.newloopstart = (el.offsetLeft * $scope.freesound.duration) / boxwidth;                   
                    console.log("sample start: " + $scope.newloopstart);

                    // Requirement: If not playing, move cursor to loopstart
                    if (!$scope.playing) $scope.seekpos = $scope.newloopstart;
                }
            };

            $scope.setloopend = function() {
                var el = document.getElementById($scope.loopend);
                var cont = element[0].querySelector('.dragcontainer');
                if (el && cont) {
                    var boxwidth = cont.clientWidth;
                    var newEnd = (el.offsetLeft * $scope.freesound.duration) / boxwidth;
                    $scope.newloopend = newEnd;
                    console.log("sample end: " + $scope.newloopend);

                    // Requirement: If playing and end moved after current time, restart to update hardware stop point
                    if ($scope.playing && newEnd > $scope.seekpos) {
                        $scope.play(); 
                    }
                }
            };

            // --- 7. UI HELPERS ---
            $scope.setseek = function(val) {
                $scope.seekpos = parseFloat(val);
                // Requirement: If changing during play, restart play from that point
                if ($scope.playing) $scope.play();
            };

            $scope.playpause = function() { $scope.playing ? $scope.pause() : $scope.play(); };
            $scope.setvolume = function(v) { $scope.soundvolume = v; if($scope.volume) $scope.volume.gain.value = v; };
            $scope.setpan = function(v) { $scope.soundpan = v; if($scope.panNode) $scope.panNode.pan.value = v; };
            $scope.setspeed = function(v) { 
                $scope.soundspeed = v; 
                if($scope.playing) $scope.play(); 
            };
            $scope.removethis = function() { 
                $scope.loop = false; $scope.stop(); 
                $scope.$parent.removeitem(audiodata.playerid); 
            };

            $scope.$on('$destroy', function() { window.clearInterval($scope.cursorInterval); });
        }
    };
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