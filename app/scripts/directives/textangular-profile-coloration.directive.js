/* File: textangular-profile-coloration.directive.js
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

/*global rangy */
'use strict';

/**
 * Directive to set coloration with TextAngular
 */
angular.module('cnedApp').directive('textAngularProfileColoration',

    function (UtilsService, $timeout, $rootScope, $log, _) {
        return {
            restrict: 'A',
            link: function ($scope, $element) {

                var htmlWatcher = null;
                var windowScroll = 0;
                var prevScroll = -1;
                var windowWidth = window.innerWidth;
                var adaptIndex = 0;

                window.addEventListener('scroll', function () {
                    windowScroll = window.pageYOffset;

                    if (windowScroll >= prevScroll) {
                        prevScroll = windowScroll;
                        generateColoration($element[0]);
                    }
                });

                /**
                 * Bind the watcher to detect change in the editor
                 */
                var bindHtmlWatcher = function () {
                    if (!htmlWatcher) {
                        htmlWatcher = $scope.$watch(function () {
                            return $element[0].innerHTML.length;
                        }, function (newValue, oldValue) {
                            if (newValue !== oldValue) {
                                console.log(' html watcher newValue = ' + newValue + ' - oldValue = ' + oldValue, $element[0].innerHTML);
                                generateColoration($element[0]);
                            }
                        });
                    }
                };

                var generateColoration = function (element) {
                    if (htmlWatcher) {
                        htmlWatcher();
                        htmlWatcher = undefined;
                    }

                    $timeout(function () {

                        var profile = $rootScope.currentProfile;
                        var text = element.innerHTML;

                        if (profile && text) {

                            profile = profile.data;

                            var documentFragment = document.createDocumentFragment();
                            documentFragment.appendChild(element.cloneNode(true));


                            var line = 0;
                            var prevTop = -9999;
                            var prevTag = '';

                            for (var i = 0; i < element.children.length; i++) {
                                var child = element.children[i];
                                // Adapt child which are displayed on the screen
                                if (child.offsetTop < (windowScroll + windowWidth)) {
                                    var profileTag = _.find(profile.profileTags, function (_profileTag) {
                                        return _profileTag.tagDetail.balise === child.tagName.toLowerCase();
                                    });

                                    if (child.tagName !== prevTag) {
                                        line = 0;
                                    }

                                    if (profileTag) {
                                        var savedSel = rangy.saveSelection();

                                        var coloration = profileTag.coloration;
                                        var textTransform = child.innerHTML;

                                        // Save rangy cursor
                                        var rangyCursorPattern = /((&nbsp;)*<span id(.*?)\/span>)/gi;
                                        var rangyCursorResult = textTransform.match(rangyCursorPattern);
                                        var rangyCursors = [];

                                        if (rangyCursorResult && rangyCursorResult.length > 0) {
                                            for (var v = 0; v < rangyCursorResult.length; v++) {
                                                var marker = '%%RG' + v + '%%';

                                                rangyCursors.push({
                                                    marker: marker,
                                                    cursor: rangyCursorResult[v]
                                                });

                                                textTransform = textTransform.replace(rangyCursorResult[v], '%%RG' + v + '%%');
                                            }
                                        }
                                        textTransform = textTransform.replace(/&nbsp;/gi, ' %%NB%% ');
                                        textTransform = UtilsService.removeSpan(textTransform);

                                        // Handle img
                                        var imgPattern = /<img.*>/gi;
                                        var imgResult = textTransform.match(imgPattern);
                                        var imgList = [];

                                        if (imgResult && imgResult.length > 0) {
                                            for (var v = 0; v < imgResult.length; v++) {
                                                var marker = '%%IMG' + v + '%%';

                                                imgList.push({
                                                    marker: marker,
                                                    img: imgResult[v]
                                                });

                                                textTransform = textTransform.replace(imgResult[v], marker);
                                            }
                                        }


                                        // Split Text
                                        if (coloration === 'Colorer les lignes RBV'
                                            || coloration === 'Colorer les lignes RVJ'
                                            || coloration === 'Surligner les lignes RVJ'
                                            || coloration === 'Surligner les lignes RBV'
                                            || coloration === 'Colorer les lignes RBVJ'
                                            || coloration === 'Surligner les lignes RBVJ') {

                                            textTransform = UtilsService.splitOnWordWithSpace(textTransform);
                                            textTransform = textTransform.replace(/\s<span>%%NB%%\s<\/span>\s/gi, '&nbsp;');

                                        } else if (coloration === 'Colorer les mots'
                                            || coloration === 'Surligner les mots') {

                                            textTransform = UtilsService.splitOnWordWithOutSpace(textTransform);
                                            textTransform = textTransform.replace(/\s\s<span>%%NB%%<\/span>\s\s/gi, '&nbsp;');

                                        } else if (coloration === 'Colorer les syllabes') {

                                            textTransform = UtilsService.splitOnSyllable(textTransform);
                                            textTransform = textTransform.replace(/\s<span>%%NB%%<\/span>\s/gi, '&nbsp;');
                                        } else {
                                            textTransform = textTransform.replace(/\s%%NB%%\s/gi, '&nbsp;');
                                        }

                                        textTransform = textTransform.replace(/%%NB%%/gi, ' ');

                                        // Restore images
                                        for (var v = 0; v < imgList.length; v++) {
                                            textTransform = textTransform.replace(new RegExp(imgList[v].marker, 'gi'), imgList[v].img);
                                        }

                                        // Restore rangy cursor
                                        for (var v = 0; v < rangyCursors.length; v++) {
                                            textTransform = textTransform.replace(new RegExp(rangyCursors[v].marker, 'gi'), rangyCursors[v].cursor);
                                        }


                                        child.innerHTML = textTransform;
                                        console.log('reinject');

                                        if (coloration === 'Colorer les lignes RBV'
                                            || coloration === 'Colorer les lignes RVJ'
                                            || coloration === 'Surligner les lignes RBV'
                                            || coloration === 'Surligner les lignes RVJ') {

                                            var res = UtilsService.colorLines(child, 3, prevTop, line);
                                            line = res.line;
                                            prevTop = res.prevTop;

                                            var parent = child.parentNode;
                                            var nextElement = child.nextSibling;
                                            parent.removeChild(child);
                                            parent.insertBefore(res.documentFragment, nextElement);

                                        } else if (
                                            coloration === 'Colorer les lignes RBVJ'
                                            || coloration === 'Surligner les lignes RBVJ') {

                                            var res = UtilsService.colorLines(child, 4, prevTop, line);
                                            line = res.line;
                                            prevTop = res.prevTop;

                                            var parent = child.parentNode;
                                            var nextElement = child.nextSibling;
                                            parent.removeChild(child);
                                            parent.insertBefore(res.documentFragment, nextElement);
                                        }

                                        if(prevTop > child.offsetTop){
                                            prevTop = child.offsetTop;
                                        }

                                        prevTag = child.tagName;

                                        rangy.restoreSelection(savedSel);

                                    } else {
                                        continue;
                                    }
                                } else {
                                    break;
                                }
                            }
                        }


                        $timeout(function(){
                            bindHtmlWatcher();

                        }, 110);

                    }, 200);
                };

                /*$element.bind('keyup', function(){
                    generateColoration($element[0]);
                });*/


                /**
                 * Watcher for the current profile
                 */
                $rootScope.$watch('currentProfile', function (newvalue) {
                    if (newvalue) {
                        generateColoration($element[0]);
                    }
                }, true);
            }
        };


    });