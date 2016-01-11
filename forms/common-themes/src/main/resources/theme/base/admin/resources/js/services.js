'use strict';

var module = angular.module('keycloak.services', [ 'ngResource', 'ngRoute' ]);

module.service('Dialog', function($modal) {
	var dialog = {};

    var openDialog = function(title, message, btns, template) {
        var controller = function($scope, $modalInstance, title, message, btns) {
            $scope.title = title;
            $scope.message = message;
            $scope.btns = btns;

            $scope.ok = function () {
                $modalInstance.close();
            };
            $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
            };
        };

        return $modal.open({
            templateUrl: resourceUrl + template,
            controller: controller,
            resolve: {
                title: function() {
                    return title;
                },
                message: function() {
                    return message;
                },
                btns: function() {
                    return btns;
                }
            }
        }).result;
    }

	var escapeHtml = function(str) {
		var div = document.createElement('div');
		div.appendChild(document.createTextNode(str));
		return div.innerHTML;
	};

	dialog.confirmDelete = function(name, type, success) {
		var title = 'Delete ' + escapeHtml(type.charAt(0).toUpperCase() + type.slice(1));
		var msg = 'Are you sure you want to permanently delete the ' + type + ' ' + name + '?';
        var btns = {
            ok: {
                label: 'Delete',
                cssClass: 'btn btn-danger'
            },
            cancel: {
                label: 'Cancel',
                cssClass: 'btn btn-default'
            }
        }

        openDialog(title, msg, btns, '/templates/kc-modal.html').then(success);
	}

    dialog.confirmGenerateKeys = function(name, type, success) {
        var title = 'Generate new keys for realm';
        var msg = 'Are you sure you want to permanently generate new keys for ' + name + '?';
        var btns = {
            ok: {
                label: 'Generate Keys',
                cssClass: 'btn btn-danger'
            },
            cancel: {
                label: 'Cancel',
                cssClass: 'btn btn-default'
            }
        }

        openDialog(title, msg, btns, '/templates/kc-modal.html').then(success);
    }

    dialog.confirm = function(title, message, success, cancel) {
        var btns = {
            ok: {
                label: title,
                cssClass: 'btn btn-danger'
            },
            cancel: {
                label: 'Cancel',
                cssClass: 'btn btn-default'
            }
        }

        openDialog(title, message, btns, '/templates/kc-modal.html').then(success, cancel);
    }

    dialog.message = function(title, message, success, cancel) {
        var btns = {
            ok: {
                label: "Ok",
                cssClass: 'btn btn-default'
            }
        }

        openDialog(title, message, btns, '/templates/kc-modal-message.html').then(success, cancel);
    }

    dialog.open = function(title, message, btns, success, cancel) {
        openDialog(title, message, btns, '/templates/kc-modal.html').then(success, cancel);
    }

    return dialog
});

module.service('CopyDialog', function($modal) {
    var dialog = {};
    dialog.open = function (title, suggested, success) {
        var controller = function($scope, $modalInstance, title) {
            $scope.title = title;
            $scope.name = { value: 'Copy of ' + suggested };
            $scope.ok = function () {
                console.log('ok with name: ' + $scope.name);
                $modalInstance.close();
                success($scope.name.value);
            };
            $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
            };
        }
        $modal.open({
            templateUrl: resourceUrl + '/templates/kc-copy.html',
            controller: controller,
            resolve: {
                title: function() {
                    return title;
                }
            }
        });
    };
    return dialog;
});

module.factory('Notifications', function($rootScope, $timeout) {
	// time (in ms) the notifications are shown
	var delay = 5000;

	var notifications = {};
    notifications.current = { display: false };
    notifications.current.remove = function() {
        if (notifications.scheduled) {
            $timeout.cancel(notifications.scheduled);
            delete notifications.scheduled;
        }
        delete notifications.current.type;
        delete notifications.current.header;
        delete notifications.current.message;
        notifications.current.display = false;
        console.debug("Remove message");
    }

    $rootScope.notification = notifications.current;

	notifications.message = function(type, header, message) {
        notifications.current.type = type;
        notifications.current.header = header;
        notifications.current.message = message;
        notifications.current.display = true;

        notifications.scheduled = $timeout(function() {
            notifications.current.remove();
        }, delay);

        console.debug("Added message");
	}

	notifications.info = function(message) {
		notifications.message("info", "Info!", message);
	};

	notifications.success = function(message) {
		notifications.message("success", "Success!", message);
	};

	notifications.error = function(message) {
		notifications.message("danger", "Error!", message);
	};

	notifications.warn = function(message) {
		notifications.message("warning", "Warning!", message);
	};

	return notifications;
});

module.factory('Realm', function($resource) {
	return $resource(authUrl + '/admin/realms/:id', {
		id : '@realm'
	}, {
		update : {
			method : 'PUT'
		},
        create : {
            method : 'POST',
            params : { id : ''}
        }

    });
});

module.factory('RealmEventsConfig', function($resource) {
    return $resource(authUrl + '/admin/realms/:id/events/config', {
        id : '@realm'
    }, {
        update : {
            method : 'PUT'
        }
    });
});

module.factory('RealmEvents', function($resource) {
    return $resource(authUrl + '/admin/realms/:id/events', {
        id : '@realm'
    });
});

module.factory('RealmAdminEvents', function($resource) {
    return $resource(authUrl + '/admin/realms/:id/admin-events', {
        id : '@realm'
    });
});

module.factory('BruteForce', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/attack-detection/brute-force/usernames', {
        realm : '@realm'
    });
});

module.factory('BruteForceUser', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/attack-detection/brute-force/usernames/:username', {
        realm : '@realm',
        username : '@username'
    });
});


module.factory('RequiredActions', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/authentication/required-actions/:alias', {
        realm : '@realm',
        alias : '@alias'
    }, {
        update : {
            method : 'PUT'
        }
    });
});

module.factory('UnregisteredRequiredActions', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/authentication/unregistered-required-actions', {
        realm : '@realm'
    });
});

module.factory('RegisterRequiredAction', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/authentication/register-required-action', {
        realm : '@realm'
    });
});

module.factory('RealmLDAPConnectionTester', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/testLDAPConnection');
});

module.service('ServerInfo', function($resource, $q, $http) {
    var info = {};
    var delay = $q.defer();

    $http.get(authUrl + '/admin/serverinfo').success(function(data) {
        info = data;
        delay.resolve(info);
    });

    return {
        get: function() {
            return info;
        },
        reload: function() {
            $http.get(authUrl + '/admin/serverinfo').success(function(data) {
                angular.copy(data, info);
            });
        },
        promise: delay.promise
    }
});

module.factory('ClientInitialAccess', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/clients-initial-access/:id', {
        realm : '@realm',
        id : '@id'
    });
});


module.factory('ClientProtocolMapper', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/clients/:client/protocol-mappers/models/:id', {
        realm : '@realm',
        client: '@client',
        id : "@id"
    }, {
        update : {
            method : 'PUT'
        }
    });
});

module.factory('ClientTemplateProtocolMapper', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/client-templates/:template/protocol-mappers/models/:id', {
        realm : '@realm',
        template: '@template',
        id : "@id"
    }, {
        update : {
            method : 'PUT'
        }
    });
});

module.factory('User', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/users/:userId', {
        realm : '@realm',
        userId : '@userId'
    }, {
        update : {
            method : 'PUT'
        }
    });
});

module.factory('UserFederationInstances', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/user-federation/instances/:instance', {
        realm : '@realm',
        instance : '@instance'
    },  {
        update : {
            method : 'PUT'
        }
    });
});

module.factory('UserFederationProviders', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/user-federation/providers/:provider', {
        realm : '@realm',
        provider : "@provider"
    });
});

module.factory('UserFederationSync', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/user-federation/instances/:provider/sync');
});

module.factory('UserFederationMapperTypes', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/user-federation/instances/:provider/mapper-types', {
        realm : '@realm',
        provider : '@provider'
    });
});

module.factory('UserFederationMappers', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/user-federation/instances/:provider/mappers', {
        realm : '@realm',
        provider : '@provider'
    });
});

module.factory('UserFederationMapper', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/user-federation/instances/:provider/mappers/:mapperId', {
        realm : '@realm',
        provider : '@provider',
        mapperId: '@mapperId'
    }, {
        update: {
            method : 'PUT'
        }
    });
});

module.factory('UserFederationMapperSync', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/user-federation/instances/:provider/mappers/:mapperId/sync');
});


module.factory('UserSessionStats', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/users/:user/session-stats', {
        realm : '@realm',
        user : '@user'
    });
});
module.factory('UserSessions', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/users/:user/sessions', {
        realm : '@realm',
        user : '@user'
    });
});
module.factory('UserOfflineSessions', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/users/:user/offline-sessions/:client', {
        realm : '@realm',
        user : '@user',
        client : '@client'
    });
});

module.factory('UserSessionLogout', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/sessions/:session', {
        realm : '@realm',
        session : '@session'
    });
});

module.factory('UserLogout', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/users/:user/logout', {
        realm : '@realm',
        user : '@user'
    });
});

module.factory('UserFederatedIdentities', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/users/:user/federated-identity', {
        realm : '@realm',
        user : '@user'
    });
});
module.factory('UserFederatedIdentity', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/users/:user/federated-identity/:provider', {
        realm : '@realm',
        user : '@user',
        provider : '@provider'
    });
});

module.factory('UserConsents', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/users/:user/consents/:client', {
        realm : '@realm',
        user : '@user',
        client: '@client'
    });
});

module.factory('UserImpersonation', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/users/:user/impersonation', {
        realm : '@realm',
        user : '@user'
    });
});

module.factory('UserCredentials', function($resource) {
    var credentials = {};

    credentials.resetPassword = $resource(authUrl + '/admin/realms/:realm/users/:userId/reset-password', {
        realm : '@realm',
        userId : '@userId'
    }, {
        update : {
            method : 'PUT'
        }
    }).update;

    credentials.removeTotp = $resource(authUrl + '/admin/realms/:realm/users/:userId/remove-totp', {
        realm : '@realm',
        userId : '@userId'
    }, {
        update : {
            method : 'PUT'
        }
    }).update;

    return credentials;
});

module.factory('UserExecuteActionsEmail', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/users/:userId/execute-actions-email', {
        realm : '@realm',
        userId : '@userId'
    }, {
        update : {
            method : 'PUT'
        }
    });
});

module.factory('RealmRoleMapping', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/users/:userId/role-mappings/realm', {
        realm : '@realm',
        userId : '@userId'
    });
});

module.factory('CompositeRealmRoleMapping', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/users/:userId/role-mappings/realm/composite', {
        realm : '@realm',
        userId : '@userId'
    });
});

module.factory('AvailableRealmRoleMapping', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/users/:userId/role-mappings/realm/available', {
        realm : '@realm',
        userId : '@userId'
    });
});


module.factory('ClientRoleMapping', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/users/:userId/role-mappings/clients/:client', {
        realm : '@realm',
        userId : '@userId',
        client : "@client"
    });
});

module.factory('AvailableClientRoleMapping', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/users/:userId/role-mappings/clients/:client/available', {
        realm : '@realm',
        userId : '@userId',
        client : "@client"
    });
});

module.factory('CompositeClientRoleMapping', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/users/:userId/role-mappings/clients/:client/composite', {
        realm : '@realm',
        userId : '@userId',
        client : "@client"
    });
});

module.factory('ClientRealmScopeMapping', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/clients/:client/scope-mappings/realm', {
        realm : '@realm',
        client : '@client'
    });
});

module.factory('ClientAvailableRealmScopeMapping', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/clients/:client/scope-mappings/realm/available', {
        realm : '@realm',
        client : '@client'
    });
});

module.factory('ClientCompositeRealmScopeMapping', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/clients/:client/scope-mappings/realm/composite', {
        realm : '@realm',
        client : '@client'
    });
});

module.factory('ClientClientScopeMapping', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/clients/:client/scope-mappings/clients/:targetClient', {
        realm : '@realm',
        client : '@client',
        targetClient : '@targetClient'
    });
});

module.factory('ClientAvailableClientScopeMapping', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/clients/:client/scope-mappings/clients/:targetClient/available', {
        realm : '@realm',
        client : '@client',
        targetClient : '@targetClient'
    });
});

module.factory('ClientCompositeClientScopeMapping', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/clients/:client/scope-mappings/clients/:targetClient/composite', {
        realm : '@realm',
        client : '@client',
        targetClient : '@targetClient'
    });
});



module.factory('RealmRoles', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/roles', {
        realm : '@realm'
    });
});

module.factory('RoleRealmComposites', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/roles-by-id/:role/composites/realm', {
        realm : '@realm',
        role : '@role'
    });
});

module.factory('RealmPushRevocation', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/push-revocation', {
        realm : '@realm'
    });
});

module.factory('RealmSessionStats', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/session-stats', {
        realm : '@realm'
    });
});

module.factory('RealmClientSessionStats', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/client-session-stats', {
        realm : '@realm'
    });
});


module.factory('RoleClientComposites', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/roles-by-id/:role/composites/clients/:client', {
        realm : '@realm',
        role : '@role',
        client : "@client"
    });
});


function roleControl($scope, realm, role, roles, clients,
                     ClientRole, RoleById, RoleRealmComposites, RoleClientComposites,
                     $http, $location, Notifications, Dialog) {

    $scope.$watch(function () {
        return $location.path();
    }, function () {
        $scope.path = $location.path().substring(1).split("/");
    });

    $scope.$watch('role', function () {
        if (!angular.equals($scope.role, role)) {
            $scope.changed = true;
        }
    }, true);

    $scope.update = function () {
        RoleById.update({
            realm: realm.realm,
            role: role.id
        }, $scope.role, function () {
            $scope.changed = false;
            role = angular.copy($scope.role);
            Notifications.success("Your changes have been saved to the role.");
        });
    };

    $scope.reset = function () {
        $scope.role = angular.copy(role);
        $scope.changed = false;
    };

    if (!role.id) return;

    $scope.compositeSwitch = role.composite;
    $scope.compositeSwitchDisabled = role.composite;
    $scope.realmRoles = angular.copy(roles);
    $scope.selectedRealmRoles = [];
    $scope.selectedRealmMappings = [];
    $scope.realmMappings = [];
    $scope.clients = clients;
    $scope.clientRoles = [];
    $scope.selectedClientRoles = [];
    $scope.selectedClientMappings = [];
    $scope.clientMappings = [];

    for (var j = 0; j < $scope.realmRoles.length; j++) {
        if ($scope.realmRoles[j].id == role.id) {
            var realmRole = $scope.realmRoles[j];
            var idx = $scope.realmRoles.indexOf(realmRole);
            $scope.realmRoles.splice(idx, 1);
            break;
        }
    }


    $scope.realmMappings = RoleRealmComposites.query({realm : realm.realm, role : role.id}, function(){
        for (var i = 0; i < $scope.realmMappings.length; i++) {
            var role = $scope.realmMappings[i];
            for (var j = 0; j < $scope.realmRoles.length; j++) {
                var realmRole = $scope.realmRoles[j];
                if (realmRole.id == role.id) {
                    var idx = $scope.realmRoles.indexOf(realmRole);
                    if (idx != -1) {
                        $scope.realmRoles.splice(idx, 1);
                        break;
                    }
                }
            }
        }
    });

    $scope.addRealmRole = function() {
        $scope.compositeSwitchDisabled=true;
        $http.post(authUrl + '/admin/realms/' + realm.realm + '/roles-by-id/' + role.id + '/composites',
                $scope.selectedRealmRoles).success(function() {
                for (var i = 0; i < $scope.selectedRealmRoles.length; i++) {
                    var role = $scope.selectedRealmRoles[i];
                    var idx = $scope.realmRoles.indexOf($scope.selectedRealmRoles[i]);
                    if (idx != -1) {
                        $scope.realmRoles.splice(idx, 1);
                        $scope.realmMappings.push(role);
                    }
                }
                $scope.selectedRealmRoles = [];
                Notifications.success("Role added to composite.");
            });
    };

    $scope.deleteRealmRole = function() {
        $scope.compositeSwitchDisabled=true;
        $http.delete(authUrl + '/admin/realms/' + realm.realm + '/roles-by-id/' + role.id + '/composites',
            {data : $scope.selectedRealmMappings, headers : {"content-type" : "application/json"}}).success(function() {
                for (var i = 0; i < $scope.selectedRealmMappings.length; i++) {
                    var role = $scope.selectedRealmMappings[i];
                    var idx = $scope.realmMappings.indexOf($scope.selectedRealmMappings[i]);
                    if (idx != -1) {
                        $scope.realmMappings.splice(idx, 1);
                        $scope.realmRoles.push(role);
                    }
                }
                $scope.selectedRealmMappings = [];
                Notifications.success("Role removed from composite.");
            });
    };

    $scope.addClientRole = function() {
        $scope.compositeSwitchDisabled=true;
        $http.post(authUrl + '/admin/realms/' + realm.realm + '/roles-by-id/' + role.id + '/composites',
                $scope.selectedClientRoles).success(function() {
                for (var i = 0; i < $scope.selectedClientRoles.length; i++) {
                    var role = $scope.selectedClientRoles[i];
                    var idx = $scope.clientRoles.indexOf($scope.selectedClientRoles[i]);
                    if (idx != -1) {
                        $scope.clientRoles.splice(idx, 1);
                        $scope.clientMappings.push(role);
                    }
                }
                $scope.selectedClientRoles = [];
            });
    };

    $scope.deleteClientRole = function() {
        $scope.compositeSwitchDisabled=true;
        $http.delete(authUrl + '/admin/realms/' + realm.realm + '/roles-by-id/' + role.id + '/composites',
            {data : $scope.selectedClientMappings, headers : {"content-type" : "application/json"}}).success(function() {
                for (var i = 0; i < $scope.selectedClientMappings.length; i++) {
                    var role = $scope.selectedClientMappings[i];
                    var idx = $scope.clientMappings.indexOf($scope.selectedClientMappings[i]);
                    if (idx != -1) {
                        $scope.clientMappings.splice(idx, 1);
                        $scope.clientRoles.push(role);
                    }
                }
                $scope.selectedClientMappings = [];
            });
    };


    $scope.changeClient = function() {
        $scope.clientRoles = ClientRole.query({realm : realm.realm, client : $scope.compositeClient.id}, function() {
                $scope.clientMappings = RoleClientComposites.query({realm : realm.realm, role : role.id, client : $scope.compositeClient.id}, function(){
                    for (var i = 0; i < $scope.clientMappings.length; i++) {
                        var role = $scope.clientMappings[i];
                        for (var j = 0; j < $scope.clientRoles.length; j++) {
                            var realmRole = $scope.clientRoles[j];
                            if (realmRole.id == role.id) {
                                var idx = $scope.clientRoles.indexOf(realmRole);
                                if (idx != -1) {
                                    $scope.clientRoles.splice(idx, 1);
                                    break;
                                }
                            }
                        }
                    }
                });
                for (var j = 0; j < $scope.clientRoles.length; j++) {
                    if ($scope.clientRoles[j] == role.id) {
                        var appRole = $scope.clientRoles[j];
                        var idx = $scope.clientRoles.indexof(appRole);
                        $scope.clientRoles.splice(idx, 1);
                        break;
                    }
                }
            }
        );
    };




}


module.factory('Role', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/roles/:role', {
        realm : '@realm',
        role : '@role'
    },  {
        update : {
            method : 'PUT'
        }
    });
});

module.factory('RoleById', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/roles-by-id/:role', {
        realm : '@realm',
        role : '@role'
    },  {
        update : {
            method : 'PUT'
        }
    });
});

module.factory('ClientRole', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/clients/:client/roles/:role', {
        realm : '@realm',
        client : "@client",
        role : '@role'
    },  {
        update : {
            method : 'PUT'
        }
    });
});

module.factory('ClientClaims', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/clients/:client/claims', {
        realm : '@realm',
        client : "@client"
    },  {
        update : {
            method : 'PUT'
        }
    });
});

module.factory('ClientProtocolMappersByProtocol', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/clients/:client/protocol-mappers/protocol/:protocol', {
        realm : '@realm',
        client : "@client",
        protocol : "@protocol"
    });
});

module.factory('ClientTemplateProtocolMappersByProtocol', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/client-templates/:template/protocol-mappers/protocol/:protocol', {
        realm : '@realm',
        template : "@template",
        protocol : "@protocol"
    });
});

module.factory('ClientTemplateRealmScopeMapping', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/client-templates/:template/scope-mappings/realm', {
        realm : '@realm',
        template : '@template'
    });
});

module.factory('ClientTemplateAvailableRealmScopeMapping', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/client-templates/:template/scope-mappings/realm/available', {
        realm : '@realm',
        template : '@template'
    });
});

module.factory('ClientTemplateCompositeRealmScopeMapping', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/client-templates/:template/scope-mappings/realm/composite', {
        realm : '@realm',
        template : '@template'
    });
});

module.factory('ClientTemplateClientScopeMapping', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/client-templates/:template/scope-mappings/clients/:targetClient', {
        realm : '@realm',
        template : '@template',
        targetClient : '@targetClient'
    });
});

module.factory('ClientTemplateAvailableClientScopeMapping', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/client-templates/:template/scope-mappings/clients/:targetClient/available', {
        realm : '@realm',
        template : '@template',
        targetClient : '@targetClient'
    });
});

module.factory('ClientTemplateCompositeClientScopeMapping', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/client-templates/:template/scope-mappings/clients/:targetClient/composite', {
        realm : '@realm',
        template : '@template',
        targetClient : '@targetClient'
    });
});


module.factory('ClientSessionStats', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/clients/:client/session-stats', {
        realm : '@realm',
        client : "@client"
    });
});

module.factory('ClientSessionStatsWithUsers', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/clients/:client/session-stats?users=true', {
        realm : '@realm',
        client : "@client"
    });
});

module.factory('ClientSessionCount', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/clients/:client/session-count', {
        realm : '@realm',
        client : "@client"
    });
});

module.factory('ClientUserSessions', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/clients/:client/user-sessions', {
        realm : '@realm',
        client : "@client"
    });
});

module.factory('ClientOfflineSessionCount', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/clients/:client/offline-session-count', {
        realm : '@realm',
        client : "@client"
    });
});

module.factory('ClientOfflineSessions', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/clients/:client/offline-sessions', {
        realm : '@realm',
        client : "@client"
    });
});

module.factory('ClientLogoutAll', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/clients/:client/logout-all', {
        realm : '@realm',
        client : "@client"
    });
});
module.factory('ClientLogoutUser', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/clients/:client/logout-user/:user', {
        realm : '@realm',
        client : "@client",
        user : "@user"
    });
});
module.factory('RealmLogoutAll', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/logout-all', {
        realm : '@realm'
    });
});

module.factory('ClientPushRevocation', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/clients/:client/push-revocation', {
        realm : '@realm',
        client : "@client"
    });
});

module.factory('ClientClusterNode', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/clients/:client/nodes/:node', {
        realm : '@realm',
        client : "@client"
    });
});

module.factory('ClientTestNodesAvailable', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/clients/:client/test-nodes-available', {
        realm : '@realm',
        client : "@client"
    });
});

module.factory('ClientCertificate', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/clients/:client/certificates/:attribute', {
            realm : '@realm',
            client : "@client",
            attribute: "@attribute"
        });
});

module.factory('ClientCertificateGenerate', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/clients/:client/certificates/:attribute/generate', {
            realm : '@realm',
            client : "@client",
            attribute: "@attribute"
        },
        {
            generate : {
                method : 'POST'
            }
        });
});

module.factory('ClientCertificateDownload', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/clients/:client/certificates/:attribute/download', {
        realm : '@realm',
        client : "@client",
        attribute: "@attribute"
    },
        {
            download : {
                method : 'POST',
                responseType: 'arraybuffer'
            }
        });
});

module.factory('Client', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/clients/:client', {
        realm : '@realm',
        client : '@client'
    },  {
        update : {
            method : 'PUT'
        }
    });
});

module.factory('ClientTemplate', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/client-templates/:template', {
        realm : '@realm',
        template : '@template'
    },  {
        update : {
            method : 'PUT'
        }
    });
});


module.factory('ClientDescriptionConverter', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/client-description-converter', {
        realm : '@realm'
    });
});

/*
module.factory('ClientInstallation', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/clients/:client/installation/providers/:provider', {
        realm : '@realm',
        client : '@client',
        provider : '@provider'
    });
});
*/



module.factory('ClientInstallation', function($resource) {
    var url = authUrl + '/admin/realms/:realm/clients/:client/installation/providers/:provider';
    return {
        url : function(parameters)
        {
            return url.replace(':realm', parameters.realm).replace(':client', parameters.client).replace(':provider', parameters.provider);
        }
    }
});

module.factory('ClientInstallationJBoss', function($resource) {
    var url = authUrl + '/admin/realms/:realm/clients/:client/installation/jboss';
    return {
        url : function(parameters)
     {
        return url.replace(':realm', parameters.realm).replace(':client', parameters.client);
    }
    }
});

module.factory('ClientSecret', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/clients/:client/client-secret', {
        realm : '@realm',
        client : '@client'
    },  {
        update : {
            method : 'POST'
        }
    });
});

module.factory('ClientRegistrationAccessToken', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/clients/:client/registration-access-token', {
        realm : '@realm',
        client : '@client'
    },  {
        update : {
            method : 'POST'
        }
    });
});

module.factory('ClientOrigins', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/clients/:client/allowed-origins', {
        realm : '@realm',
        client : '@client'
    },  {
        update : {
            method : 'PUT',
            isArray : true
        }
    });
});

module.factory('ClientServiceAccountUser', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/clients/:client/service-account-user', {
        realm : '@realm',
        client : '@client'
    });
});

module.factory('Current', function(Realm, $route, $rootScope) {
    var current = {
        realms: {},
        realm: null
    };

    $rootScope.$on('$routeChangeStart', function() {
        current.realms = Realm.query(null, function(realms) {
            var currentRealm = null;
            if ($route.current.params.realm) {
                for (var i = 0; i < realms.length; i++) {
                    if (realms[i].realm == $route.current.params.realm) {
                        currentRealm =  realms[i];
                    }
                }
            }
            current.realm = currentRealm;
        });
    });

    return current;
});

module.factory('TimeUnit', function() {
    var t = {};

    t.autoUnit = function(time) {
        if (!time) {
            return 'Hours';
        }

        var unit = 'Seconds';
        if (time % 60 == 0) {
            unit = 'Minutes';
            time  = time / 60;
        }
        if (time % 60 == 0) {
            unit = 'Hours';
            time = time / 60;
        }
        if (time % 24 == 0) {
            unit = 'Days'
            time = time / 24;
        }
        return unit;
    }

    t.toSeconds = function(time, unit) {
        switch (unit) {
            case 'Seconds': return time;
            case 'Minutes': return time * 60;
            case 'Hours': return time * 3600;
            case 'Days': return time * 86400;
            default: throw 'invalid unit ' + unit;
        }
    }

    t.toUnit = function(time, unit) {
        switch (unit) {
            case 'Seconds': return time;
            case 'Minutes': return Math.ceil(time / 60);
            case 'Hours': return Math.ceil(time / 3600);
            case 'Days': return Math.ceil(time / 86400);
            default: throw 'invalid unit ' + unit;
        }
    }

    t.convert = function(time, from, to) {
        var seconds = t.toSeconds(time, from);
        return t.toUnit(seconds, to);
    }

    return t;
});


module.factory('PasswordPolicy', function() {
    var p = {};

    p.policyMessages = {
        hashAlgorithm: 	"Default hashing algorithm.  Default is 'pbkdf2'.",
        hashIterations: 	"Number of hashing iterations.  Default is 1.  Recommended is 50000.",
        length:         	"Minimal password length (integer type). Default value is 8.",
        digits:         	"Minimal number (integer type) of digits in password. Default value is 1.",
        lowerCase:      	"Minimal number (integer type) of lowercase characters in password. Default value is 1.",
        upperCase:      	"Minimal number (integer type) of uppercase characters in password. Default value is 1.",
        specialChars:   	"Minimal number (integer type) of special characters in password. Default value is 1.",
        notUsername:    	"Block passwords that are equal to the username",
        regexPattern:  	    "Block passwords that do not match the regex pattern (string type).",
        passwordHistory:  	"Block passwords that are equal to previous passwords. Default value is 3.",
        forceExpiredPasswordChange:  	"Force password change when password credential is expired. Default value is 365 days."
    }

    p.allPolicies = [
        { name: 'hashAlgorithm', value: 'pbkdf2' },
        { name: 'hashIterations', value: 1 },
        { name: 'length', value: 8 },
        { name: 'digits', value: 1 },
        { name: 'lowerCase', value: 1 },
        { name: 'upperCase', value: 1 },
        { name: 'specialChars', value: 1 },
        { name: 'notUsername', value: 1 },
        { name: 'regexPattern', value: ''},
        { name: 'passwordHistory', value: 3 },
        { name: 'forceExpiredPasswordChange', value: 365 }
    ];

    p.parse = function(policyString) {
        var policies = [];
        var re, policyEntry;

        if (!policyString || policyString.length == 0){
            return policies;
        }

        var policyArray = policyString.split(" and ");

        for (var i = 0; i < policyArray.length; i ++){
            var policyToken = policyArray[i];
            
            if(policyToken.indexOf('regexPattern') === 0) {
            	re = /(\w+)\((.*)\)/;
            	policyEntry = re.exec(policyToken);
                if (null !== policyEntry) {
                	policies.push({ name: policyEntry[1], value: policyEntry[2] });
                }
            } else {
            	re = /(\w+)\(*(\d*)\)*/;
            	policyEntry = re.exec(policyToken);
                if (null !== policyEntry) {
                	policies.push({ name: policyEntry[1], value: parseInt(policyEntry[2]) });
                }
            }
        }
        return policies;
    };

    p.toString = function(policies) {
        if (!policies || policies.length == 0) {
            return "";
        }

        var policyString = "";

        for (var i in policies){
            policyString += policies[i].name;
            if ( policies[i].value ){
                policyString += '(' + policies[i].value + ')';
            }
            policyString += " and ";
        }

        policyString = policyString.substring(0, policyString.length - 5);

        return policyString;
    };

    return p;
});

module.filter('removeSelectedPolicies', function() {
    return function(policies, selectedPolicies) {
        var result = [];
        for(var i in policies) {
            var policy = policies[i];
            var policyAvailable = true;
            for(var j in selectedPolicies) {
                if(policy.name === selectedPolicies[j].name && policy.name !== 'regexPattern') {
                    policyAvailable = false;
                }
            }
            if(policyAvailable) {
                result.push(policy);
            }
        }
        return result;
    }
});

module.factory('IdentityProvider', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/identity-provider/instances/:alias', {
        realm : '@realm',
        alias : '@alias'
    }, {
        update: {
            method : 'PUT'
        }
    });
});

module.factory('IdentityProviderExport', function($resource) {
    var url = authUrl + '/admin/realms/:realm/identity-provider/instances/:alias/export';
    return {
        url : function(parameters)
        {
            return url.replace(':realm', parameters.realm).replace(':alias', parameters.alias);
        }
    }
});

module.factory('IdentityProviderFactory', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/identity-provider/providers/:provider_id', {
        realm : '@realm',
        provider_id : '@provider_id'
    });
});

module.factory('IdentityProviderMapperTypes', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/identity-provider/instances/:alias/mapper-types', {
        realm : '@realm',
        alias : '@alias'
    });
});

module.factory('IdentityProviderMappers', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/identity-provider/instances/:alias/mappers', {
        realm : '@realm',
        alias : '@alias'
    });
});

module.factory('IdentityProviderMapper', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/identity-provider/instances/:alias/mappers/:mapperId', {
        realm : '@realm',
        alias : '@alias',
        mapperId: '@mapperId'
    }, {
        update: {
            method : 'PUT'
        }
    });
});

module.factory('AuthenticationFlowExecutions', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/authentication/flows/:alias/executions', {
        realm : '@realm',
        alias : '@alias'
    }, {
        update : {
            method : 'PUT'
        }
    });
});

module.factory('CreateExecutionFlow', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/authentication/flows/:alias/executions/flow', {
        realm : '@realm',
        alias : '@alias'
    });
});

module.factory('CreateExecution', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/authentication/flows/:alias/executions/execution', {
        realm : '@realm',
        alias : '@alias'
    });
});

module.factory('AuthenticationFlows', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/authentication/flows/:flow', {
        realm : '@realm',
        flow: '@flow'
    });
});

module.factory('AuthenticationFormProviders', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/authentication/form-providers', {
        realm : '@realm'
    });
});

module.factory('AuthenticationFormActionProviders', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/authentication/form-action-providers', {
        realm : '@realm'
    });
});

module.factory('AuthenticatorProviders', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/authentication/authenticator-providers', {
        realm : '@realm'
    });
});

module.factory('ClientAuthenticatorProviders', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/authentication/client-authenticator-providers', {
        realm : '@realm'
    });
});


module.factory('AuthenticationFlowsCopy', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/authentication/flows/:alias/copy', {
        realm : '@realm',
        alias : '@alias'
    });
});
module.factory('AuthenticationConfigDescription', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/authentication/config-description/:provider', {
        realm : '@realm',
        provider: '@provider'
    });
});
module.factory('PerClientAuthenticationConfigDescription', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/authentication/per-client-config-description', {
        realm : '@realm'
    });
});

module.factory('AuthenticationConfig', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/authentication/config/:config', {
        realm : '@realm',
        config: '@config'
    }, {
        update: {
            method : 'PUT'
        }
    });
});
module.factory('AuthenticationExecutionConfig', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/authentication/executions/:execution/config', {
        realm : '@realm',
        execution: '@execution'
    });
});

module.factory('AuthenticationExecution', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/authentication/executions/:execution', {
        realm : '@realm',
        execution : '@execution'
    }, {
        update : {
            method : 'PUT'
        }
    });
});

module.factory('AuthenticationExecutionRaisePriority', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/authentication/executions/:execution/raise-priority', {
        realm : '@realm',
        execution : '@execution'
    });
});

module.factory('AuthenticationExecutionLowerPriority', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/authentication/executions/:execution/lower-priority', {
        realm : '@realm',
        execution : '@execution'
    });
});



module.service('SelectRoleDialog', function($modal) {
    var dialog = {};

    var openDialog = function(title, message, btns) {
        var controller = function($scope, $modalInstance, title, message, btns) {
            $scope.title = title;
            $scope.message = message;
            $scope.btns = btns;

            $scope.ok = function () {
                $modalInstance.close();
            };
            $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
            };
        };

        return $modal.open({
            templateUrl: resourceUrl + '/templates/kc-modal.html',
            controller: controller,
            resolve: {
                title: function() {
                    return title;
                },
                message: function() {
                    return message;
                },
                btns: function() {
                    return btns;
                }
            }
        }).result;
    }

    var escapeHtml = function(str) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    };

    dialog.confirmDelete = function(name, type, success) {
        var title = 'Delete ' + escapeHtml(type.charAt(0).toUpperCase() + type.slice(1));
        var msg = 'Are you sure you want to permanently delete the ' + type + ' ' + name + '?';
        var btns = {
            ok: {
                label: 'Delete',
                cssClass: 'btn btn-danger'
            },
            cancel: {
                label: 'Cancel',
                cssClass: 'btn btn-default'
            }
        }

        openDialog(title, msg, btns).then(success);
    }

    dialog.confirmGenerateKeys = function(name, type, success) {
        var title = 'Generate new keys for realm';
        var msg = 'Are you sure you want to permanently generate new keys for ' + name + '?';
        var btns = {
            ok: {
                label: 'Generate Keys',
                cssClass: 'btn btn-danger'
            },
            cancel: {
                label: 'Cancel',
                cssClass: 'btn btn-default'
            }
        }

        openDialog(title, msg, btns).then(success);
    }

    dialog.confirm = function(title, message, success, cancel) {
        var btns = {
            ok: {
                label: title,
                cssClass: 'btn btn-danger'
            },
            cancel: {
                label: 'Cancel',
                cssClass: 'btn btn-default'
            }
        }

        openDialog(title, message, btns).then(success, cancel);
    }

    return dialog
});

module.factory('Group', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/groups/:groupId', {
        realm : '@realm',
        userId : '@groupId'
    }, {
        update : {
            method : 'PUT'
        }
    });
});

module.factory('GroupChildren', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/groups/:groupId/children', {
        realm : '@realm',
        groupId : '@groupId'
    });
});

module.factory('Groups', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/groups', {
        realm : '@realm'
    });
});

module.factory('GroupRealmRoleMapping', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/groups/:groupId/role-mappings/realm', {
        realm : '@realm',
        groupId : '@groupId'
    });
});

module.factory('GroupCompositeRealmRoleMapping', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/groups/:groupId/role-mappings/realm/composite', {
        realm : '@realm',
        groupId : '@groupId'
    });
});

module.factory('GroupAvailableRealmRoleMapping', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/groups/:groupId/role-mappings/realm/available', {
        realm : '@realm',
        groupId : '@groupId'
    });
});


module.factory('GroupClientRoleMapping', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/groups/:groupId/role-mappings/clients/:client', {
        realm : '@realm',
        groupId : '@groupId',
        client : "@client"
    });
});

module.factory('GroupAvailableClientRoleMapping', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/groups/:groupId/role-mappings/clients/:client/available', {
        realm : '@realm',
        groupId : '@groupId',
        client : "@client"
    });
});

module.factory('GroupCompositeClientRoleMapping', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/groups/:groupId/role-mappings/clients/:client/composite', {
        realm : '@realm',
        groupId : '@groupId',
        client : "@client"
    });
});

module.factory('GroupMembership', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/groups/:groupId/members', {
        realm : '@realm',
        groupId : '@groupId'
    });
});


module.factory('UserGroupMembership', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/users/:userId/groups', {
        realm : '@realm',
        userId : '@userId'
    });
});

module.factory('UserGroupMapping', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/users/:userId/groups/:groupId', {
        realm : '@realm',
        userId : '@userId',
        groupId : '@groupId'
    }, {
        update : {
            method : 'PUT'
        }
    });
});

module.factory('DefaultGroups', function($resource) {
    return $resource(authUrl + '/admin/realms/:realm/default-groups/:groupId', {
        realm : '@realm',
        groupId : '@groupId'
    }, {
        update : {
            method : 'PUT'
        }
    });
});