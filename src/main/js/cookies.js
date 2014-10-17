angular.module('cookies', ['ngRoute', 'notifications', 'config'])
    .factory('hasCookie', ['usecaseAdapterFactory', 'restServiceHandler', 'config', HasCookieFactory])
    .factory('cookieNoticeDialog', ['config', '$location', 'localStorage', CookieNoticeDialogFactory])
    .directive('cookiePermissionGranted', ['$location', 'ngRegisterTopicHandler', 'config', 'binTemplate', 'cookieNoticeDialog', CookiePermissionGrantedDirectiveFactory])
    .factory('onCookieNotFoundPresenter', ['config', 'sessionStorage', '$location', '$window', OnCookieNotFoundPresenterFactory])
    .config(['configProvider', ApplyDefaultCookiesConfiguration])
    .run(function(topicRegistry, hasCookie, config, onCookieNotFoundPresenter) {
        if(config.cookiesBinartaRedirect)
            topicRegistry.subscribe('app.start', function() {
                var callback = function() {
                    topicRegistry.unsubscribe('i18n.locale', callback);
                    hasCookie({}, null, onCookieNotFoundPresenter);
                };
                topicRegistry.subscribe('i18n.locale', callback);
            });
    });

function ApplyDefaultCookiesConfiguration(configProvider) {
    configProvider.add({cookiesBinartaRedirect:true});
}

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
        delete sessionStorage.cookieRedirectRequested;
    }
}

function CookieNoticeDialogFactory(config, $location, localStorage) {
    function isPermissionAutomaticallyGranted() {
        return config.cookiesAutoGrantPermission && (!localStorage.cookiesDialogSeen || localStorage.cookiesDialogSeen < 2);
    }

    function isPermissionRequired() {
        return $location.search().permissionGranted != undefined
    }

    function isCookieDialogRequired() {
        return isPermissionRequired() || isPermissionAutomaticallyGranted()
    }

    function isPermissionGranted() {
        return $location.search().permissionGranted == 'true'
    }

    function isCookiesEnabled() {
        return isPermissionGranted() || isPermissionAutomaticallyGranted()
    }

    function showCookieNoticeAndRemember(args) {
        args.showCookieNotice();
        remember();
    }

    function remember() {
        if(!localStorage.cookiesDialogSeen)
            localStorage.cookiesDialogSeen = 1;
        else
            localStorage.cookiesDialogSeen += 1;
    }

    return function(args) {
        if(isCookieDialogRequired())
            if(isCookiesEnabled()) showCookieNoticeAndRemember(args);
            else args.enableCookies();
        else args.ignore();

    }
}

function CookiePermissionGrantedDirectiveFactory($location, ngRegisterTopicHandler, config, binTemplate, cookieNoticeDialog) {
    return {
        restrict: 'E',
        scope: true,
        template: '<div ng-include="templateUrl"></div>',
        link: function(scope) {
            var names = {'true':'cookie-notice.html', 'false': 'configure-cookies.html'};

            var render = function(template) {
                binTemplate.setTemplateUrl({scope:scope, module:'cookies', name:template})
            };

            function init() {
                cookieNoticeDialog({
                    enableCookies:function() {
                        render('configure-cookies.html')
                    },
                    showCookieNotice:function() {
                        render('cookie-notice.html')
                    },
                    ignore:function() {
                        delete scope.templateUrl;
                    }
                });
            }
            scope.$on('$routeChangeSuccess', function () {
                init();
            });

            if(config.supportedLanguages) subscribeI18nLocale();

            function subscribeI18nLocale () {
                ngRegisterTopicHandler(scope, 'i18n.locale', function (locale) {
                    scope.localePrefix = locale + '/';
                });
            }
        }
    }
}