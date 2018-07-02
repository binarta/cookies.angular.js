(function () {
    angular.module('cookies', ['binarta-checkpointjs-angular1', 'web.storage', 'notifications'])
        .factory('cookieNoticeDialog', ['localStorage', 'binarta', 'cookiesStorage', 'topicMessageDispatcher', CookieNoticeDialogFactory])
        .service('cookiesStorage', ['localStorage', CookiesStorageService])
        .component('cookiePermissionGranted', new CookiePermissionGrantedComponent());

    function CookieNoticeDialogFactory(localStorage, binarta, cookiesStorage, topicMessageDispatcher) {
        function isStorageDisabled() {
            return angular.isUndefined(localStorage.storageAvailable);
        }

        function isCookieDialogRequired() {
            return localStorage.cookiesDialogSeen !== 'true';
        }

        function remember() {
            localStorage.cookiesDialogSeen = 'true';
        }

        function isPhantomJsUserAgent() {
            return navigator.userAgent.toLowerCase().indexOf('phantomjs') != -1;
        }

        function areCookiesAccepted() {
            return cookiesStorage.getCookieStorageValue();
        }

        function dispatchCookiesAccepted() {
            topicMessageDispatcher.fire('cookies.accepted');
        }

        function acceptCookies() {
            cookiesStorage.acceptCookies();
            dispatchCookiesAccepted();
        }

        return new function () {
            this.show = function (args) {
                if (areCookiesAccepted()) dispatchCookiesAccepted();

                if (isPhantomJsUserAgent()) args.close();
                else if (isStorageDisabled()) args.showEnableCookiesNotice();
                else if (isCookieDialogRequired()) args.showCookieNotice();
                else args.close();

                this.close = function (isAccepted) {
                    args.close();
                    remember();
                    isAccepted === 'true' ? acceptCookies() : cookiesStorage.rejectCookies();
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

    function CookiesStorageService(localStorage) {

        this.cookiesAccepted = 'cookiesAccepted';

        this.acceptCookies = function () {
            localStorage[this.cookiesAccepted] = 'true';
        };

        this.rejectCookies = function () {
            localStorage[this.cookiesAccepted] = 'false';
        };

        this.getCookieStorageValue = function () {
            return localStorage[this.cookiesAccepted];
        };

        this.resetCookiesStorageValue = function () {
            localStorage[this.cookiesAccepted] = undefined;
        };
    }
})();