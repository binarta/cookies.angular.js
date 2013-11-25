describe('cookies', function() {
    var scope, ctrl, usecaseFactory, rest;
    var context = {};

    beforeEach(module('cookies'));
    beforeEach(module('angular.usecase.adapter'));
    beforeEach(module('rest.client'));

    beforeEach(inject(function($rootScope, usecaseAdapterFactory, restServiceHandler) {
        scope = $rootScope.$new();
        usecaseFactory = usecaseAdapterFactory;
        usecaseFactory.andReturn(context);
        rest = restServiceHandler;
    }));

    describe('CookieController', function() {
        beforeEach(inject(function($controller) {
            ctrl = $controller(CookieController, {$scope: scope});
        }));

        describe('on init', function() {
            beforeEach(function() {
                scope.init();
            });

            it('context is created with scope', function() {
                expect(usecaseFactory.calls[0].args[0]).toEqual(scope);
            });

            it('will send a GET request', function() {
                expect(context.params.method).toEqual('GET');
            });

            it('will send a request to cookie resource', function() {
                expect(context.params.uri).toEqual('api/cookie')
            });

            it('passes the context to the rest service', function() {
                expect(rest.calls[0].args[0]).toEqual(context);
            });

            describe('on success', function() {
                beforeEach(function() {
                    context.success();
                });

                it('then granted is true', function() {
                    expect(scope.granted).toBeTruthy();
                });
            });
        });

        describe('on submit', function() {
            beforeEach(function() {
                scope.submit();
            });

            it('context is created with scope', function() {
                expect(usecaseFactory.calls[0].args[0]).toEqual(scope);
            });

            it('will send a PUT request', function() {
                expect(context.params.method).toEqual('PUT');
            });

            it('will send a request to cookie resource', function() {
                expect(context.params.uri).toEqual('api/cookie')
            });

            it('will pass context to rest service', function() {
                expect(rest.calls[0].args[0]).toEqual(context);
            });

            describe('on success', function() {
                beforeEach(function() {
                    context.success();
                });

                it('', function() {
                    expect(true).toBeTruthy();
                });
            });
        });
    });
});