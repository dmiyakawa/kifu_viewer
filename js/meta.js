'use strict';

function getSenteName() {
    return $('div.mochi0 > div.tebanname').text().replace('☗', '');
}

function getGoteName() {
    return $('div.mochi1 > div.tebanname').text().replace('☖', '');
}
