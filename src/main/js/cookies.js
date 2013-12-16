angular.module('cookies', ['notifications', 'config'])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider
            .when('/:locale/accept-external-cookies', {templateUrl: 'partials/accept-external-cookies.html'})
    }])
    .controller('CookieController', ['$scope', '$routeParams', 'hasCookie', 'createCookie', CookieController])
    .factory('hasCookie', ['usecaseAdapterFactory', 'restServiceHandler', 'config', HasCookieFactory])
    .factory('createCookie', ['usecaseAdapterFactory', 'restServiceHandler', 'config', CreateCookieFactory])
    .factory('onCookieNotFoundPresenter', ['config', OnCookieNotFoundPresenterFactory])
    .directive('cookiePermissionGranted', CookiePermissionGrantedDirectiveFactory)
    .run(function(topicRegistry, hasCookie, $location, onCookieNotFoundPresenter) {
        topicRegistry.subscribe('i18n.locale', function() {
            topicRegistry.subscribe('app.start', function() {
                var onNotFound = function() {
                    $location.search('redirectUrl', window.location.href);
                    $location.path(localStorage.locale + '/accept-external-cookies');
                };
                hasCookie({}, null, onCookieNotFoundPresenter);
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
            window.location = $routeParams.redirectUrl + '?permissionGranted=true';
        };
        createCookie($scope, onSuccess);
    };
}

function OnCookieNotFoundPresenterFactory(config) {
    return function() {
        window.location = config.baseUri + 'cookie?redirectUrl=' + encodeURIComponent(window.location);
    }
}

function CookiePermissionGrantedDirectiveFactory($location) {
    return {
        restrict: 'E',
        scope: {},
        transclude: true,
        template: '<div ng-show="granted"><ng-include src="\'app/partials/cookies/notification.html\'" /></div>',
        link: function(scope) {
            function init() {
                var granted = $location.$$search.permissionGranted;
                scope.granted = granted == 'true';
            }
            scope.$on('$routeChangeSuccess', function (evt, route) {
                init();
            });
            init();
        }
    }
}