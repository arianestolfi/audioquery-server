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
            var audioBuffer = null; 
            var slider = null; 

            // --- 1. INITIAL STATE ---
            $scope.playing = false;
            $scope.seekpos = 0;
            $scope.newloopstart = 0;
            $scope.newloopend = 0;
            $scope.soundspeed = 1;
            $scope.soundvolume = 0.5;
            $scope.soundpan = 0;
            $scope.soundfilter = 0;
            $scope.silenceActive = false;
            $scope.imgWidthStyle = '100%';
            $scope.totalVirtualDuration = 0;

            $scope.loopstart = 'start' + audiodata.playerid;
            $scope.loopend = 'end' + audiodata.playerid;
            $scope.containerid = 'windowcont' + audiodata.playerid;

            $timeout(function() {
                slider = document.getElementById("slider-" + audiodata.playerid);
            });

            // --- 2. IMAGE CLICK / JUMP LOGIC ---
            $scope.imgClick = function(e) {
                // Prevent jump if clicking on the draggable handles themselves
                if (e.target.classList.contains('draggable') || e.target.classList.contains('pointer')) {
                    return;
                }

                var cont = element[0].querySelector('.imgcontainer');
                if (cont) {
                    var rect = cont.getBoundingClientRect();
                    var x = e.clientX - rect.left; // Pixel position of click
                    var width = rect.width;
                    
                    // Map pixel to the total virtual timeline
                    var newTime = (x / width) * $scope.totalVirtualDuration;
                    
                    // Use existing setseek to handle audio restart
                    $scope.setseek(newTime);
                }
            };

            // --- 3. FILTER LOGIC ---
            $scope.setfilter = function(value) {
                $scope.soundfilter = parseFloat(value);
                var minFreq = 100, midFreq = 1000, maxFreq = 12000;
                var logMin = Math.log10(minFreq), logMax = Math.log10(maxFreq);
                var freq, type;
                var normValue = $scope.soundfilter / 100;
                if (Math.abs(normValue) < 0.01) { type = 'allpass'; freq = midFreq; } 
                else if (normValue < 0) {
                    var t = Math.pow(Math.abs(normValue), 2);
                    freq = Math.pow(10, logMax - t * (logMax - logMin));
                    type = 'lowpass';
                } else {
                    var t = Math.pow(Math.abs(normValue), 2);
                    freq = Math.pow(10, logMin + t * (logMax - logMin));
                    type = 'highpass';
                }
                $scope.filterFreqDisplay = freq;
                $scope.filterType = type;
                if ($scope.filterNode) {
                    $scope.filterNode.type = type;
                    $scope.filterNode.frequency.setTargetAtTime(freq, audioCtx.currentTime, 0.02);
                }
            };

            // --- 4. AUDIO ENGINE ---
            $scope.stopNodes = function() {
                if ($scope.sourceNode) {
                    var now = audioCtx.currentTime;
                    if ($scope.rampGain) {
                        $scope.rampGain.gain.cancelScheduledValues(now);
                        $scope.rampGain.gain.setValueAtTime($scope.rampGain.gain.value, now);
                        $scope.rampGain.gain.linearRampToValueAtTime(0, 0.005);
                    }
                    try { $scope.sourceNode.stop(now + 0.006); } catch (e) {}
                    $scope.sourceNode = null;
                }
            };

            $scope.play = function() {
                if (!audioBuffer) return;
                if (audioCtx.state === 'suspended') audioCtx.resume();
                $scope.stopNodes();

                var offset = parseFloat($scope.seekpos);
                if (offset < $scope.newloopstart || offset >= $scope.newloopend) {
                    offset = $scope.newloopstart;
                    $scope.seekpos = offset;
                }

                if (offset < $scope.freesound.duration) {
                    $scope.sourceNode = audioCtx.createBufferSource();
                    $scope.panNode = audioCtx.createStereoPanner();
                    $scope.filterNode = audioCtx.createBiquadFilter();
                    $scope.rampGain = audioCtx.createGain();

                    $scope.sourceNode.connect($scope.panNode);
                    $scope.panNode.connect($scope.filterNode);
                    $scope.filterNode.connect($scope.rampGain);
                    $scope.rampGain.connect(gainNode);

                    $scope.sourceNode.buffer = audioBuffer;
                    var speed = parseFloat($scope.soundspeed) || 1;
                    var physicalEnd = Math.min($scope.newloopend, $scope.freesound.duration);
                    var durationToPlay = physicalEnd - offset;

                    $scope.setfilter($scope.soundfilter);
                    if ($scope.panNode.pan) $scope.panNode.pan.value = parseFloat($scope.soundpan) || 0;
                    $scope.sourceNode.playbackRate.value = speed;

                    var now = audioCtx.currentTime;
                    $scope.rampGain.gain.setValueAtTime(0, now);
                    $scope.rampGain.gain.linearRampToValueAtTime(parseFloat($scope.soundvolume), now + 0.005);
                    
                    var timeUntilEnd = durationToPlay / speed;
                    if (timeUntilEnd > 0.005) {
                        $scope.rampGain.gain.setValueAtTime(parseFloat($scope.soundvolume), now + timeUntilEnd - 0.005);
                        $scope.rampGain.gain.linearRampToValueAtTime(0, now + timeUntilEnd);
                    }
                    $scope.sourceNode.start(now, offset, Math.max(0, durationToPlay));
                }

                $scope.startedAt = audioCtx.currentTime - (offset / (parseFloat($scope.soundspeed) || 1));
                $scope.playing = true;
                if($scope.onplay) $scope.onplay();
            };

            $scope.pause = function() {
                if ($scope.playing) {
                    $scope.seekpos = $scope.getCurrentTime();
                    $scope.playing = false;
                    $scope.stopNodes();
                    if($scope.onpause) $scope.onpause();
                }
            };

            $scope.stop = function() {
                audiodata.newsound = 0;
                $scope.playing = false;
                $scope.stopNodes();
                $scope.seekpos = $scope.newloopstart;
                if (slider) slider.value = $scope.newloopstart;
            };

            $scope.getCurrentTime = function() {
                if ($scope.playing && $scope.startedAt) {
                    return (audioCtx.currentTime - $scope.startedAt) * (parseFloat($scope.soundspeed) || 1);
                }
                return $scope.seekpos;
            };

            // --- 5. SYNC OBSERVER ---
            $scope.cursorInterval = window.setInterval(function() {
                if (!$scope.freesound) return;
                if ($scope.playing) {
                    var now = $scope.getCurrentTime();
                    if (slider) slider.value = now;
                    if (now >= $scope.newloopend) {
                        $scope.$apply(function() {
                            if ($scope.loop && $scope.newloopstart < $scope.newloopend) {
                                $scope.seekpos = $scope.newloopstart;
                                $scope.play(); 
                            } else {
                                $scope.stop();
                            }
                        });
                    } else {
                        $scope.seekpos = now;
                        $scope.$applyAsync(); 
                    }
                }
            }, 16);

            // --- 6. DRAG HANDLERS ---
            $scope.repositionHandlesVisual = function() {
                var cont = element[0].querySelector('.dragcontainer');
                if (!cont) return;
                var W = cont.clientWidth;
                var left1 = ($scope.newloopstart / $scope.totalVirtualDuration) * W;
                var left2 = (($scope.newloopend / $scope.totalVirtualDuration) * W) - 10;
                $('#' + $scope.loopstart).css('left', left1 + 'px');
                $('#' + $scope.loopend).css('left', left2 + 'px');
            };

            $scope.setloopstart = function() {
                var el = document.getElementById($scope.loopstart);
                var cont = element[0].querySelector('.dragcontainer');
                if (el && cont) {
                    var newVal = (el.offsetLeft * $scope.totalVirtualDuration) / cont.clientWidth;
                    if (newVal > $scope.freesound.duration) {
                        newVal = $scope.freesound.duration;
                        $(el).css('left', ((newVal / $scope.totalVirtualDuration) * cont.clientWidth) + 'px');
                    }
                    $scope.newloopstart = newVal;
                    if (!$scope.playing) {
                        $scope.seekpos = $scope.newloopstart;
                        if (slider) slider.value = $scope.seekpos;
                    }
                }
            };

            $scope.setloopend = function() {
                var el = document.getElementById($scope.loopend);
                var cont = element[0].querySelector('.dragcontainer');
                if (el && cont) {
                    $scope.newloopend = ((el.offsetLeft + 10) * $scope.totalVirtualDuration) / cont.clientWidth;
                    if ($scope.playing && $scope.newloopend > $scope.seekpos) $scope.play(); 
                }
            };

            $scope.setseek = function(val) {
                $scope.seekpos = parseFloat(val);
                if (slider) slider.value = $scope.seekpos;
                if ($scope.playing) $scope.play();
                $scope.$applyAsync();
            };

            // --- 7. SILENCE TOGGLE ---
            $scope.addsilence = function() {
                $scope.silenceActive = true;
                $scope.totalVirtualDuration = $scope.freesound.duration * 2;
                $scope.imgWidthStyle = '50%';
                $scope.repositionHandlesVisual();
                if (!$scope.playing) $scope.seekpos = $scope.newloopstart;
            };

            $scope.removesilence = function() {
                $scope.silenceActive = false;
                $scope.totalVirtualDuration = $scope.freesound.duration;
                $scope.imgWidthStyle = '100%';
                if ($scope.newloopend > $scope.freesound.duration) $scope.newloopend = $scope.freesound.duration;
                if ($scope.newloopstart > $scope.freesound.duration) $scope.newloopstart = $scope.freesound.duration;
                $scope.repositionHandlesVisual();
                if (!$scope.playing) $scope.seekpos = $scope.newloopstart;
            };

            // --- 8. INITIAL LOAD ---
            $.ajax({
                method: 'GET',
                url: '/freesound/sounds/' + audiodata.id + '/?fields=id,name,previews,images,duration,license,username,url,similar_sounds',
                headers: { 'Content-Type': 'application/json' }
            }).then(function(response) {
                $scope.$apply(function() {
                    $scope.freesound = response;
                    $scope.soundsrc = $scope.freesound.previews['preview-hq-mp3'];
                    $scope.newloopend = $scope.freesound.duration;
                    $scope.totalVirtualDuration = $scope.freesound.duration;
                });
                var request = new XMLHttpRequest();
                request.open('GET', $scope.soundsrc, true);
                request.responseType = 'arraybuffer';
                request.onload = function() {
                    audioCtx.decodeAudioData(request.response, function(buffer) {
                        audioBuffer = buffer;
                        if (audiodata.newsound === 1) $scope.$apply(function() { $scope.play(); });
                    });
                };
                request.send();
            });

            // UI Actions
            $scope.onplay = function() {
                if (!$scope.loop) $scope.$parent.logger2('played: ' + $scope.freesound.name);
                else { if (counter < 1) $scope.$parent.logger2('looping: ' + $scope.freesound.name); counter++; }
            };
            $scope.onpause = function() { if ($scope.$parent.logger2) $scope.$parent.logger2('paused: ' + $scope.freesound.name); };
            $scope.playpause = function() { $scope.playing ? $scope.pause() : $scope.play(); };
            $scope.setvolume = function(v) { $scope.soundvolume = v; };
            $scope.setpan = function(v) { $scope.soundpan = v; if($scope.panNode) $scope.panNode.pan.value = v; };
            $scope.setspeed = function(v) { $scope.soundspeed = v; if($scope.playing) $scope.play(); };
            $scope.removethis = function() { $scope.loop = false; $scope.stop(); $scope.$parent.removeitem(audiodata.playerid); };

            $scope.$on('stopAllSounds', function() {
                $scope.stop();
                $scope.$applyAsync();
            });

            $scope.$on('$destroy', function() { window.clearInterval($scope.cursorInterval); });
        }
    };
}]);

app.directive('dragMe', function() {
    return {
        restrict: 'A',
        link: function(scope, elem) {
            elem.draggable({
                containment: 'parent',
                axis: 'x',
                stop: function() { scope.$apply(); }
            });
        }
    };
});

app.directive('dragMe', function() {
    return {
        restrict: 'A',
        link: function(scope, elem) {
            elem.draggable({
                containment: 'parent',
                axis: 'x',
                stop: function() { scope.$apply(); }
            });
        }
    };
});



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