angular.module('cookies', ['ngRoute', 'notifications', 'config'])
    .factory('hasCookie', ['usecaseAdapterFactory', 'restServiceHandler', 'config', HasCookieFactory])
    .directive('cookiePermissionGranted', ['$location', 'ngRegisterTopicHandler', 'config', 'binTemplate', CookiePermissionGrantedDirectiveFactory])
    .factory('onCookieNotFoundPresenter', ['config', 'sessionStorage', '$location', '$window', OnCookieNotFoundPresenterFactory])
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

function OnCookieNotFoundPresenterFactory(config, sessionStorage, $location, $window) {
    return function() {
        isInitialCookieCheck() ? redirectForCookie() : permissionDenied();
    };
    function isInitialCookieCheck() { return sessionStorage.cookieRedirectRequested == undefined }
    function redirectForCookie() {
        sessionStorage.cookieRedirectRequested = true;
        $window.location = (config.baseUri || '') + 'api/cookie?redirectUrl=' + encodeURIComponent($window.location);
    }
    function permissionDenied() {
        $location.search('permissionGranted', 'false');
        sessionStorage.cookieRedirectRequested = undefined;
    }
}

function CookiePermissionGrantedDirectiveFactory($location, ngRegisterTopicHandler, config, binTemplate) {
    return {
        restrict: 'E',
        scope: true,
        template: '<div ng-include="templateUrl"></div>',
        link: function(scope) {
            var names = {'true':'cookie-notice.html', 'false': 'configure-cookies.html'};

            function init() {
                var permissionGranted = $location.$$search.permissionGranted;
                if (permissionGranted != undefined) binTemplate.setTemplateUrl({scope:scope, module:'cookies', name:names[permissionGranted]});
                else delete scope.templateUrl;
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