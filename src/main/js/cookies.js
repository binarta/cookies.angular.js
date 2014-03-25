angular.module('cookies', ['ngRoute', 'notifications', 'config'])
    .factory('hasCookie', ['usecaseAdapterFactory', 'restServiceHandler', 'config', HasCookieFactory])
    .factory('onCookieNotFoundPresenter', ['config', OnCookieNotFoundPresenterFactory])
    .directive('cookiePermissionGranted', ['$location', '$rootScope', 'topicRegistry', CookiePermissionGrantedDirectiveFactory])
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

function CookiePermissionGrantedDirectiveFactory($location, $rootScope, topicRegistry) {
    return {
        restrict: 'E',
        scope: {},
        transclude: true,
        templateUrl: function () {
            return $rootScope.cookieNoticeTemplateUrl ? $rootScope.cookieNoticeTemplateUrl : 'app/partials/cookies/notification.html'
        },
        link: function(scope) {
            function init() {
                var granted = $location.$$search.permissionGranted;
                scope.granted = granted == 'true';
            }
            scope.$on('$routeChangeSuccess', function (evt, route) {
                init();
            });
            init();

            var putLocalePrefixOnScope = function (locale) {
                scope.localePrefix = locale + '/';
            };

            function subscribeI18nLocale () {
                topicRegistry.subscribe('i18n.locale', putLocalePrefixOnScope);
            }

            topicRegistry.subscribe('config.initialized', function (config) {
                if(config.supportedLanguages) subscribeI18nLocale();
            });

            scope.$on('$destroy', function () {
                topicRegistry.unsubscribe('i18n.locale', putLocalePrefixOnScope);
            });
        }
    }
}