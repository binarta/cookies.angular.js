describe('cookies', function() {
    var $rootScope, $timeout, scope, storage, binarta;

    beforeEach(module('cookies'));

    beforeEach(inject(function(_$rootScope_, _$location_, _$timeout_, _localStorage_, _binarta_) {
        $rootScope = _$rootScope_;
        scope = $rootScope.$new();
        $timeout = _$timeout_;
        storage = _localStorage_;
        binarta = _binarta_;
    }));

    describe('cookieNoticeDialog factory', function () {
        var sut, spy;

        beforeEach(inject(function (cookieNoticeDialog) {
            sut = cookieNoticeDialog;
            spy = jasmine.createSpyObj('spy', ['showEnableCookiesNotice', 'showCookieNotice', 'close']);
            window.navigator = {
                userAgent: 'user agent'
            };
        }));

        describe('when useragent is phantomJS (which is used by prerender)', function () {
            beforeEach(function () {
                window.navigator = {
                    userAgent: 'user agent is PhantomJS'
                };
                sut.show(spy);
            });

            it('do not show cookie notice', function () {
                expect(spy.close).toHaveBeenCalledWith();
            });
        });

        describe('when web storage is disabled', function () {
            beforeEach(function () {
                sut.show(spy);
            });

            it('show enable cookies notice', function () {
                expect(spy.showEnableCookiesNotice).toHaveBeenCalled();
            });
        });

        describe('when web storage is enabled', function () {
            beforeEach(function () {
                storage.storageAvailable = 'true';
            });

            describe('cookie notice is not seen before', function () {
                beforeEach(function () {
                    sut.show(spy);
                });

                it('show cookie notice', function () {
                    expect(spy.showCookieNotice).toHaveBeenCalled();
                });

                it('on close', function () {
                    sut.close();
                    expect(spy.close).toHaveBeenCalled();
                    expect(storage.cookiesDialogSeen).toBeTruthy();
                });

                describe('on route changes', function () {
                    beforeEach(function () {
                        $rootScope.$broadcast('$routeChangeSuccess');
                        $rootScope.$digest();
                    });

                    it('cookie notice has not been closed', function () {
                        expect(spy.close).not.toHaveBeenCalled();
                    });
                });

                describe('on route change after 5 seconds', function () {
                    beforeEach(function () {
                        $timeout.flush(5000);
                        $rootScope.$broadcast('$routeChangeSuccess');
                    });

                    it('cookie notice is closed', function () {
                        expect(spy.close).toHaveBeenCalled();
                    });

                    it('remembered', function () {
                        expect(storage.cookiesDialogSeen).toBeTruthy();
                    });

                    describe('on subsequent route changes', function () {
                        beforeEach(function () {
                            $rootScope.$broadcast('$routeChangeSuccess');
                            $rootScope.$digest();
                        });

                        it('close cookie notice is not called again', function () {
                            expect(spy.close.calls.count()).toEqual(1);
                        });
                    });
                });
            });

            describe('when cookie notice is already seen', function () {
                beforeEach(function () {
                    storage.cookiesDialogSeen = 'true';
                    sut.show(spy);
                });

                it('do not show cookie notice', function () {
                    expect(spy.close).toHaveBeenCalled();
                });
            });

            describe('on login', function () {
                beforeEach(function () {
                    sut.show(spy);
                    binarta.checkpoint.registrationForm.submit({username: 'u', password: 'p'});
                });

                it('do not show cookie notice', function () {
                    expect(spy.close).toHaveBeenCalled();
                });
            });
        });
    });

    describe('cookiePermissionGranted component', function () {
        var $ctrl, cookieNoticeDialogMock;

        beforeEach(inject(function ($componentController) {
            cookieNoticeDialogMock = {
                show: jasmine.createSpy('show'),
                close: jasmine.createSpy('close')
            };
            $ctrl = $componentController('cookiePermissionGranted', {cookieNoticeDialog: cookieNoticeDialogMock});
        }));

        it('cookieNoticeDialog is initialized', function () {
            expect(cookieNoticeDialogMock.show).toHaveBeenCalled();
        });

        it('on enable cookies notice', function () {
            cookieNoticeDialogMock.show.calls.mostRecent().args[0].showEnableCookiesNotice();
            expect($ctrl.cookie).toBeFalsy();
            expect($ctrl.configureCookies).toBeTruthy();
        });

        it('on show cookie notice', function () {
            cookieNoticeDialogMock.show.calls.mostRecent().args[0].showCookieNotice();
            expect($ctrl.cookie).toBeTruthy();
            expect($ctrl.configureCookies).toBeFalsy();
        });

        it('on close', function () {
            cookieNoticeDialogMock.show.calls.mostRecent().args[0].close();
            expect($ctrl.cookie).toBeFalsy();
            expect($ctrl.configureCookies).toBeFalsy();
        });

        it('on calling close manually', function () {
            $ctrl.close();
            expect(cookieNoticeDialogMock.close).toHaveBeenCalled();
        });
    });
});