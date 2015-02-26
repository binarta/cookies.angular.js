angular.module('cookies', ['notifications', 'config', 'checkpoint'])
    .factory('hasCookie', ['usecaseAdapterFactory', 'restServiceHandler', 'config', HasCookieFactory])
    .factory('cookieNoticeDialog', ['config', '$location', 'localStorage', CookieNoticeDialogFactory])
    .directive('cookiePermissionGranted', ['cookieNoticeDialog', 'account', CookiePermissionGrantedDirectiveFactory])
    .factory('onCookieNotFoundPresenter', ['config', 'sessionStorage', '$location', '$window', OnCookieNotFoundPresenterFactory])
    .config(['configProvider', ApplyDefaultCookiesConfiguration])
    .run(['topicRegistry', 'hasCookie', 'config', 'onCookieNotFoundPresenter', function(topicRegistry, hasCookie, config, onCookieNotFoundPresenter) {
        if(config.cookiesBinartaRedirect)
            topicRegistry.subscribe('app.start', function() {
                var callback = function() {
                    topicRegistry.unsubscribe('i18n.locale', callback);
                    hasCookie({}, null, onCookieNotFoundPresenter);
                };
                topicRegistry.subscribe('i18n.locale', callback);
            });
    }]);

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
        return config.cookiesAutoGrantPermission && (!localStorage.cookiesDialogSeen || parseInt(localStorage.cookiesDialogSeen) < 2);
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
        if (!localStorage.cookiesDialogSeen)
            localStorage.cookiesDialogSeen = 1;
        else
            localStorage.cookiesDialogSeen = parseInt(localStorage.cookiesDialogSeen) + 1;
    }

    return new function() {
        this.show = function(args) {
            if(isCookieDialogRequired())
                if(isCookiesEnabled()) showCookieNoticeAndRemember(args);
                else args.enableCookies();
            else args.ignore();
        };

        this.close = function() {
            localStorage.cookiesDialogSeen = 2;
        };
    };
}

function CookiePermissionGrantedDirectiveFactory(cookieNoticeDialog, account) {
    return {
        restrict: 'E',
        scope: true,
        template:
        '<div id="binarta-cookie-notice-wrapper" ng-if="configureCookies || cookie">' +
        '<div id="binarta-cookie-notice">' +
        '<div ng-if="configureCookies">' +
        '<p i18n class="inline" code="configure.cookies.notice.message" editor="full"' +
        'default="Please configure your browser to enable third-party cookies, you can read more about our cookie policy in our <a href=\'#!{{localePrefix}}/conditions\'>conditions</a>." ' +
        'ng-bind-html="var">' +
        '</p>' +
        '</div>' +
        '<div ng-if="cookie">' +
        '<p i18n class="inline" code="cookie.notice.message" editor="full"' +
        'default="This website uses cookies. By continuing to use this website without changing your settings, you agree with our <a href=\'#!{{localePrefix}}/conditions\'>conditions</a>." ' +
        'ng-bind-html="var">' +
        '</p>' +
        '</div>' +
        '<button type="button" class="btn btn-default inline" i18n code="cookie.notice.close.button" default="close" ng-click="close()">' +
        '<i class="fa fa-times fa-fw"></i> {{var}}' +
        '</button>' +
        '</div>' +
        '</div>',
        link: function(scope) {
            scope.$on('$routeChangeSuccess', function () {
                cookieNoticeDialog.show({
                    enableCookies:function() {
                        scope.cookie = false;
                        scope.configureCookies = true;
                    },
                    showCookieNotice:function() {
                        account.getMetadata().then(function() {
                            scope.close();
                        }, function () {
                            scope.configureCookies = false;
                            scope.cookie = true;
                        });
                    },
                    ignore:function() {
                        scope.close();
                    }
                });
            });

            scope.close = function () {
                scope.cookie = false;
                scope.configureCookies = false;
                cookieNoticeDialog.close();
            };
        }
    }
}