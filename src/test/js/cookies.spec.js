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

            it('will send a GET request', function() {
                expect(context.params.method).toEqual('GET');
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

    describe('CreateCookie', function() {
        beforeEach(function() {
            service = CreateCookieFactory(usecaseFactory, rest, {});
        });

        describe('when called', function() {
            beforeEach(function() {
                service(scope);
            });

            it('context is created with scope', function() {
                expect(usecaseFactory.calls[0].args[0]).toEqual(scope);
            });

            it('will send a PUT request', function() {
                expect(context.params.method).toEqual('PUT');
            });

            it('will send a request to cookie resource', function() {
                expect(context.params.url).toEqual('api/cookie')
            });

            it('will pass context to rest service', function() {
                expect(rest.calls[0].args[0]).toEqual(context);
            });
        });
    });

    describe('CookieController', function() {
        var capturedScope, capturedSuccess;
        var hasCookie = function(scope, success) {
            capturedScope = scope;
            capturedSuccess = success;
        };
        var createCookie = function(scope, success) {
            capturedScope = scope;
            capturedSuccess = success;
        };

        beforeEach(inject(function($controller) {
            ctrl = $controller(CookieController, {$scope: scope, hasCookie: hasCookie, createCookie: createCookie});
        }));

        describe('on init', function() {
            beforeEach(function() {
                scope.init();
            });

            it('has cookies service receives scope', function() {
                expect(capturedScope).toEqual(scope);
            });

            describe('when has cookie service receives success handler', function() {
                beforeEach(function() {
                    capturedSuccess();
                });

                it('has cookies service receives success handler', function() {
                    expect(scope.granted).toEqual(true);
                });
            });
        });

        describe('on submit', function() {
            beforeEach(function() {
                scope.submit();
            });

            it('create cookie service receives scope', function() {
                expect(capturedScope).toEqual(scope);
            });
        });
    });

    describe('cookie permission granted directive', function() {
        var directive;
        var scope;

        beforeEach(function() {
            directive = CookiePermissionGrantedDirectiveFactory(location);
            scope = {};
            location.$$search = {};
        });

        it('restrict to elements', function() {
            expect(directive.restrict).toEqual('E')
        });

        it('define empty scope', function() {
            expect(directive.scope).toEqual({});
        });

        it('transclude is enabled', function() {
            expect(directive.transclude).toBeTruthy();
        });

        it('template is inlined', function() {
            expect(directive.template).toEqual('<div ng-show="granted"><ng-include src="\'app/partials/cookies/notification.html\'" /></div>')
        });

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