describe('cookies', function() {
    var $window, $location, scope, sessionStorage, localStorage;
    var config;

    angular.module('config.templates', []);
    beforeEach(module('cookies'));

    beforeEach(module(function($provide) {
        $provide.value('$window', {});
    }));

    beforeEach(inject(function($rootScope, _$window_, _$location_, _config_, _sessionStorage_, _localStorage_) {
        scope = $rootScope.$new();
        $window = _$window_;
        $location = _$location_;
        config = _config_;
        sessionStorage = _sessionStorage_;
        localStorage = _localStorage_;
    }));

    describe('cookie permission granted directive', function() {
        var directive, scope, account;

        beforeEach(inject(function ($rootScope, $location, cookieNoticeDialog, _account_) {
            scope = $rootScope.$new();
            account = _account_;
            directive = CookiePermissionGrantedDirectiveFactory(cookieNoticeDialog, account);
            $location.search({});
        }));

        it('restrict to elements', function() {
            expect(directive.restrict).toEqual('E')
        });

        it('define new child scope', function() {
            expect(directive.scope).toEqual(true);
        });

        it('template', function () {
            expect(directive.templateUrl).toEqual('bin-cookie-notice.html');
        });

        describe('user agent is not phantomjs', function () {
            beforeEach(function () {
                window.navigator = {
                    userAgent: 'user agent'
                };
            });

            describe('on link', function() {
                describe('when not logged in', function () {

                    it('when permission granted is true then show cookie message', function() {
                        $location.search('permissionGranted', 'true');
                        directive.link(scope);
                        scope.$broadcast('$routeChangeSuccess');
                        scope.$digest();

                        expect(scope.cookie).toBeTruthy();
                        expect(scope.configureCookies).toBeFalsy();
                    });

                    it('when permission granted is false then show configure cookie message', function() {
                        $location.search('permissionGranted', 'false');
                        directive.link(scope);
                        scope.$broadcast('$routeChangeSuccess');
                        scope.$digest();

                        expect(scope.cookie).toBeFalsy();
                        expect(scope.configureCookies).toBeTruthy();
                    });

                    [null].forEach(function(value) {
                        it("when permission is not granted with " + value, function() {
                            $location.search({permissionGranted:value});
                            scope.templateUrl = 'defined';
                            directive.link(scope);
                            scope.$broadcast('$routeChangeSuccess');
                            scope.$digest();

                            expect(scope.cookie).toBeFalsy();
                            expect(scope.configureCookies).toBeFalsy();
                        });
                    });
                });

                describe('when logged in', function () {
                    beforeEach(function () {
                        account.loggedIn = true;
                    });

                    it('when permission granted is true then render nothing', function() {
                        $location.search('permissionGranted', 'true');
                        directive.link(scope);
                        scope.$broadcast('$routeChangeSuccess');

                        expect(scope.cookie).toBeFalsy();
                        expect(scope.configureCookies).toBeFalsy();
                    });

                    it('when permission granted is false then show configure cookie message', function() {
                        $location.search('permissionGranted', 'false');
                        directive.link(scope);
                        scope.$broadcast('$routeChangeSuccess');

                        expect(scope.cookie).toBeFalsy();
                        expect(scope.configureCookies).toBeTruthy();
                    });

                    [null].forEach(function(value) {
                        it("when permission is not granted with " + value, function() {
                            $location.search({permissionGranted:value});
                            scope.templateUrl = 'defined';
                            directive.link(scope);
                            scope.$broadcast('$routeChangeSuccess');

                            expect(scope.cookie).toBeFalsy();
                            expect(scope.configureCookies).toBeFalsy();
                        });
                    });
                });
            });

            describe('given configured to automatically grant permission and linking', function() {
                beforeEach(inject(function(config) {
                    config.cookiesAutoGrantPermission = true;
                    directive.link(scope);
                    scope.$broadcast('$routeChangeSuccess');
                    scope.$digest();
                }));

                it('when linking open cookie notice', function() {
                    expect(scope.cookie).toBeTruthy();
                    // expect(scope.configureCookies).toBeFalsy();
                });

                describe('and', function() {
                    it('on second route still show the notice', function() {
                        scope.$broadcast('$routeChangeSuccess');
                        scope.$digest();
                        // expect(scope.cookie).toBeTruthy();
                    });

                    it('on third route close the notice', function() {
                        scope.$broadcast('$routeChangeSuccess');
                        scope.$broadcast('$routeChangeSuccess');
                        expect(scope.cookie).toBeFalsy();
                    });

                    describe('cookie notice gets closed', function() {
                        beforeEach(function() {
                            scope.close();
                        });

                        it('then cookie notice is not displayed', function() {
                            expect(scope.cookie).toBeFalsy();
                            expect(scope.configureCookies).toBeFalsy();
                        });

                        describe('and we change routes', function() {
                            beforeEach(function() {
                                scope.$broadcast('$routeChangeSuccess');
                                scope.$digest();
                            });

                            it('then cookie notice is still not displayed', function() {
                                expect(scope.cookie).toBeFalsy();
                                expect(scope.configureCookies).toBeFalsy();
                            })
                        });
                    });
                });
            });
        });

        describe('when useragent is phantomJS (which is used by prerender)', function () {
            beforeEach(inject(function(config) {
                window.navigator = {
                    userAgent: 'user agent is PhantomJS'
                };

                config.cookiesAutoGrantPermission = true;
                directive.link(scope);
                scope.$broadcast('$routeChangeSuccess');
                scope.$digest();
            }));

            it('when linking no cookie notice is shown', function() {
                expect(scope.cookie).toBeFalsy();
                expect(scope.configureCookies).toBeFalsy();
            });
        });
    });
});