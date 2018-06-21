describe('cookies', function() {
    var $rootScope, $timeout, scope, storage, binarta, topicMessageDispatcher;

    beforeEach(module('cookies'));

    beforeEach(inject(function(_$rootScope_, _$location_, _$timeout_, _localStorage_, _binarta_, _topicMessageDispatcher_) {
        $rootScope = _$rootScope_;
        scope = $rootScope.$new();
        $timeout = _$timeout_;
        storage = _localStorage_;
        binarta = _binarta_;
        topicMessageDispatcher = _topicMessageDispatcher_;
    }));

    describe('cookieNoticeDialog factory', function () {
        var sut, spy, acceptedCookiesSpy, cookiesStorage;

        beforeEach(inject(function (cookieNoticeDialog, _cookiesStorage_) {
            cookiesStorage = _cookiesStorage_;
            sut = cookieNoticeDialog;
            spy = jasmine.createSpyObj('spy', ['showEnableCookiesNotice', 'showCookieNotice', 'close']);
            window.navigator = {
                userAgent: 'user agent'
            };
        }));
        
        it('Should fire an event if cookies are accepted', function () {
            sut.show(spy);
            sut.close(true);
            expect(topicMessageDispatcher.fire).toHaveBeenCalled();
        });
        
        it('Should NOT fire an event if cookies are rejected or cookiedialog has never been seen', function () {
            sut.show(spy);
            expect(topicMessageDispatcher.fire).not.toHaveBeenCalled();

            sut.show(spy);
            sut.close(false);
            expect(topicMessageDispatcher.fire).not.toHaveBeenCalled();
        });
        

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

                it('on close - confirmed cookies', function () {
                    sut.close(true);
                    expect(spy.close).toHaveBeenCalled();
                    expect(storage.cookiesDialogSeen).toBeTruthy();
                    expect(storage.cookiesAccepted).toBeTruthy();
                });

                it('on close - rejected cookies', function () {
                    sut.close(false);
                    expect(spy.close).toHaveBeenCalled();
                    expect(storage.cookiesDialogSeen).toBeTruthy();
                    expect(storage.cookiesAccepted).toBeFalsy();
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

                    it('cookie notice is not closed', function () {
                        expect(spy.close).not.toHaveBeenCalled();
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

    describe('cookiesStorage -', function() {

        beforeEach(inject(function (cookiesStorage) {
            sut = cookiesStorage;
            spy = jasmine.createSpyObj('spy', ['acceptCookies', 'rejectCookies', 'getCookieStorageValue']);
        }));

        it('Should get the cookiestoragevalue', function() {
            var result = sut.getCookieStorageValue();
            expect(result).toBeUndefined();

            sut.acceptCookies();
            result = sut.getCookieStorageValue();
            expect(result).toBeTruthy();

            sut.rejectCookies();
            result = sut.getCookieStorageValue();
            expect(result).toBeFalsy();
        });
        
        it('Should set the cookiestoragevalue to true on accept', function() {
            expect(sut.getCookieStorageValue()).toBe(undefined);
            sut.acceptCookies();
            expect(sut.getCookieStorageValue()).toBe(true);
        });

        it('Should set the cookiestoragevalue to false on reject', function() {
            expect(sut.getCookieStorageValue()).toBe(undefined);
            sut.rejectCookies();
            expect(sut.getCookieStorageValue()).toBe(false);
        });

        it('Should reset the cookieStoragevalue', function () {
            sut.resetCookiesStorageValue();
            expect(sut.getCookieStorageValue()).toBe(undefined);
        });

        
        it('Should return the value string', function () {
            expect(sut.getCookiesAcceptedValueString()).toBe('cookiesAccepted');
        });
    });
});