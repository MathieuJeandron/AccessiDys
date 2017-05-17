/*File: tagsService.js
 *
 * Copyright (c) 2013-2016
 * Centre National d’Enseignement à Distance (Cned), Boulevard Nicephore Niepce, 86360 CHASSENEUIL-DU-POITOU, France
 * (direction-innovation@cned.fr)
 *
 * GNU Affero General Public License (AGPL) version 3.0 or later version
 *
 * This file is part of a program which is free software: you can
 * redistribute it and/or modify it under the terms of the
 * GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with this program.
 * If not, see <http://www.gnu.org/licenses/>.
 *
 */
'use strict';

var cnedApp = cnedApp;

cnedApp.service('profilsService', function ($http, configuration, fileStorageService,
                                            $localForage, synchronisationStoreService, $rootScope,
                                            $uibModal, $log, $q, UtilsService, UserService, CacheProvider) {

    var self = this;

    /**
     * Add the given profile.
     * @param profile :
        *            The profile to be saved.
     */
    this.saveProfile = function (profile) {
        var deferred = $q.defer();

        var profileToSave = angular.copy(profile);

        profileToSave.data.updated = new Date();
        profileToSave.filename = profileToSave.data.nom;
        profileToSave.data.className = this.generateClassName(profileToSave, false);

        for (var i = 0; i < profileToSave.data.profileTags.length; i++) {
            delete profileToSave.data.profileTags[i].tagDetail;
        }

        $log.debug('Save Profile', profileToSave);

        if (profileToSave.data._id && $rootScope.isAppOnline) {
            // send profile to accessidys backend
            if (profileToSave.data._id) {
                // Update mode
                return this.update(profileToSave).then(function (res) {
                    deferred.resolve(res.data);
                }, function () {
                    deferred.reject();
                });
            } else {
                // Create mode
                return this.create(profileToSave).then(function (res) {
                    deferred.resolve(res.data);
                }, function () {
                    deferred.reject();
                });
            }
        } else {
            fileStorageService.save(profileToSave, 'profile').then(function (res) {
                deferred.resolve(res);
            }, function () {
                deferred.reject();
            });
        }

        return deferred.promise;

    };

    /**
     * Create a profile to accessidys backend
     * @param profile
     * @returns {HttpPromise}
     */
    this.create = function (profile) {
        return $http.post('/profile', {
            profile: profile
        }, {
            headers: {
                'AccessiDys-user': UserService.getData().email,
                'AccessiDys-provider': UserService.getData().provider
            }
        });
    };

    /**
     * Update a profile to accessidys backend
     * @param profile
     * @returns {HttpPromise}
     */
    this.update = function (profile) {
        return $http.put('/profile', {
            profile: profile
        }, {
            headers: {
                'AccessiDys-user': UserService.getData().email,
                'AccessiDys-provider': UserService.getData().provider
            }
        });
    };

    /**
     * Delete a profile
     * @param profile
     * @returns {HttpPromise|*|{method}}
     */
    this.deleteProfil = function (profile) {
        if (profile.data._id && $rootScope.isAppOnline) {

            var deferred = $q.defer();

            $http.delete('/profile/' + profile.data._id, {
                headers: {
                    'AccessiDys-user': UserService.getData().email,
                    'AccessiDys-provider': UserService.getData().provider
                }
            }).then(function () {
                deferred.resolve();
            }, function () {
                deferred.reject();
            });

            return deferred.promise;

        } else {
            return fileStorageService.delete(profile, 'profile');
        }
    };


    /**
     * Look for a profile of the same name.
     *
     * @param profil
     *            le profil
     */
    this.lookForExistingProfile = function (profile) {

        return fileStorageService.list('profile').then(function (profiles) {
            var isFound = false;
            _.each(profiles, function (item) {
                if (profile.data.nom === item.filename) {
                    isFound = true;
                }
            });
            return isFound;
        });
    };

    this.delegateProfile = function (profile, to) {

        var deferred = $q.defer();

        var profileToDelegate = angular.copy(profile);

        for (var i = 0; i < profileToDelegate.data.profileTags.length; i++) {
            delete profileToDelegate.data.profileTags[i]._id;
            delete profileToDelegate.data.profileTags[i].profil;
            delete profileToDelegate.data.profileTags[i].tagDetail;
        }

        profileToDelegate.data.preDelegated = to;

        $log.debug('profile to delegate', profileToDelegate);

        if (profileToDelegate.data._id) {

            this.update(profileToDelegate).then(function (res) {
                deferred.resolve(res.data);
            }, function () {
                deferred.reject();
            });

        } else {
            this.create(profileToDelegate).then(function (res) {
                fileStorageService.delete(profileToDelegate, 'profile').then(function () {
                    deferred.resolve(res.data);
                }, function () {
                    deferred.reject();
                });
            }, function () {
                deferred.reject();
            })
        }

        return deferred.promise;
    };

    this.openDelegateProfileModal = function (profile) {

        return $uibModal.open({
            templateUrl: 'views/profiles/delegate-profile.modal.html',
            controller: 'DelegateProfileModalCtrl',
            size: 'md',
            resolve: {
                profile: function () {
                    return profile;
                }
            }
        }).result;

    };


    this.getProfiles = function () {

        return $q.all([$http.get('/profiles', {
            headers: {
                'AccessiDys-user': UserService.getData().email
            }
        }).then(function (res) {

            return res.data;

        }), fileStorageService.list('profile').then(function (files) {

            var userProfiles = [];

            if (files) {
                for (var i = 0; i < files.length; i++) {
                    userProfiles.push(fileStorageService.getData(files[i], 'profile').then(function (file) {
                        return file;
                    }));
                }
            }


            return $q.all(userProfiles);

        })]).then(function (res) {

            var result = res[0].concat(res[1]);

            CacheProvider.saveAll(result, 'listProfile').then(function () {
            });

            return result;
        })
    };

    this.getProfile = function (profileId) {
        return $http.get('/profile/' + profileId).then(function (res) {
            return res.data;
        });
    };

    this.generateClassName = function (profile, isTmp) {

        var className = '';

        if (profile && profile.data) {

            var formattedName = UtilsService.cleanUpSpecialChars(profile.data.nom).trim().replace(/ /g, '-');

            className = 'profile-' + formattedName;

            if (isTmp) {
                className += '-tmp';
            }

        }


        return className;
    };

});
