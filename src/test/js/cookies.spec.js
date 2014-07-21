describe('cookies', function() {
    var scope, ctrl, usecaseFactory, rest, service;
    var context = {};
    var config = {};
    var location;

    beforeEach(module('cookies'));
    beforeEach(module('angular.usecase.adapter'));
    beforeEach(module('rest.client'));

    beforeEach(inject(function($rootScope, usecaseAdapterFactory, restServiceHandler, $location) {
        scope = $rootScope.$new();
        usecaseFactory = usecaseAdapterFactory;
        usecaseFactory.andReturn(context);
        rest = restServiceHandler;
        location = $location;
    }));

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
        var directive, scope, registry, route;

        beforeEach(inject(function ($rootScope, topicRegistry, topicRegistryMock) {
            registry = topicRegistryMock;
            route = {routes: []};
            route.routes['/template/cookie-notice'] = {
                templateUrl: 'cookie-notice.html'
            };
            directive = CookiePermissionGrantedDirectiveFactory(location, topicRegistry, route);
            scope = $rootScope.$new();
            location.$$search = {};
        }));

        it('restrict to elements', function() {
            expect(directive.restrict).toEqual('E')
        });

        it('define empty scope', function() {
            expect(directive.scope).toEqual({});
        });

        it('transclude is enabled', function() {
            expect(directive.transclude).toBeTruthy();
        });

        it('template url', function() {
            expect(directive.templateUrl).toEqual('cookie-notice.html');
        });

        describe('on link', function() {
            describe('if localization is supported', function () {
                beforeEach(function () {
                    config.supportedLanguages = 'locale';
                    directive.link(scope);
                    registry['config.initialized'](config);
                });

                describe('when i18n locale notification received', function () {
                    beforeEach(function () {
                        registry['i18n.locale']('locale');
                    });

                    it('put locale prefix on scope', function () {
                        expect(scope.localePrefix).toEqual('locale/');
                    });
                });

                describe('when scope is destroyed', function() {
                    beforeEach(function () {
                        scope.$destroy();
                    });

                    it('unsubscribe i18n.locale', function () {
                        expect(registry['i18n.locale']).toBeUndefined();
                    });
                });
            });

            describe('if localization is not supported', function () {
                beforeEach(function () {
                    directive.link(scope);
                    registry['config.initialized'](config);
                });

                it('locale is empty', function () {
                    expect(scope.localePrefix).toBeUndefined();
                });
            });

            it('when permission is granted', function() {
                location.search('permissionGranted', 'true');
                directive.link(scope);
                expect(scope.granted).toBeTruthy();
            });

            ['false', null].forEach(function(value) {
                it("when permission is not granted with " + value, function() {
                    location.$$search.permissionGranted = value;
                    directive.link(scope);
                    expect(scope.granted).toBeFalsy();
                });
            });
        });
    });
});