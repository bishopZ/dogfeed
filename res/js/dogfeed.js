angular.module('dogfeed', [
    'ngFeeds',
    'ngSockethubClient',
    'ngSockethubRemoteStorage',
    'ngRemoteStorage',
    'ngMessages'
]).

/**
 * routes
 */
config(['$routeProvider', '$locationProvider',
function ($routeProvider, $locationProvider) {
  //$locationProvider.html5Mode(true);
  $routeProvider.
    when('/', {
      templateUrl: "articles.html"
    }).
    when('/settings/sockethub', {
      templateUrl: "sockethub-settings.html"
    }).
    when('/feeds/add', {
      templateUrl: 'add-feed.html'
    }).
    otherwise({
      redirectTo: "/"
    });
}]).

/**
 * snap.js initialization
 */
run(['$rootScope',
function ($rootScope) {

  $rootScope.snapper = new Snap({
    element: document.getElementById('content'),
    disable: 'right',
    maxPosition: 220
  });

  $(window).on('resize', function () {
      $rootScope.isMobile = matchMedia('(max-width:1024px)').matches;
      $rootScope.isDesktop = !$rootScope.isMobile;
  });

  $(window).on('resize', function () {
    if ($rootScope.isMobile) {
      console.log("ENABLE SNAPPER ");
      $rootScope.snapperDisabled = false;
      $rootScope.snapper.enable();
    } else {
      console.log("DISABLE SNAPPER ");
      $rootScope.snapperDisabled = true;
      $rootScope.snapper.close();
      $rootScope.snapper.disable();
    }
  });
}]).

/**
 * remotestorage config
 */
run(['RemoteStorageConfig',
function (RScfg) {
  RScfg.modules = [
    ['sockethub', 'rw', {'cache': false}],
    ['feeds', 'rw', {'cache': false}],
    ['articles', 'rw', {'cache': false}]
  ];
}]).

/**
 * messages config
 */
run(['MessagesConfig',
function (cfg) {
  cfg.timeout = 15000;
}]).

/**
 * get sockethub settings and try to connect
 */
run(['SockethubBootstrap',
function (SockethubBootstrap) {
  SockethubBootstrap.run({
    // default connection settings, if none found in remoteStorage
    host: 'silverbucket.net',
    port: '443',
    path: '/sockethub',
    tls: true,
    secret: '1234567890'
  });
}]).

/**
 * remoteStorage
 */
run(['SockethubSettings', 'SH', '$rootScope', 'RS', '$timeout',
function (settings, SH, $rootScope, RS, $timeout) {
  if (!RS.isConnected()) {
    $timeout(function () {
      if (!RS.isConnected()) {
        $rootScope.$broadcast('message', {message: 'remotestorage-connect', timeout: false});
      }
    }, 6000);
  }
}]).

/**
 * listeners/emitters
 */
run(['$rootScope', '$location',
function ($rootScope, $location) {
  $rootScope.$on('sockethubSettingsSaved', function() {
    $location.path('/');
  });
}]).

/**
 * filter: urlEncode
 */
filter('urlEncode', [
function() {
  return function (text, length, end) {
    return encodeURIComponent(escape(text));
  };
}]).

/**
 * filter: fromNow (date)
 */
filter('fromNow', [
function() {
  return function (dateString) {
    return new Date(dateString).toDateString(); ///moment(new Date(dateString)).fromNow();
  };
}]).

/**
 * filter: pagination
 */
filter('pagination', [
function() {
  var count = 0;
  var max = 3;
  return function (article) {
    console.log("pagination received: ", article);
    if (!article) { return false; }
    count = count + 1;
    if (count > 10) {
      console.log('pagination returned false');
      return false;
    }
    console.log('pagination returned article: ',article);
    return article;
  };
}]).

///////////////////////////////////////////////////////////////////////////
//
// CONTROLLERS
//
///////////////////////////////////////////////////////////////////////////

/**
 * controller: titlebarCtrl
 */
controller('titlebarCtrl',
['$scope', '$rootScope', 'SockethubSettings', 'RS',
function ($scope, $rootScope, settings, RS) {

  $scope.showFeedList = function () {
    if ($rootScope.snapper.state().state === "left") {
      $rootScope.snapper.close();
    } else {
      $rootScope.snapper.open('left');
    }
  };

  $scope.$watch('settings.connected', function (newVal, oldVal) {
    if (settings.connected) {
      settings.conn.port = Number(settings.conn.port);
      RS.call('sockethub', 'writeConfig', [settings.conn]).then(function () {
        console.log("Sockethub config saved to remoteStorage");
      }, function (err) {
        console.log('Failed saving Sockethub config to remoteStorage: ', err);
      });
    }
  });
}]).

directive('about', [
function () {
  return {
    restrict: 'E',
    templateUrl: 'about.html'
  };
}]);