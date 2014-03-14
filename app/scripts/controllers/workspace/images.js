/* File: images.js
 *
 * Copyright (c) 2014
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
/*global $:false */
/* jshint undef: true, unused: true */
/* global PDFJS ,Promise*/

angular.module('cnedApp').controller('ImagesCtrl', function($scope, $http, $rootScope, $location, $compile, _, removeAccents, removeHtmlTags, $window, configuration, $sce, generateUniqueId) {

    // Zones a découper
    $scope.zones = [];
    // Loader afficher/enlever manipulation
    $scope.loader = false;
    // Image courante dans l'espace de travail
    $scope.currentImage = {};
    // Liste générale des blocks
    $scope.blocks = {
        children: []
    };
    // text océrisé
    $scope.textes = {};
    // paramétre d'affichage de l'éditor
    $scope.showEditor = false;
    // Liste des fichiers a uploader
    $scope.files = [];
    // Garder l'ID du docuument enregistre
    $rootScope.idDocument = [];
    // Liste des tags
    $scope.listTags = [];
    // Initialisation liste profils
    $scope.listProfils = [];


    /* Ajout nouveaux blocks */
    $scope.toggleMinimized = function(child) {
        child.minimized = !child.minimized;
    };

    /* Mettre à jour la structure des Blocks apres un Drag && Drop */
    $scope.updateDragDrop = function(event, ui) {
        var root = event.target,
            item = ui.item,
            parent = item.parent(),
            target = (parent[0] === root) ? $scope.blocks : parent.scope().child,
            child = item.scope().child,
            index = item.index();

        if (!target.children) {
            target.children = [];
        }

        // target.children || (target.children = []);

        function walk(target, child) {
            var children = target.children,
                i;
            if (children) {
                i = children.length;
                while (i--) {

                    if (children[i] === child) {
                        return children.splice(i, 1);
                    } else {
                        walk(children[i], child);
                    }
                }
            }
        }
        walk($scope.blocks, child);
        target.children.splice(index, 0, child);
    };

    $scope.remove = function(child) {
        function walk(target) {
            var children = target.children,
                i;
            if (children) {
                i = children.length;
                while (i--) {
                    if (children[i] === child) {
                        return children.splice(i, 1);
                    } else {
                        walk(children[i]);
                    }
                }
            }
        }
        walk($scope.blocks);
    };

    function traverse(obj, cropedImages) {
        for (var key in obj) {
            if (typeof(obj[key]) === 'object') {
                if ($scope.currentImage.source === obj[key].source) {
                    for (var j = 0; j < $scope.cropedImages.length; j++) {
                        obj[key].children.push({
                            id: cropedImages[j].id,
                            text: cropedImages[j].text,
                            source: cropedImages[j].source,
                            children: []
                        });
                    }
                }
                traverse(obj[key], cropedImages);
            }
        }
    }

    function traverseOcrSpeech(obj) {
        for (var key in obj) {
            if (typeof(obj[key]) === 'object') {
                if ($scope.currentImage.source === obj[key].source) {
                    obj[key].text = $scope.currentImage.text;
                    obj[key].synthese = $scope.currentImage.synthese;
                    obj[key].tag = $scope.currentImage.tag;
                    break;
                }
                traverseOcrSpeech(obj[key]);
            }
        }
    }

    $scope.selected = function(x) {
        // Ajouter les dimentions sélectionnés a la table des zones
        x._id = Math.random();
        $scope.zones.push(x);
        // Enlever la selection
        $rootScope.$emit('releaseCrop');
    };

    $scope.removeZone = function(idZone) {
        for (var i = 0; i < $scope.zones.length; i++) {
            if ($scope.zones[i]._id === idZone) {
                $scope.zones.splice(i, 1);
            }
        }
    };

    /*Envoi des zones pour le découpage*/
    $scope.sendCrop = function() {

        if ($scope.zones.length < 1) {
            alert('Aucune zone n\'est encore sélectionnéz ... ');
        }

        // Initialiser la table des image découpés
        $scope.cropedImages = [];

        // afficher le loader
        $scope.loader = true;

        // Refactoring
        angular.forEach($scope.zones, function(zone) {

            angular.element($('#canvas').remove());
            angular.element($('body').append('<canvas id="canvas" width="' + zone.w + '" height="' + zone.h + '"></canvas>'));
            var canvas = document.getElementById('canvas');
            var context = canvas.getContext('2d');

            // draw cropped image
            var sourceX = zone.x;
            var sourceY = zone.y;
            var sourceWidth = zone.w;
            var sourceHeight = zone.h;
            var destWidth = sourceWidth;
            var destHeight = sourceHeight;
            var destX = 0;
            var destY = 0;

            var imageObj = new Image();
            imageObj.src = $scope.currentImage.originalSource;
            context.drawImage(imageObj, sourceX, sourceY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight);

            var dataURL = canvas.toDataURL('image/png');

            var imageTreated = {};
            imageTreated.id = generateUniqueId();
            imageTreated.source = dataURL;
            imageTreated.text = '';
            imageTreated.level = Number($scope.currentImage.level + 1);
            imageTreated.children = [];
            $scope.cropedImages.push(imageTreated);

        });

        // Enlever le loader
        $scope.loader = false;
        // Initialiser les zones
        initialiseZones();
        // Détecter le parent des blocks et ajouter les images découpés a ce block
        traverse($scope.blocks, $scope.cropedImages);

    };

    // Initialiser la liste des zones

    function initialiseZones() {
        $scope.zones = [];
    }


    // Appliquer l'océrisation
    $scope.oceriser = function() {

        console.log('in controller ==> ');
        console.log($scope.currentImage);

        // Appel du websevice de l'ocerisation
        if ($scope.currentImage.source) {
            initialiseZones();
            $scope.loader = true;
            $http.post(configuration.URL_REQUEST + '/oceriser', {
                encodedImg: $scope.currentImage.originalSource
            }).success(function(data) {
                // Ajouter l'objet comportant le text et l'image pour l'affichage sur le workspace
                $scope.textes = {
                    source: $scope.currentImage.source,
                    text: angular.fromJson(data)
                };
                $scope.currentImage.text = angular.fromJson(data);

                // Affichage de l'éditeur
                $scope.showEditor = true;
                $scope.loader = false;
                $scope.msg = 'ok';
            }).error(function() {
                $scope.msg = 'ko';
            });
        } else {
            alert('Vous devez selectionner un block ... ');
        }

    };

    $scope.modifierTexte = function() {
        if ($scope.currentImage.source) {
            $scope.textes = {
                text: $scope.currentImage.text
            };
            $scope.showEditor = true;
        } else {
            alert('Vous devez selectionner un block ... ');
        }
    };

    $scope.textToSpeech = function() {
        var ocrText = removeAccents(removeHtmlTags($scope.currentImage.text));
        $scope.currentImage.text = ocrText;
        if ($scope.currentImage.text) {
            $scope.loader = true;
            if ($scope.currentImage.text.length > 0) {
                $http.post(configuration.URL_REQUEST + '/texttospeech', {
                    text: $scope.currentImage.text
                }).success(function(data) {
                    $scope.currentImage.synthese = angular.fromJson(data);
                    traverseOcrSpeech($scope.blocks);
                    $scope.loader = false;
                    return false;
                }).error(function() {
                    console.log('ko');
                });
            } else {
                alert('Pas de texte enregistré pour ce block');
            }
        } else {
            alert('Pas de texte enregistré pour ce block');
        }

    };



    /* WYSIWYG Editor Methods */
    /* Get OCR and save it */
    $scope.getOcrText = function() {
        $rootScope.$emit('getCkEditorValue');
        $scope.currentImage.text = removeHtmlTags($rootScope.ckEditorValue);
        traverseOcrSpeech($scope.blocks);
        $scope.textes = {};
        // Affichage de l'éditeur
        $scope.showEditor = false;
    };


    /* Fonctions de l'upload des fichiers */
    $scope.setFiles = function(element) {
        $scope.$apply(function() {
            // Turn the FileList object into an Array
            for (var i = 0; i < element.files.length; i++) {
                if (element.files[i].type !== 'image/jpeg' && element.files[i].type !== 'image/png' && element.files[i].type !== 'application/pdf') {
                    alert('Le type de fichier rattaché est non autorisé. Merci de rattacher que des fichiers PDF ou des images.');
                    console.log(+element.files[i]);
                } else {
                    $scope.files.push(element.files[i]);
                }
            }
            // $scope.progressVisible = false;
        });
    };

    $scope.uploadFile = function() {
        if ($scope.files.length > 0) {
            var fd = new FormData();
            for (var i in $scope.files) {
                fd.append('uploadedFile', $scope.files[i]);
            }
            var xhr = new XMLHttpRequest();
            // xhr.upload.addEventListener("progress", uploadProgress, false);
            xhr.addEventListener('load', $scope.uploadComplete, false);
            xhr.addEventListener('error', uploadFailed, false);
            // xhr.addEventListener("abort", uploadCanceled, false);
            xhr.open('POST', '/fileupload');
            $scope.progressVisible = true;
            xhr.send(fd);
            $scope.loader = true;
        } else {
            alert('Vous devez choisir un fichier');
        }

    };

    /*function uploadProgress(evt) {
        $scope.$apply(function() {
            if (evt.lengthComputable) {
                $scope.progress = Math.round(evt.loaded * 100 / evt.total);
            } else {
                $scope.progress = 'unable to compute';
            }
        })
    }*/

    $scope.uploadComplete = function(evt) {
        /* This event is raised when the server send back a response */
        $scope.files = [];
        console.log('upload complete');
        console.log(angular.fromJson(evt.target.responseText));
        $scope.affectSrcValue(angular.fromJson(evt.target.responseText));
    };

    function uploadFailed(evt) {
        console.log('Erreure survenue lors de l\'pload du fichier ');
        console.log(evt);
    }

    /*function uploadCanceled(evt) {
        $scope.$apply(function() {
            $scope.progressVisible = false
        })
        console.log("The upload has been canceled by the user or the browser dropped the connection.")
    }*/

    $scope.affectSrcValue = function(srcs) {
        $rootScope.$emit('distroyJcrop');

        for (var i = 0; i < srcs.length; i++) {
            if (srcs[i].extension === '.pdf') {
                alert('Le fichier est chargé avec succès, Conversion des pages en cours ... ');
                // Convert Pdf to images
                convertImage(0, srcs[i].numberPages, srcs[i].path);
            } else {
                $scope.blocks.children.push({
                    level: 0,
                    id: generateUniqueId(),
                    text: '',
                    synthese: '',
                    source: srcs[i].path,
                    children: []
                });
            }

        }
        initialiseZones();
        $scope.files = [];
        $scope.loader = false;

        // refresh scope binding : for callbacks of methods not with angularJS
        $scope.$apply();
    };

    function convertImage(page, totalPages, source) {
        $http.post(configuration.URL_REQUEST + '/pdfimage', {
            pdfData: {
                source: source,
                page: page
            }
        }).success(function(data) {
            $scope.blocks.children.push({
                level: 0,
                id: generateUniqueId(),
                text: '',
                synthese: '',
                source: 'data:image/png;base64,' + angular.fromJson(data).path,
                children: []
            });
            page += 1;
            if (page < totalPages) {
                convertImage(page, totalPages, source);
            }
        }).error(function() {
            console.log('ko');
        });
    }

    // Export Image to workspace
    $scope.workspace = function(image) {
        $scope.currentImage = image;
        if ($scope.currentImage.originalSource && $scope.currentImage.originalSource !== '') {
            $scope.currentImage.source = $scope.currentImage.originalSource;
        } else {
            $scope.currentImage.originalSource = $scope.currentImage.source;
        }

        $scope.currentImage.source = $sce.trustAsResourceUrl($scope.currentImage.source);
        initialiseZones();
        $scope.textes = {};
        $scope.showEditor = false;
        if (image.tag) {
            $scope.tagSelected = image.tag;
        } else {
            $scope.tagSelected = null;
        }
    };

    $scope.permitSaveblocks = function() {
        if ($scope.blocks.children.length < 1) {
            // alert("il n y a pas encore de choses a enregistrer");
            return true;
        } else {
            return false;
        }
    };

    $scope.saveblocks = function() {
        // Selection des profils
        $http.get(configuration.URL_REQUEST + '/listerProfil')
            .success(function(data) {
                if (data !== 'err') {
                    $scope.listProfils = data;
                }
            });
    };

    $scope.showlocks = function() {
        console.log('show blocks clicked ... ');
        $scope.loader = true;
        var url = configuration.URL_REQUEST + '/index.html';
        var apercuName = 'K-L-' + generateUniqueId() + '.html';
        var errorMsg = 'Veuillez-vous connecter pour pouvoir enregistrer sur Dropbox';

        $http.get(configuration.URL_REQUEST + '/profile')
            .success(function(data) {
                console.log('data ==>');
                if (data.dropbox && data.dropbox.accessToken) {
                    var token = data.dropbox.accessToken;
                    $http.get(url).then(function(response) {
                        response.data = response.data.replace('profilId = null', 'profilId = \'' + $scope.profilSelected + '\'');
                        response.data = response.data.replace('blocks = []', 'blocks = ' + angular.toJson($scope.blocks));
                        $http({
                            method: 'PUT',
                            url: 'https://api-content.dropbox.com/1/files_put/dropbox/adaptation/' + apercuName + '?access_token=' + token,
                            data: response.data
                        }).success(function() {
                            $http.post('https://api.dropbox.com/1/shares/dropbox/adaptation/' + apercuName + '?short_url=false&access_token=' + token)
                                .success(function(data) {
                                    console.log(data.url);
                                    var urlDropbox = data.url.replace('https://www.dropbox.com', 'http://dl.dropboxusercontent.com');
                                    urlDropbox += '#/apercu';
                                    console.log(urlDropbox);
                                    $window.open(urlDropbox);
                                    $scope.loader = false;
                                }).error(function() {
                                    console.log('share link dropbox failed');
                                });
                        }).error(function() {
                            console.log('file upload failed');
                        });
                    });
                } else {
                    $scope.loader = false;
                    alert(errorMsg);
                }
            }).error(function() {
                $scope.loader = false;
                alert(errorMsg);
                console.log('KO');
            });
    };

    // Selection des tags
    $scope.afficherTags = function() {
        $http.get(configuration.URL_REQUEST + '/readTags')
            .success(function(data) {
                if (data !== 'err') {
                    $scope.listTags = data;
                }
            });
    };

    $scope.afficherTags();

    $scope.updateBlockType = function() {
        $scope.currentImage.tag = $scope.tagSelected;
        traverseOcrSpeech($scope.blocks);
        // Parcour blocks and update with currentImage
    };

    $scope.playSong = function() {
        var audio = document.getElementById('player');
        audio.setAttribute('src', $scope.currentImage.synthese);
        audio.load();
        audio.play();
    };

    $scope.showPlaySong = function() {
        if ($scope.currentImage.synthese) {
            if ($scope.currentImage.synthese !== '') {
                return true;
            }
        }
        return false;
    };
    $scope.loadPdfLink = function() {
        $scope.pdfinfo = true;
        if (localStorage.getItem('pdfFound')) {
            $scope.pdflink = localStorage.getItem('pdfFound');
            localStorage.removeItem('pdfFound');
        } else {
            var localfile = ($scope.pdflinkTaped.indexOf('https://www.dropbox.com') > -1);
            if (localfile === true) {
                $scope.pdflink = $scope.pdflinkTaped.replace('https://www.dropbox.com/', 'https://dl.dropboxusercontent.com/');
                console.log('fichier stocker dans DropBox');
                console.log('initiliazin Show pdf');
            } else {
                $scope.pdflink = $scope.pdflinkTaped;
            }

        }

        var data = {
            lien: $scope.pdflink
        };
        var contains = ($scope.pdflink.indexOf('https') > -1); //true
        if (contains === false) {
            console.log('http');
            $scope.serviceNode = configuration.URL_REQUEST + '/sendPdf';
        } else {
            console.log('https');
            $scope.serviceNode = configuration.URL_REQUEST + '/sendPdfHTTPS';
        }
        $scope.showPdfCanvas = true;
        $.ajax({
            type: 'POST',
            url: $scope.serviceNode,
            data: data,
            success: function(data) {
                $scope.showPdfCanvas = true;
                console.log('ajax lunched with success');
                console.log('initiliazin Show pdf');

                PDFJS.disableWorker = false;

                var pdf = $scope.base64ToUint8Array(data);
                PDFJS.getDocument(pdf).then(function getPdfHelloWorld(_pdfDoc) {
                    $scope.pdfDoc = _pdfDoc;
                    console.log($scope.pdfDoc.numPages);
                    $scope.addSide();
                });
            }
        });

    };
    $scope.addSide = function() {
        var i = 1;
        $scope.loader = true;


        function recurcive() {
            $scope.pdfDoc.getPage(i).then(function(page) {

                $('#canvas').remove();
                $('body').append('<canvas class="hidden" id="canvas" width="790px" height="830px"></canvas>');
                $scope.canvas = document.getElementById('canvas');
                $scope.context = $scope.canvas.getContext('2d');
                $scope.viewport = page.getViewport($scope.canvas.width / page.getViewport(1.0).width); //page.getViewport(1.5);
                $scope.canvas.height = $scope.viewport.height;
                $scope.canvas.width = $scope.viewport.width;
                var renderContext = {
                    canvasContext: $scope.context,
                    viewport: $scope.viewport
                };

                var pageRendering = page.render(renderContext);
                //var completeCallback = pageRendering.internalRenderTask.callback;
                pageRendering.internalRenderTask.callback = function(error) {

                    if (error) {
                        console.log(error);
                    } else {
                        new Promise(function(resolve) {
                            $scope.dataURL = $scope.canvasToImage('#FFFFFF');
                            if ($scope.dataURL) {
                                var imageTreated = {};
                                imageTreated.id = Math.random() * 1000;
                                imageTreated.originalSource = $scope.dataURL;
                                imageTreated.source = $sce.trustAsResourceUrl($scope.dataURL);
                                imageTreated.text = '';
                                imageTreated.level = 0;
                                imageTreated.children = [];
                                console.log(i);
                                $scope.blocks.children.push(imageTreated);
                                $scope.loader = false;
                                $scope.$apply();
                                i++;
                                if (i <= $scope.pdfDoc.numPages) {

                                    recurcive();

                                } else {
                                    console.log('pdf loaded completly');
                                }
                                resolve('Ces trucs ont marché !');
                            }
                        });
                    }
                };
            });
        }
        recurcive();

    };

    $scope.renderPage = function(num) {
        $scope.pdfDoc.getPage(num).then(function(page) {
            var viewport = page.getViewport($scope.scale);
            $scope.canvas.height = viewport.height;
            $scope.canvas.width = viewport.width;
            var renderContext = {
                canvasContext: $scope.ctx,
                viewport: viewport
            };
            page.render(renderContext);
        });
        document.getElementById('page_num').textContent = $scope.pageNum;
        document.getElementById('page_count').textContent = $scope.pdfDoc.numPages;
    };

    $scope.goPrevious = function() {
        console.log('previous');
        if ($scope.pageNum <= 1) return;
        $scope.pageNum--;
        $scope.renderPage($scope.pageNum);
    };

    $scope.goNext = function() {
        console.log('next');
        if ($scope.pageNum >= $scope.pdfDoc.numPages) return;
        $scope.pageNum++;
        $scope.renderPage($scope.pageNum);
    };

    $scope.base64ToUint8Array = function(base64) {
        var raw = atob(base64);
        var uint8Array = new Uint8Array(new ArrayBuffer(raw.length));
        for (var i = 0; i < raw.length; i++) {
            uint8Array[i] = raw.charCodeAt(i);
        }
        return uint8Array;
    };

    $scope.canvasToImage = function(backgroundColor) {

        var w = $scope.canvas.width;
        var h = $scope.canvas.height;
        var data;
        var compositeOperation;

        if (backgroundColor) {
            data = $scope.context.getImageData(0, 0, w, h);
            compositeOperation = $scope.context.globalCompositeOperation;
            $scope.context.globalCompositeOperation = 'destination-over';
            $scope.context.fillStyle = backgroundColor;
            $scope.context.fillRect(0, 0, w, h);
        }

        var imageData = $scope.canvas.toDataURL('image/png');

        if (backgroundColor) {
            $scope.context.clearRect(0, 0, w, h);
            $scope.context.putImageData(data, 0, 0);
            $scope.context.globalCompositeOperation = compositeOperation;
        }

        return imageData;
    };
});