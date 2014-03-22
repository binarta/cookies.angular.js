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
        var directive;
        var scope;

        beforeEach(inject(function ($rootScope) {
            directive = CookiePermissionGrantedDirectiveFactory(location, $rootScope);
            scope = {};
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
            expect(directive.templateUrl()).toEqual('app/partials/cookies/notification.html');
        });

        it('template url can be overridden by rootScope', inject(function ($rootScope) {
            $rootScope.cookieNoticeTemplateUrl = 'overridden-template.html';

            expect(directive.templateUrl()).toEqual('overridden-template.html');
        }));

        describe('on link', function() {
            beforeEach(function() {
                scope.$on = function(event, callback) {}
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