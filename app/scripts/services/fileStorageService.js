/*File: fileStorageService.js
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

cnedApp.service('fileStorageService', function ($localForage, configuration, $q, synchronisationStoreService, $log, CacheProvider, DropboxProvider, UserService, $rootScope, md5) {

    var self = this;

    /** ************** Document management (offline/online) ******************* */

    /**
     *
     * Search files on Dropbox, updates the cache
     * if the files have been found. Returns a list of files from the cache
     * @param online
     *            if there is internet access
     * @param token
     *            the dropbox token
     * @method list
     */
    this.list = function (type) {
        $log.debug('fileStorageService - list ', UserService.getData());
        var query = '';
        var storageName = '';

        if (type === 'document') {
            query = '.html';
            storageName = 'listDocument';
        } else if (type === 'profile') {
            query = '-profile.json';
            storageName = 'listProfile';
        }

        if ($rootScope.isAppOnline && UserService.getData() && UserService.getData().provider) {
            return DropboxProvider.search(query, UserService.getData().token).then(function (files) {
                return CacheProvider.saveAll(files, storageName);
            }, function () {
                return CacheProvider.list(storageName);
            });
        } else {
            // Resolve Cache
            return CacheProvider.list(storageName);
        }
    };

    /**
     * Search files in Dropbox or in the cache if dropbox is not accessible
     *
     * @param online
     *           if there is internet access
     * @param query
     *            the search query
     * @param token
     *            the dropbox token
     * @method get
     */
    this.get = function (filename, type) {

        var storageName = '';

        if (type === 'document') {
            storageName = 'listDocument';
        } else if (type === 'profile') {
            storageName = 'listProfile';
        }

        if ($rootScope.isAppOnline && UserService.getData() && UserService.getData().provider) {

            return DropboxProvider.search('_' + filename + '_', UserService.getData().token).then(function (files) {

                if (files) {
                    for (var i = 0; i < files.length; i++) {
                        if (files[i].filename === filename) {
                            return DropboxProvider.download(files[i].filepath, UserService.getData().token).then(function (fileContent) {
                                files[i].data = fileContent;

                                return CacheProvider.save(files[i], storageName);
                            });
                        }
                    }
                }

            }, function () {
                return CacheProvider.get(filename, storageName);
            });

        } else {
            return CacheProvider.get(filename, storageName);
        }
    };

    /**
     * Search files in Dropbox or in the cache if dropbox is not accessible
     *
     * @param online
     *           if there is internet access
     * @param query
     *            the search query
     * @param token
     *            the dropbox token
     * @method get
     */
    this.getData = function (file, type) {

        var storageName = '';

        if (type === 'document') {
            storageName = 'listDocument';
        } else if (type === 'profile') {
            storageName = 'listProfile';
        }

        if ($rootScope.isAppOnline && UserService.getData() && UserService.getData().provider) {

            return DropboxProvider.download(file.filepath, UserService.getData().token).then(function (fileContent) {
                file.data = fileContent;

                return CacheProvider.save(file, storageName).then(function(fileSaved){
                    return fileSaved;
                });
            }, function(){
                return null;
            });

        } else {
            return CacheProvider.get(file, storageName).then(function(fileFound){
                return fileFound.data;
            });
        }
    };

    this.save = function (file, type) {

        var storageName = '';
        var extension = '';

        if (type === 'document') {
            storageName = 'listDocument';
            extension = '.html';
        } else if (type === 'profile') {
            storageName = 'listProfile';
            extension = '-profile.json';
        }

        if(!file.filepath){
            file.filepath = this.generateFilepath(file.filename, extension);
        }

        if ($rootScope.isAppOnline && UserService.getData() && UserService.getData().provider) {

            return DropboxProvider.upload(file.filepath, file.data, UserService.getData().token).then(function (file) {
                return CacheProvider.save(file, storageName);
            });

        } else {
            return CacheProvider.save(file, storageName);
        }
    };


    /**
     * Renames the file on Dropbox and if possible in the cache.
     * @param online
     *            if there is internet access
     * @param oldFilename
     *            the old file name.
     * @param newFilename
     *            the new file name.
     * @param le
     *           the dropbox token
     * @method renameFile
     */
    this.rename = function (file, newName, type) {
        $log.debug('FileStorageService - rename - params file', file);
        $log.debug('FileStorageService - rename - params newName', newName);
        $log.debug('FileStorageService - rename - params type', type);

        var storageName = '';
        var extension = '';

        if (type === 'document') {
            storageName = 'listDocument';
            extension = '.html';
        } else if (type === 'profile') {
            storageName = 'listProfile';
            extension = '.json';
        }

        var newFilePath = this.generateFilepath(newName, extension);


        if ($rootScope.isAppOnline && UserService.getData() && UserService.getData().provider) {
            if (UserService.getData().provider === 'dropbox') {
                return DropboxProvider.rename(file.filepath, newFilePath, UserService.getData().token).then(function (data) {
                    return CacheProvider.delete(file, storageName).then(function () {
                        return CacheProvider.save(data, storageName);
                    });
                });
            }
        } else {
            /*var d = Date.parse(new Date());
             var docToSynchronize = {
             owner: $rootScope.currentUser.local.email,
             docName: newFilename,
             filename: shortFilename,
             newDocName: newFilename,
             oldDocName: oldFilename,
             action: 'rename',
             dateModification: d
             };
             synchronisationStoreService.storeDocumentToSynchronize(docToSynchronize);*/
            return CacheProvider.delete(file, storageName).then(function () {
                return CacheProvider.save(data, storageName);
            });
        }
    };

    /**
     * Delete the file on Dropbox and if possible in the cache.
     *
     * @param online
     *            if there is internet access
     * @param filename
     *            the name of the file
     * @param le
     *           the dropbox token
     * @method deleteFile
     */
    this.delete = function (file, type) {

        var storageName = '';

        if (type === 'document') {
            storageName = 'listDocument';
        } else if (type === 'profile') {
            storageName = 'listProfile';
        }

        if ($rootScope.isAppOnline && UserService.getData() && UserService.getData().provider) {
            return DropboxProvider.delete(file.filepath, UserService.getData().token).then(function () {
                return CacheProvider.delete(file, storageName);
            });
        } else {
            /*var docToSynchronize = {
             owner: $rootScope.currentUser.local.email,
             docName: filename,
             action: 'delete',
             content: null
             };
             synchronisationStoreService.storeDocumentToSynchronize(docToSynchronize);*/
            return CacheProvider.delete(file, storageName);
        }

    };

    /**
     * Share the file on dropbox and returns the sharing URL.
     *
     * @method shareFile
     */
    this.shareFile = function (file) {
        if (UserService.getData() && UserService.getData().token) {
            return DropboxProvider.shareLink(file.filepath, UserService.getData().token).then(function (result) {
                return result.url;
            });
        } else {
            return null;
        }
    };


    /** **************************** storage Management ******************** */

    /**
     * Save the contents of the file for printing.
     *
     * @param filecontent
     *            The content fo the file
     * @return a promise
     * @method saveTempFileForPrint
     */
    this.saveTempFileForPrint = function (fileContent) {
        return $localForage.setItem('printTemp', fileContent);
    };


    /**
     * Return the document to be printed.
     */
    this.getTempFileForPrint = function () {
        return $localForage.getItem('printTemp');
    };

    /**
     * Save the contents of the temporary file.
     * @param filecontent
     *             The content fo the file
     * @method saveTempFile
     */
    this.saveTempFile = function (filecontent) {
        return $localForage.setItem('docTemp', filecontent);
    };

    /**
     * Retrieve the contents of the temporary file
     *
     * @method getTempFile
     */
    this.getTempFile = function () {
        return $localForage.getItem('docTemp');
    };

    this.generateFilepath = function (fileName, extension) {
        var now = new Date();
        var tmpDate = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate();
        var hash = md5.createHash(fileName);

        return '/' + tmpDate + '_' + encodeURIComponent(fileName) + '_' + hash + extension;
    };


});