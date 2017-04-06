angular.module('cookies', ['binarta-applicationjs-angular1', 'binarta-checkpointjs-angular1', 'config', 'web.storage', 'checkpoint'])
    .factory('cookieNoticeDialog', ['config', '$location', 'localStorage', CookieNoticeDialogFactory])
    .directive('cookiePermissionGranted', ['cookieNoticeDialog', 'account', CookiePermissionGrantedDirectiveFactory]);

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
        templateUrl: 'bin-cookie-notice.html',
        link: function(scope) {
            if (navigator.userAgent.toLowerCase().indexOf('phantomjs') != -1) return;

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
