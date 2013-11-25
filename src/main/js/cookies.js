angular.module('cookies', [])
    .controller('CookieController', ['$scope', 'usecaseAdapterFactory', 'restServiceHandler', '$routeParams', CookieController]);

function CookieController($scope, usecaseAdapterFactory, restServiceHandler, $routeParams) {
    $scope.init = function() {
        var ctx = usecaseAdapterFactory($scope);
        ctx.params = {
            method: 'GET',
            uri: 'api/cookie'
        };
        ctx.success = function() {
            $scope.granted = true;
        };
        restServiceHandler(ctx);
    };

    $scope.submit = function() {
        var ctx = usecaseAdapterFactory($scope);
        ctx.params = {
            method: 'PUT',
            uri: 'api/cookie'
        };
        ctx.success = function() {
            window.location = $routeParams.redirectUrl;
        };
        restServiceHandler(ctx);
    };
}