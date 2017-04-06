describe('cookies', function() {
    var $window, $location, scope, rest, service, sessionStorage, localStorage;
    var context = {};
    var config;

    angular.module('config.templates', []);
    beforeEach(module('cookies'));

    beforeEach(module(function($provide) {
        $provide.value('$window', {});
    }));

    beforeEach(inject(function($rootScope, _$window_, _$location_, restServiceHandler, _config_, _sessionStorage_, _localStorage_) {
        scope = $rootScope.$new();
        $window = _$window_;
        $location = _$location_;
        rest = restServiceHandler;
        config = _config_;
        sessionStorage = _sessionStorage_;
        localStorage = _localStorage_;
    }));

    describe('OnCookieNotFoundPresenter', function() {
        var presenter;

        beforeEach(inject(function(onCookieNotFoundPresenter) {
            presenter = onCookieNotFoundPresenter;
        }));

        describe('given we return from a cookie redirect', function() {
            beforeEach(function() {
                $window.location = 'L';
                presenter();
            });

            it('redirect was requested', function() {
                expect(sessionStorage.cookieRedirectRequested).toEqual(true);
            });

            it('window location was updated', function() {
                expect($window.location).toEqual('api/cookie?redirectUrl=L');
            });

            describe('and received another redirect and return again', function() {
                beforeEach(function() {
                    $window.location = 'L';
                    $location.search('permissionGranted', 'true');
                    presenter();
                });

                it('permission granted flag was set to false', function() {
                    expect($location.search().permissionGranted).toEqual('false');
                });

                it('window location was not changed', function() {
                    expect($window.location).toEqual('L');
                });

                it('test', function() {
                    expect(Object.keys(sessionStorage).indexOf('cookieRedirectRequested')).toEqual(-1);
                });
            });
        });
    });

    describe('HasCookie', function() {
        var onSuccess = function() {};
        var onNotFound = function() {};

        beforeEach(inject(function() {
            service = HasCookieFactory(rest, config);
        }));

        describe('when called', function() {
            beforeEach(function() {
                config.baseUri = 'baseUri/';
                service(onSuccess, onNotFound);
            });

            it('will send a POST request', function() {
                expect(rest.calls.first().args[0].params.method).toEqual('POST');
            });

            it('will send a request to cookie resource', function() {
                expect(rest.calls.first().args[0].params.url).toEqual('baseUri/api/cookie')
            });

            it('will send requests with cookies', function() {
                expect(rest.calls.first().args[0].params.withCredentials).toEqual(true);
            });

            it('contains a success handler', function() {
                expect(rest.calls.first().args[0].success).toEqual(onSuccess);
            });

            it('contains a not found handler', function() {
                expect(rest.calls.first().args[0].notFound).toEqual(onNotFound);
            });
        });
    });

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