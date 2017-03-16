/* File: print.js
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

/*jshint loopfunc:true*/
/*global
 $:false, angular
 */

'use strict';

angular.module('cnedApp').controller('PrintCtrl', function ($scope, $rootScope, $http, $window, $location,
                                                            $routeParams, $q, $log, $timeout, configuration,
                                                            dropbox, removeHtmlTags, workspaceService, serviceCheck,
                                                            fileStorageService, LoaderService) {

    $scope.notes = [];
    $scope.forceApplyRules = true;

    var offset = 0,
        summaryOffset = 0;

    /**
     * styling
     */
    var floatLeftStyle = {
        'width': '700px',
        'float': 'left',
        'margin-left': '40px',
        'margin-top': '40px',
        'border-right': '1px solid grey'
    };

    var centeredStyle = {
        'width': '700px',
        'margin-left': 'auto',
        'margin-right': 'auto'
    };

    /**
     * Shows the title of the document.
     */
    function showTitleDoc(title) {
        $scope.docName = title;
    }

    /**
     * Shows loading popup.
     */
    $scope.showAdaptationLoader = function () {
        LoaderService.showLoader('document.message.info.adapt.inprogress', false);
    };

    $scope.hideLoaderAndPrint = function () {
        LoaderService.hideLoader();
        $timeout(function () {
            $window.print();
        }, 1000);
    };

    $scope.showAdaptationLoaderFromLoop = function (indexLoop) {
        //check if first element of the loop
        if (indexLoop <= 0) {
            $scope.showAdaptationLoader();
        }
    };

    $scope.hideLoaderFromLoopAndPrint = function (indexLoop, max) {
        //Get nb listProfilTags length to check if last element of the loop
        if (indexLoop >= (max - 1)) {
            $scope.hideLoaderAndPrint();
        }
    };

    /**
     * Generate document based on the URL or the id of the doc
     * @method $scope.init
     */
    $scope.init = function () {
        LoaderService.showLoader('document.message.info.load', false);
        $scope.listTagsByProfil = JSON.parse(localStorage.getItem('listTagsByProfil'));
        $scope.currentPage = 0;
        $scope.content = [];

        var plan = {
                ENABLED: 1
            },
            modes = {
                EVERY_PAGES: 0,
                CURRENT_PAGE: 1,
                MULTIPAGE: 2
            },
            notes = [];

        showTitleDoc($routeParams.documentId);
        fileStorageService.getTempFileForPrint().then(function (data) {
            $scope.content = data;
            //delete the plan if it is disabled
            if (parseInt($routeParams.plan) === plan.ENABLED) {
                summaryOffset = 1;
            } else {
                summaryOffset = 0;
            }

            var mode = parseInt($routeParams.mode);
            switch (mode) {

                case modes.CURRENT_PAGE:

                    var page = parseInt($routeParams.page);
                    offset = parseInt(page);
                    notes.push(parseInt($routeParams.page));

                    //it means we have plan == 1;
                    if (summaryOffset === 1 && parseInt(page) !== 0) {
                        $scope.currentContent = [];
                        $scope.currentContent.push($scope.content[0]);
                        $scope.currentContent.push($scope.content[page]);
                        //it means we don't want the plan and the current page is the plan
                    } else if (summaryOffset === 0 && page === 0) {
                        $log.info('Showing plan without the plan');
                        $scope.currentContent = [];
                    } else if (summaryOffset === 1 && page === 0) {
                        //showing plan, current page is plan
                        $scope.currentContent = [];
                        $scope.currentContent.push($scope.content[0]);
                    } else {
                        //array resize when splicing
                        $scope.currentContent = [];
                        $scope.currentContent.push($scope.content[page - summaryOffset]);
                    }
                    break;


                case modes.EVERY_PAGES:
                    for (var i = 1; i < $scope.content.length; i++) {
                        notes.push(i);
                    }

                    // no plan
                    if (summaryOffset === 0) {
                        $scope.currentContent = [];
                        for (i = 1; i < $scope.content.length; i++) {
                            $scope.currentContent.push($scope.content[i]);
                        }
                    } else {
                        $scope.currentContent = $scope.content;
                    }

                    break;

                case modes.MULTIPAGE:
                    var pageFrom = parseInt($routeParams.pageDe),
                        pageTo = parseInt($routeParams.pageA),
                        currentContent = [];
                    offset = pageFrom;


                    //adds the plan
                    if (summaryOffset === 1) {
                        currentContent.push($scope.content[0]);
                    }
                    //push the content of 'pageFrom' to 'pageTo'
                    for (var iPage = pageFrom; iPage <= pageTo; iPage++) {
                        notes.push(iPage);
                        currentContent.push($scope.content[iPage]);
                    }
                    $scope.currentContent = currentContent;

                    break;

                default:
                    $scope.currentContent = [];
                    break;
            }

            LoaderService.hideLoader();
            if (summaryOffset === 0 && page === 0) return;

            var restoredNotes = workspaceService.getTempNotesForPrint();
            $scope.notes = [];

            // put in the scope only needed notes
            for (i = 0; i < notes.length; i++) {
                angular.forEach(restoredNotes, function (note) {
                    if (parseInt(note.idPage) === notes[i]) {
                        note.idInPrint = i + summaryOffset;
                        $scope.notes.push(note);
                    }
                });
            }

            $scope.currentStyle = $scope.notes.length > 0 ? floatLeftStyle : centeredStyle;
            $timeout(function () {
                correctImg();
            });
        });
    };
    $scope.init();

    //fix for printing images
    function correctImg() {
        var links = angular.element('a');
        angular.forEach(links, function (a) {
            var linkEl = angular.element(a);
            linkEl.replaceWith('<span>' + linkEl.html() + '</span>');
        });
    }

});