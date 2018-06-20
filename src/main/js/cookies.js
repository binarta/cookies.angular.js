(function () {
    angular.module('cookies', ['binarta-checkpointjs-angular1', 'web.storage'])
        .factory('cookieNoticeDialog', ['$rootScope', '$timeout', 'localStorage', 'binarta', 'cookiesStorage', CookieNoticeDialogFactory])
        .service('cookiesStorage', ['binarta', 'localStorage', CookiesStorageService])
        .component('cookiePermissionGranted', new CookiePermissionGrantedComponent());

    function CookieNoticeDialogFactory($rootScope, $timeout, localStorage, binarta, cookiesStorage) {
        function isStorageDisabled() {
            return angular.isUndefined(localStorage.storageAvailable);
        }

        function isCookieDialogRequired() {
            return !localStorage.cookiesDialogSeen;
        }

        function remember() {
            localStorage.cookiesDialogSeen = true;
        }

        function isPhantomJsUserAgent() {
            return navigator.userAgent.toLowerCase().indexOf('phantomjs') != -1;
        }

        return new function () {
            this.show = function (args) {
                if (isPhantomJsUserAgent()) args.close();
                else if (isStorageDisabled()) args.showEnableCookiesNotice();
                else if (isCookieDialogRequired()) args.showCookieNotice();
                else args.close();

                this.close = function (isAccepted) {
                    args.close();
                    remember();
                    isAccepted ? cookiesStorage.acceptCookies() : cookiesStorage.rejectCookies();
                };

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
                showEnableCookiesNotice: function () {
                    $ctrl.cookie = false;
                    $ctrl.configureCookies = true;
                },
                showCookieNotice: function () {
                    $ctrl.configureCookies = false;
                    $ctrl.cookie = true;
                },
                close: function () {
                    $ctrl.cookie = false;
                    $ctrl.configureCookies = false;
                }
            });

            $ctrl.close = cookieNoticeDialog.close;
        }];
    }

    function CookiesStorageService(binarta, localStorage) {

        this.acceptCookies = function () {
            localStorage.cookiesAccepted = true;
        };

        this.rejectCookies = function () {
            localStorage.cookiesAccepted = false;
        };

        this.getCookieStorageValue = function () {
            return localStorage.cookiesAccepted;
        };

        this.resetCookiesStorageValue = function () {
            localStorage.cookiesAccepted = undefined;
        };
    }
})();