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
        scope: {
            'audiodata': '='
        },
        templateUrl: 'parts/ass-player.html',
        link: function($scope, element, attribute) {
            var audiodata = $scope.audiodata;
            $scope.silenceTimer = null; 

            // 1. SAFETY: Initialize AudioContext if it doesn't exist
            if (typeof audioCtx === 'undefined') {
                window.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (typeof gainNode === 'undefined') {
                window.gainNode = audioCtx.createGain();
                gainNode.connect(audioCtx.destination);
            }

            var req = {
                method: 'GET',
                url: '/freesound/sounds/' + audiodata.id + '/?fields=id,name,previews,images,duration,license,username,url,similar_sounds',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
            };

            $.ajax(req).then(function(response) {

                $scope.$apply(function() {
                    $scope.freesound = response;
                    $scope.soundsrc = $scope.freesound.previews['preview-hq-mp3'];
                });

                var itemsrc = $scope.freesound.previews['preview-hq-mp3'];
                var divid = 'audio' + audiodata.playerid;

                // INITIAL SETTINGS
                $scope.seekpos = 0;
                $scope.loop = false;
                $scope.newloopstart = 0;
                $scope.newloopend = $scope.freesound.duration;
                $scope.silence = 0;
                $scope.soundvolume = 0.5;
                $scope.soundpan = 0;
                $scope.soundspeed = 1;

                // Load the buffer
                var request = new XMLHttpRequest();
                request.open('GET', itemsrc, true);
                request.responseType = 'arraybuffer';
                request.onload = function() {
                    audioCtx.decodeAudioData(request.response, function(buffer) {
                        // Initialize the Sound object
                        new $scope.Sound(buffer);
                        
                        // Check for autoplay
                        if (audiodata.newsound === 1) {
                            $scope.$apply(function() { $scope.play(); });
                        }
                    });
                };
                request.send();

                $scope.Sound = function(buffer) {
                    $scope.sourceNode = null;

                    $scope.play = function() {
                        // Modern Browsers require resume() on a user gesture
                        if (audioCtx.state === 'suspended') {
                            audioCtx.resume();
                        }

                        // Clear any waiting silence
                        if ($scope.silenceTimer) $timeout.cancel($scope.silenceTimer);

                        $scope.sourceNode = audioCtx.createBufferSource();
                        $scope.panNode = audioCtx.createStereoPanner();
                        $scope.volume = audioCtx.createGain();

                        $scope.sourceNode.connect($scope.panNode);
                        $scope.panNode.connect($scope.volume);
                        $scope.volume.connect(gainNode);

                        $scope.sourceNode.buffer = buffer;
                        
                        // Apply current settings
                        $scope.sourceNode.playbackRate.value = $scope.soundspeed;
                        $scope.volume.gain.value = $scope.soundvolume;
                        $scope.panNode.pan.value = $scope.soundpan;

                        // Calculate timing
                        $scope.offset = $scope.seekpos;
                        if ($scope.offset >= $scope.newloopend) $scope.offset = $scope.newloopstart;
                        
                        var durationToPlay = $scope.newloopend - $scope.offset;
                        
                        $scope.startedAt = audioCtx.currentTime - ($scope.offset / $scope.soundspeed);

                        $scope.sourceNode.start(0, $scope.offset, Math.max(0, durationToPlay));
                        $scope.playing = true;
                        $scope.onplay();

                        $scope.sourceNode.onended = function() {
                            if (!$scope.loop) {
                                $scope.$apply(function() { $scope.stop(); });
                            } else {
                                // LOOP LOGIC WITH SILENCE
                                var loopPartDuration = $scope.newloopend - $scope.newloopstart;
                                var silenceSeconds = ($scope.silence / 100) * loopPartDuration;

                                $scope.$apply(function() {
                                    $scope.playing = false; 
                                    $scope.seekpos = $scope.newloopstart;
                                });

                                // Schedule next play
                                $scope.silenceTimer = $timeout(function() {
                                    $scope.play();
                                }, silenceSeconds * 1000);
                            }
                        };
                    };

                    $scope.pause = function() {
                        if ($scope.playing) {
                            $scope.seekpos = audioCtx.currentTime - $scope.startedAt;
                            $scope.stopNodes();
                            $scope.playing = false;
                            $scope.onpause();
                        }
                    };

                    $scope.stop = function() {
                        if ($scope.silenceTimer) $timeout.cancel($scope.silenceTimer);
                        $scope.stopNodes();
                        $scope.seekpos = $scope.newloopstart;
                        $scope.playing = false;
                    };

                    $scope.stopNodes = function() {
                        if ($scope.sourceNode) {
                            $scope.sourceNode.stop();
                            $scope.sourceNode.disconnect();
                            $scope.sourceNode = null;
                        }
                    };

                    // SLIDERS / CONTROLS
                    $scope.setvolume = function(val) {
                        $scope.soundvolume = val;
                        if ($scope.volume) $scope.volume.gain.value = val;
                    };

                    $scope.setspeed = function(val) {
                        $scope.soundspeed = val;
                        if ($scope.sourceNode) $scope.sourceNode.playbackRate.value = val;
                    };

                    $scope.setpan = function(val) {
                        $scope.soundpan = val;
                        if ($scope.panNode) $scope.panNode.pan.value = val;
                    };

                    $scope.playpause = function() {
                        if ($scope.playing) $scope.pause();
                        else $scope.play();
                    };

                    // CURSOR UPDATER
                    var cursorInterval = setInterval(function() {
                        if ($scope.playing && $scope.sourceNode) {
                            $scope.$apply(function() {
                                // Calculate current position based on speed
                                $scope.seekpos = (audioCtx.currentTime - $scope.startedAt) * $scope.soundspeed;
                            });
                        }
                    }, 50);

                    $scope.$on('$destroy', function() {
                        clearInterval(cursorInterval);
                        if ($scope.silenceTimer) $timeout.cancel($scope.silenceTimer);
                    });
                };

                $scope.onplay = function() { $scope.$parent.logger2('played: ' + $scope.freesound.name); };
                $scope.onpause = function() { $scope.$parent.logger2('paused: ' + $scope.freesound.name); };
                $scope.removethis = function() {
                    $scope.loop = false;
                    $scope.stop();
                    $scope.$parent.removeitem(audiodata.playerid);
                };

            });
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
