angular.module('cookies', ['ngRoute', 'notifications', 'config'])
    .factory('hasCookie', ['usecaseAdapterFactory', 'restServiceHandler', 'config', HasCookieFactory])
    .factory('onCookieNotFoundPresenter', ['config', OnCookieNotFoundPresenterFactory])
    .directive('cookiePermissionGranted', CookiePermissionGrantedDirectiveFactory)
    .run(function(topicRegistry, hasCookie, $location, onCookieNotFoundPresenter) {
        topicRegistry.subscribe('i18n.locale', function() {
            topicRegistry.subscribe('app.start', function() {
                hasCookie({}, null, onCookieNotFoundPresenter);
            });
        });
    });

function HasCookieFactory(usecaseAdapterFactory, restServiceHandler, config) {
    return function(scope, onSuccess, onNotFound) {
        var ctx = usecaseAdapterFactory(scope);
        ctx.params = {
            method: 'POST',
            url: (config.baseUri || '') + 'api/cookie',
            withCredentials: true
        };
        ctx.success = onSuccess;
        ctx.notFound = onNotFound;
        restServiceHandler(ctx);
    }
}

function OnCookieNotFoundPresenterFactory(config) {
    return function() {
        window.location = (config.baseUri || '') + 'api/cookie?redirectUrl=' + encodeURIComponent(window.location);
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