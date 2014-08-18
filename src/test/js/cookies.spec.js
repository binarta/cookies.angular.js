describe('cookies', function() {
    var scope, ctrl, usecaseFactory, rest, service;
    var context = {};
    var config;
    var location;

    beforeEach(module('cookies'));
    beforeEach(module('angular.usecase.adapter'));
    beforeEach(module('rest.client'));
    angular.module('config', [])
        .factory('config', function () {
            return {};
        });

    beforeEach(inject(function($rootScope, usecaseAdapterFactory, restServiceHandler, $location, _config_) {
        scope = $rootScope.$new();
        usecaseFactory = usecaseAdapterFactory;
        usecaseFactory.andReturn(context);
        rest = restServiceHandler;
        location = $location;
        config = _config_;
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
        var directive, scope, topics, registry, templateSpy, templateArgs;

        beforeEach(inject(function ($rootScope, ngRegisterTopicHandler, topicRegistryMock) {
            topics = topicRegistryMock;
            registry = ngRegisterTopicHandler;
            templateSpy = {
                setTemplateUrl: function (args){
                    templateArgs = args;
                }
            };
            directive = CookiePermissionGrantedDirectiveFactory(location, registry, config, templateSpy);
            scope = $rootScope.$new();
            location.$$search = {};
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

            it('when permission is granted setTemplateUrl is called', function() {
                location.search('permissionGranted', 'true');
                directive.link(scope);

                expect(templateArgs).toEqual({
                    scope: scope,
                    module: 'cookies',
                    name: 'cookie-notice.html'
                });
            });

            ['false', null].forEach(function(value) {
                it("when permission is not granted with " + value, function() {
                    location.$$search.permissionGranted = value;
                    scope.templateUrl = 'defined';
                    directive.link(scope);
                    expect(scope.templateUrl).toBeUndefined();
                });
            });
        });
    });
});