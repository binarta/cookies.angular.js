(function () {
    angular.module('cookies', ['binarta-checkpointjs-angular1', 'web.storage'])
        .factory('cookieNoticeDialog', ['$rootScope', '$timeout', 'localStorage', 'binarta', CookieNoticeDialogFactory])
        .component('cookiePermissionGranted', new CookiePermissionGrantedComponent());

    function CookieNoticeDialogFactory($rootScope, $timeout, localStorage, binarta) {
        function isStorageDisabled() {
            return angular.isUndefined(localStorage.storageAvailable);
        }

        function isCookieDialogRequired() {
            return !localStorage.cookiesDialogSeen;
        }

        function showCookieNoticeAndRemember(args) {
            $timeout(afterTimeout, 5000);
            args.showCookieNotice();
            remember();

            function afterTimeout() {
                var deregister = $rootScope.$on('$routeChangeSuccess', onNextRouteChange);

                function onNextRouteChange() {
                    args.close();
                    deregister();
                }
            }
        }

        function remember() {
            localStorage.cookiesDialogSeen = true;
        }

        function isPhantomJsUserAgent() {
            return navigator.userAgent.toLowerCase().indexOf('phantomjs') != -1;
        }

        return new function() {
            this.show = function(args) {
                if (isPhantomJsUserAgent()) args.close();
                else if (isStorageDisabled()) args.showEnableCookiesNotice();
                else if (isCookieDialogRequired()) showCookieNoticeAndRemember(args);
                else args.close();

                this.close = args.close;

                binarta.checkpoint.profile.eventRegistry.observe({
                    signedin: args.close
                });
            };
        };
    }

    function CookiePermissionGrantedComponent() {
        this.templateUrl = 'bin-cookie-notice.html';
        this.controller = ['cookieNoticeDialog', function (cookieNoticeDialog) {
            var $ctrl = this;

            cookieNoticeDialog.show({
                showEnableCookiesNotice:function() {
                    $ctrl.cookie = false;
                    $ctrl.configureCookies = true;
                },
                showCookieNotice:function() {
                    $ctrl.configureCookies = false;
                    $ctrl.cookie = true;
                },
                close:function() {
                    $ctrl.cookie = false;
                    $ctrl.configureCookies = false;
                }
            });

            $ctrl.close = cookieNoticeDialog.close;
        }];
    }
})();