describe('cookies', function() {
    var scope, ctrl, usecaseFactory, rest, service;
    var context = {};
    var config;
    var location;

    beforeEach(module('checkpoint'));
    beforeEach(module('cookies'));
    beforeEach(module('angular.usecase.adapter'));
    beforeEach(module('rest.client'));
    beforeEach(module('window.mock'));
    beforeEach(module('web.storage'));

    beforeEach(inject(function($rootScope, usecaseAdapterFactory, restServiceHandler, $location, _config_) {
        scope = $rootScope.$new();
        usecaseFactory = usecaseAdapterFactory;
        usecaseFactory.andReturn(context);
        rest = restServiceHandler;
        location = $location;
        config = _config_;
    }));

    describe('OnCookieNotFoundPresenter', function() {
        var presenter;

        beforeEach(inject(function(onCookieNotFoundPresenter) {
            presenter = onCookieNotFoundPresenter;
        }));

        describe('given we return from a cookie redirect', function() {
            beforeEach(inject(function($window) {
                $window.location = 'L';
                presenter();
            }));

            it('redirect was requested', inject(function(sessionStorage) {
                expect(sessionStorage.cookieRedirectRequested).toEqual(true);
            }));

            it('window location was updated', inject(function($window) {
                expect($window.location).toEqual('api/cookie?redirectUrl=L');
            }));

            describe('and received another redirect and return again', function() {
                beforeEach(inject(function($window, $location) {
                    $window.location = 'L';
                    $location.search('permissionGranted', 'true');
                    presenter();
                }));

                it('permission granted flag was set to false', inject(function($location) {
                    expect($location.search().permissionGranted).toEqual('false');
                }));

                it('window location was not changed', inject(function($window) {
                    expect($window.location).toEqual('L');
                }));

                it('test', inject(function(sessionStorage) {
                    expect(Object.keys(sessionStorage).indexOf('cookieRedirectRequested')).toEqual(-1);
                }));
            });
        });
    });

    describe('HasCookie', function() {
        var onSuccess = function() {};
        var onNotFound = function() {};

        beforeEach(inject(function() {
            service = HasCookieFactory(usecaseFactory, rest, config);
        }));

        describe('when called', function() {
            beforeEach(function() {
                config.baseUri = 'baseUri/';
                service(scope, onSuccess, onNotFound);
            });

            it('context is created with scope', function() {
                expect(usecaseFactory.calls[0].args[0]).toEqual(scope);
            });

            it('will send a POST request', function() {
                expect(context.params.method).toEqual('POST');
            });

            it('will send a request to cookie resource', function() {
                expect(context.params.url).toEqual('baseUri/api/cookie')
            });

            it('will send requests with cookies', function() {
                expect(context.params.withCredentials).toEqual(true);
            });

            it('passes the context to the rest service', function() {
                expect(rest.calls[0].args[0]).toEqual(context);
            });

            it('context contains a success handler', function() {
                expect(context.success).toEqual(onSuccess);
            });

            it('context contains a not found handler', function() {
                expect(context.notFound).toEqual(onNotFound);
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
            expect(directive.template).toEqual(jasmine.any(String));
        });

        describe('on link', function() {
            describe('when not logged in', function () {

                it('when permission granted is true then show cookie message', function() {
                    location.search('permissionGranted', 'true');
                    directive.link(scope);
                    scope.$broadcast('$routeChangeSuccess');
                    scope.$digest();

                    expect(scope.cookie).toBeTruthy();
                    expect(scope.configureCookies).toBeFalsy();
                });

                it('when permission granted is false then show configure cookie message', function() {
                    location.search('permissionGranted', 'false');
                    directive.link(scope);
                    scope.$broadcast('$routeChangeSuccess');
                    scope.$digest();

                    expect(scope.cookie).toBeFalsy();
                    expect(scope.configureCookies).toBeTruthy();
                });

                [null].forEach(function(value) {
                    it("when permission is not granted with " + value, function() {
                        location.search({permissionGranted:value});
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
                    location.search('permissionGranted', 'true');
                    directive.link(scope);
                    scope.$broadcast('$routeChangeSuccess');

                    expect(scope.cookie).toBeFalsy();
                    expect(scope.configureCookies).toBeFalsy();
                });

                it('when permission granted is false then show configure cookie message', function() {
                    location.search('permissionGranted', 'false');
                    directive.link(scope);
                    scope.$broadcast('$routeChangeSuccess');

                    expect(scope.cookie).toBeFalsy();
                    expect(scope.configureCookies).toBeTruthy();
                });

                [null].forEach(function(value) {
                    it("when permission is not granted with " + value, function() {
                        location.search({permissionGranted:value});
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
                expect(scope.configureCookies).toBeFalsy();
            });

            describe('and', function() {
                it('on second route still show the notice', function() {
                    scope.$broadcast('$routeChangeSuccess');

                    expect(scope.cookie).toBeTruthy();
                });

                it('on third route close the notice', function() {
                    scope.$broadcast('$routeChangeSuccess');
                    scope.$broadcast('$routeChangeSuccess');

                    expect(scope.cookie).toBeFalsy();
                });
            });
        });
    });
});

angular.module('window.mock', ['cookies']).factory('$window', function() {return {}});
