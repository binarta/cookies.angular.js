angular.module('cookies', ['notifications', 'config'])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider
            .when('/:locale/accept-external-cookies', {templateUrl: 'partials/accept-external-cookies.html'})
    }])
    .controller('CookieController', ['$scope', '$routeParams', 'hasCookie', 'createCookie', CookieController])
    .controller('CookieRedirectController', ['$scope', 'config', '$location', CookieRedirectController])
    .factory('hasCookie', ['usecaseAdapterFactory', 'restServiceHandler', 'config', HasCookieFactory])
    .factory('createCookie', ['usecaseAdapterFactory', 'restServiceHandler', 'config', CreateCookieFactory])
    .run(function(topicRegistry, hasCookie, $location) {
        topicRegistry.subscribe('i18n.locale', function() {
            topicRegistry.subscribe('app.start', function() {
                var onNotFound = function() {
                    $location.search('redirectUrl', window.location.href);
                    $location.path(localStorage.locale + '/accept-external-cookies');
                };
                hasCookie({}, null, onNotFound);
            });
        });
    });

function HasCookieFactory(usecaseAdapterFactory, restServiceHandler, config) {
    return function(scope, onSuccess, onNotFound) {
        var ctx = usecaseAdapterFactory(scope);
        ctx.params = {
            method: 'GET',
            url: (config.baseUri || '') + 'api/cookie',
            withCredentials: true
        };
        ctx.success = onSuccess;
        ctx.notFound = onNotFound;
        restServiceHandler(ctx);
    }
}

function CreateCookieFactory(usecaseAdapterFactory, restServiceHandler, config) {
    return function(scope, onSuccess) {
        var ctx = usecaseAdapterFactory(scope);
        ctx.params = {
            method: 'PUT',
            url: (config.baseUri || '' ) + 'api/cookie'
        };
        ctx.success = onSuccess;
        restServiceHandler(ctx);
    }
}

function CookieController($scope, $routeParams, hasCookie, createCookie) {
    $scope.init = function() {
        var onSuccess = function() {
            $scope.granted = true;
        };
        hasCookie($scope, onSuccess);
    };

    $scope.submit = function() {
        var onSuccess = function() {
            window.location = $routeParams.redirectUrl;
        };
        createCookie($scope, onSuccess);
    };
}

function CookieRedirectController($scope, config, $location) {
    $scope.redirect = function() {
        window.location = config.baseUri + 'cookie?redirectUrl=' + encodeURIComponent($location.search().redirectUrl);
    }
}