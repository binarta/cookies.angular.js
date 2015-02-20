angular.module('checkpoint', [])
    .service('account', ['$q', function ($q) {
        var self = this;
        this.loggedIn = false;

        this.getMetadata = function () {
            var deferred = $q.defer();
            self.loggedIn ? deferred.resolve() : deferred.reject();
            return deferred.promise;
        };
    }]);