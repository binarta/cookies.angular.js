describe('cookies', function() {
    var scope, ctrl, usecaseFactory, rest, service;
    var context = {};
    var config;
    var location;

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
        var directive, scope, topics, registry, templateSpy, templateArgs;

        function assertRendered(args) {
            expect(templateArgs.name).toEqual(args.templateUrl);
            expect(templateArgs.module).toEqual('cookies');
            expect(templateArgs.scope).toEqual(scope);
        }

        beforeEach(inject(function ($rootScope, $location, ngRegisterTopicHandler, topicRegistryMock, cookieNoticeDialog) {
            topics = topicRegistryMock;
            registry = ngRegisterTopicHandler;
            templateSpy = {
                setTemplateUrl: function (args){
                    templateArgs = args;
                }
            };
            directive = CookiePermissionGrantedDirectiveFactory($location, registry, config, templateSpy, cookieNoticeDialog);
            scope = $rootScope.$new();
            $location.search({});
        }));

        it('restrict to elements', function() {
            expect(directive.restrict).toEqual('E')
        });

        it('define new child scope', function() {
            expect(directive.scope).toEqual(true);
        });

        it('template', function () {
            expect(directive.template).toEqual('<div ng-include="templateUrl"></div>');
        });

        describe('on link', function() {
            describe('if localization is supported', function () {
                beforeEach(function () {
                    config.supportedLanguages = 'locale';
                    directive.link(scope);
                });

                describe('when i18n locale notification received', function () {
                    beforeEach(function () {
                        topics['i18n.locale']('locale');
                    });

                    it('put locale prefix on scope', function () {
                        expect(scope.localePrefix).toEqual('locale/');
                    });
                });
            });

            describe('if localization is not supported', function () {
                beforeEach(function () {
                    directive.link(scope);
                });

                it('locale is empty', function () {
                    expect(scope.localePrefix).toBeUndefined();
                });
            });

            [
                {granted:'true', name:'cookie-notice.html'},
                {granted:'false', name:'configure-cookies.html'}
            ].forEach(function(args) {
                it('when permission granted is ' + args.granted + ' then render ' + args.name, function() {
                    location.search('permissionGranted', args.granted);
                    directive.link(scope);
                    scope.$broadcast('$routeChangeSuccess');
                    assertRendered({templateUrl:args.name});
                })
            });

            [null].forEach(function(value) {
                it("when permission is not granted with " + value, function() {
                    location.search({permissionGranted:value});
                    scope.templateUrl = 'defined';
                    directive.link(scope);
                    scope.$broadcast('$routeChangeSuccess');
                    expect(scope.templateUrl).toBeUndefined();
                });
            });
        });

        describe('given configured to automatically grant permission and linking', function() {
            beforeEach(inject(function(config) {
                config.cookiesAutoGrantPermission = true;
                directive.link(scope);
                scope.$broadcast('$routeChangeSuccess');
            }));

            it('when linking open cookie notice', function() {
                assertRendered({templateUrl:'cookie-notice.html'})
            });

            describe('and', function() {
                beforeEach(function() {
                    templateArgs = undefined;
                });

                function assertIgnored() {
                    expect(scope.templateUrl).toBeUndefined();
                    expect(templateArgs).toBeUndefined();
                }

                it('on second route still show the notice', function() {
                    scope.$broadcast('$routeChangeSuccess');
                    assertRendered({templateUrl:'cookie-notice.html'});
                });

                it('on third route close the notice', function() {
                    scope.$broadcast('$routeChangeSuccess');
                    templateArgs = undefined;
                    scope.$broadcast('$routeChangeSuccess');
                    assertIgnored();
                });
            });
        });
    });
});

angular.module('window.mock', ['cookies']).factory('$window', function() {return {}});
