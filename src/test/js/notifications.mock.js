angular.module('notifications', [])
    .service('topicMessageDispatcher', function () {
        this.fire = jasmine.createSpy('fire');
    });