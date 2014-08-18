angular.module('cookies', ['ngRoute', 'notifications', 'config'])
    .factory('hasCookie', ['usecaseAdapterFactory', 'restServiceHandler', 'config', HasCookieFactory])
    .factory('onCookieNotFoundPresenter', ['config', OnCookieNotFoundPresenterFactory])
    .directive('cookiePermissionGranted', ['$location', 'ngRegisterTopicHandler', 'config', 'binTemplate', CookiePermissionGrantedDirectiveFactory])
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

function CookiePermissionGrantedDirectiveFactory($location, ngRegisterTopicHandler, config, binTemplate) {
    return {
        restrict: 'E',
        scope: true,
        template: '<div ng-include="templateUrl"></div>',
        link: function(scope) {
            function init() {
                if($location.$$search.permissionGranted == 'true') {
                    binTemplate.setTemplateUrl({
                        scope: scope,
                        module: 'cookies',
                        name: 'cookie-notice.html'
                    });
                } else {
                    delete scope.templateUrl;
                }
            }
            scope.$on('$routeChangeSuccess', function () {
                init();
            });
            init();

            if(config.supportedLanguages) subscribeI18nLocale();

            function subscribeI18nLocale () {
                ngRegisterTopicHandler(scope, 'i18n.locale', function (locale) {
                    scope.localePrefix = locale + '/';
                });
            }
        }
    }
}