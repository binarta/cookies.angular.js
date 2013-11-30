describe('cookies', function() {
    var scope, ctrl, usecaseFactory, rest, service;
    var context = {};
    var config = {};

    beforeEach(module('cookies'));
    beforeEach(module('angular.usecase.adapter'));
    beforeEach(module('rest.client'));

    beforeEach(inject(function($rootScope, usecaseAdapterFactory, restServiceHandler) {
        scope = $rootScope.$new();
        usecaseFactory = usecaseAdapterFactory;
        usecaseFactory.andReturn(context);
        rest = restServiceHandler;
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
});