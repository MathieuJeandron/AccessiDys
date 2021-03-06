/* File: workspaceService.js
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

describe(
    'Service: workspaceService',
    function () {
        beforeEach(module('cnedApp'));

        beforeEach(inject(function () {}));

        it('workspaceService:splitPages', inject(function (workspaceService) {
            var htmlToSplit = '<h1>test</h1><div aria-label="Saut de page" class="cke_pagebreak" contenteditable="false" data-cke-display-name="pagebreak" data-cke-pagebreak="1" style="page-break-after: always" title="Saut de page"></div><h2>test</h2>';
            var result = workspaceService.splitPages(htmlToSplit);
            expect(result.length).toBe(1);
        }));

        it('workspaceService:cleanString', inject(function (workspaceService) {
            var textToClean = 'ABC def';
            var result = workspaceService.cleanString(textToClean);
            expect(result).toEqual('abcdef');
        }));

        it('workspaceService:cleanAccent', inject(function (workspaceService) {
            var textToClean = 'é';
            var result = workspaceService.cleanAccent(textToClean);
            expect(result).toEqual('e');
        }));

        it('workspaceService:saveTempNotesForPrint ', inject(function (workspaceService) {
            var notes = {
                id: '1'
            };
            workspaceService.saveTempNotesForPrint(notes);
            var result = localStorage.getItem('tempNotes');
            expect(result).toEqual(angular.toJson({
                'id': '1'
            }));
        }));

        it('workspaceService:getTempNotesForPrint ', inject(function (workspaceService) {
            var notes = {
                id: '1'
            };
            localStorage.setItem('tempNotes', '{"id":"1"}');
            var notesForPrint = workspaceService.getTempNotesForPrint();
            expect(notesForPrint).toEqual(notes);

            localStorage.removeItem('tempNotes');
            notesForPrint = workspaceService.getTempNotesForPrint();
            expect(notesForPrint.length).toBe(0);
        }));

        it('workspaceService:restoreNotesStorage ', inject(function (workspaceService) {
            var notesDoc = {
                'idNote': '1401965900625976',
                'idInPage': 1,
                'idDoc': '3330b762b5a39aa67b75fc4cc666819c1aab71e2f7de1227b17df8dd73f95232',
                'idPage': 1,
                'texte': 'Note 1',
                'x': 750,
                'y': 194,
                'xLink': 382,
                'yLink': 194,
                'styleNote': '<p data-font=\'opendyslexicregular\' data-size=\'14\' data-lineheight=\'18\' data-weight=\'Normal\' data-coloration=\'Surligner les lignes\' > Note 1 </p>'
            };
            var notes = {
                '3330b762b5a39aa67b75fc4cc666819c1aab71e2f7de1227b17df8dd73f95232': [notesDoc]
            };

            localStorage.setItem('notes', JSON.stringify(angular.toJson(notes)));
            var notesStorage = workspaceService.restoreNotesStorage('3330b762b5a39aa67b75fc4cc666819c1aab71e2f7de1227b17df8dd73f95232');
            expect(notesStorage.length).toBe(1);
            expect(notesStorage[0]).toEqual(notesDoc);

            notesStorage = workspaceService.restoreNotesStorage('fauxDocument');
            expect(notesStorage.length).toBe(0);

            localStorage.removeItem('notes');
            notesStorage = workspaceService.restoreNotesStorage('pasDeNotes');
            expect(notesStorage.length).toBe(0);
        }));


    });