// NKL cleaner
//
// ABOUT THE SCRIPT
// Perform 3 hygiene action for your Negative Keyword Lists:
// - Correct capitalization
// - Correct one word phrase negatives
// - Remove redundant negatives
//
// Created By: Martijn Kraan
// With parts from Google's "Negative Keyword Conflicts" script
// Brightstep.nl
// 
// Created: 17-02-2020
//
////////////////////////////////////////////////////////////////////

var config = {

    LOG: true,
    // Set to 'true' if you want to log the changes

    LIST_NAME_CONTAINS: [],
    // Only one value allowed
    // For example ['Brand'] would only look at lists containing 'Brand'
    // Leave empty [] to include all campaigns.  

    LIST_NAME_DOES_NOT_CONTAIN: [],
    // Only one value allowed
    // For example ['Generic'] would skip lists containing 'Generic'
    // Leave empty [] to include all campaigns.

    CORRECT_CAPITALIZATION: true,
    // Set this to 'true' transform all negative keywords to lowercase
    // since (negative) keywords are not case sensitive
    // For example "Free" will be converted to "free"

    CORRECT_ONE_WORD_PHRASES: true,
    // Set this to 'true' to change one-word phrase match negatives to broad match.
    // For example "free" will be converted to free, but "for free" will stay unchanged

    REMOVE_REDUNDANT_NEGATIVES: true,
    // Set this to true if you want to remove redundant negative keywords
    // For example: if "free" (broad match) is already in the list,
    // the negative "for free" (broad, phrase or exact match) can be removed

}

////////////////////////////////////////////////////////////////////

function main() {

    // Get all the negative keyword lists according to the selection in the config
    var negativeKeywordLists = getNKLs();

    // Loop through the selected negative keyword lists
    while (negativeKeywordLists.hasNext()) {

        var negativeKeywordList = negativeKeywordLists.next();
        if (config.LOG === true) {
            Logger.log('Processing list "' + negativeKeywordList.getName() + '"');
            Logger.log('-----------');
        }

        // Check for capitalization
        if (config.CORRECT_CAPITALIZATION) {
            if (config.LOG === true) {
                Logger.log('-> Checking for capitalization:');
            }

            // Get the negatives from the list as objects
            var negatives = getNegatives(negativeKeywordList);

            // Loop through all the negatives
            for (var neg in negatives) {
                var negative = negatives[neg];

                // If negative contains a capital...
                if (checkForCapitals(negative.display)) {

                    //...remove the negative...
                    negative.neg.remove();

                    //...and add the negative again, without capitals
                    negativeKeywordList.addNegativeKeyword(negative.display.toLowerCase());

                    if (config.LOG === true) {
                        Logger.log('Set ' + negative.display + ' (' + negative.matchType + ') to lowercase');
                    }
                }
            }
        }

        // Check for one word phrase match negatives
        if (config.CORRECT_ONE_WORD_PHRASES) {

            if (config.LOG === true) {
                Logger.log('-> Checking for one-word PHRASE negatives:');
            }

            // Get the negatives from the list as objects (again)
            var negatives = getNegatives(negativeKeywordList);

            // Loop through all the negatives
            for (var neg in negatives) {
                var negative = negatives[neg];

                // If negative match type is phrase and number of words is 1...
                if (negative.matchType === 'PHRASE' && negative.wordCount === 1) {

                    //...remove the negative...
                    negative.neg.remove();

                    //...and add the negative again as a broad match negative
                    negativeKeywordList.addNegativeKeyword(negative.raw);

                    if (config.LOG === true) {
                        Logger.log('Changed negative keyword ' + negative.display + ' from phrase to broad match');
                    }
                }
            }
        }

        // Check for redundant negatives
        if (config.REMOVE_REDUNDANT_NEGATIVES) {

            if (config.LOG === true) {
                Logger.log('-> Checking for redundant negatives:');
            }

            // Get the negatives from the list as objects (again)          
            var negatives = getNegatives(negativeKeywordList);
            // Sort the negatives so that the broad match negatives are first
            negatives.sort(compare);

            // Loop through all the negatives
            for (var i = 0; i < negatives.length; i++) {
                var negative = negatives[i];

                switch (negative.matchType) {

                    // If negative match type is broad...
                    case 'BROAD':

                        //...compare the negative with all the other negatives from the list
                        for (var y = 0; y < negatives.length; y++) {

                            // Check if the negative broad matches the other (redundant) negative
                            var match = hasAllTokens(negative.raw, negatives[y].raw)

                            // If there's a match (and it's not the same negative)...
                            if (match && negative.display != negatives[y].display) {

                                //...remove the matched redundant negative
                                negatives[y].neg.remove();

                                if (config.LOG === true) {
                                    Logger.log('"' + negatives[y].raw + '" (' + negatives[y].matchType + ') can be removed because the negative keyword "' + negative.raw + '" (' + negative.matchType + ') will block related queries already');
                                }

                                // Correct the increments of both loops
                                negatives.splice(y, 1);
                                if (i > y) {
                                    i--;
                                }
                                y--;
                            }
                        }
                        break;

                        // If negative match type is phrase...                    
                    case 'PHRASE':

                        //...compare the negative with all the other negatives from the list                    
                        for (var y = 0; y < negatives.length; y++) {

                            // Check if the negative phrase matches the other (redundant) negative                          
                            var match = isSubsequence(negative.raw, negatives[y].raw)

                            // If there's a match (and it's not the same negative)...                            
                            if (match && negative.raw != negatives[y].raw) {

                                //...remove the matched redundant negative                              
                                negatives[y].neg.remove();

                                if (config.LOG === true) {
                                    Logger.log('"' + negatives[y].raw + '" (' + negatives[y].matchType + ') can be removed because the negative keyword "' + negative.raw + '" (' + negative.matchType + ') will block related queries already');
                                }

                                // Correct the increments of both loops                              
                                negatives.splice(y, 1);
                                if (i > y) {
                                    i--;
                                }
                                y--;
                            }
                        }
                        break;

                        // If negative match type is exact...                    
                    case 'EXACT':
                        //...no action needed because an exact match can only block itself
                        break;
                }
            }
        }
        Logger.log(' ');
    }
}

function getNKLs() {
    var negativeKeywordListIterator;
    if (config.LIST_NAME_CONTAINS.length > 0) {
        var negativeKeywordListIterator = AdsApp.negativeKeywordLists()
            .withCondition('Name CONTAINS_IGNORE_CASE "' + config.LIST_NAME_CONTAINS + '"')
            .get();
    } else if (config.LIST_NAME_DOES_NOT_CONTAIN.length > 0) {
        var negativeKeywordListIterator = AdsApp.negativeKeywordLists()
            .withCondition('Name DOES_NOT_CONTAIN_IGNORE_CASE "' + config.LIST_NAME_DOES_NOT_CONTAIN + '"')
            .get();
    } else {
        var negativeKeywordListIterator = AdsApp.negativeKeywordLists()
            .get();
    }
    return negativeKeywordListIterator;
}

function getNegatives(negativeKeywordList) {

    var negativeKeywords = negativeKeywordList.negativeKeywords().get();
    var negatives = [];

    while (negativeKeywords.hasNext()) {
        var negative = negativeKeywords.next();
        negatives.push(
            normalizeKeyword(negative, negative.getText(), negative.getMatchType()));
    }
    return negatives;
}

/**
 * Normalizes a keyword by returning a raw and display version and consistent
 * match type. The raw version has no leading and trailing punctuation for
 * phrase and exact match keywords, no consecutive whitespace, is all
 * lowercase, and removes broad match qualifiers. The display version has no
 * consecutive whitespace and is all lowercase. The match type is uppercase.
 *
 * @param {string} text A keyword's text that should be normalized.
 * @param {string} matchType The keyword's match type.
 * @return {Object} An object with fields display, raw, and matchType.
 */

function normalizeKeyword(negative, text, matchType) {
    var display;
    var raw = text;
    matchType = matchType.toUpperCase();

    // Replace leading and trailing "" for phrase match keywords and [] for
    // exact match keywords, if it is there.
    if (matchType == 'PHRASE') {
        raw = trimKeyword(raw, '"', '"');
    } else if (matchType == 'EXACT') {
        raw = trimKeyword(raw, '[', ']');
    }

    // Collapse any runs of whitespace into single spaces.
    raw = raw.replace(new RegExp('\\s+', 'g'), ' ');

    // Set display version.
    display = raw;
    if (matchType == 'PHRASE') {
        display = '"' + display + '"';
    } else if (matchType == 'EXACT') {
        display = '[' + display + ']';
    }

    // Keywords are not case sensitive.
    raw = raw.toLowerCase();

    // Remove broad match modifier '+' sign.
    raw = raw.replace(new RegExp('\\s\\+', 'g'), ' ');

    // Check length
    var wordCount = raw.split(' ').length;

    return {
        neg: negative,
        display: display,
        raw: raw,
        matchType: matchType,
        wordCount: wordCount
    };
}

/**
 * Removes leading and trailing match type punctuation from the first and
 * last character of a keyword's text, if any.
 *
 * @param {string} text A keyword's text to remove punctuation from.
 * @param {string} open The character that may be the first character.
 * @param {string} close The character that may be the last character.
 * @return {Object} The same text, trimmed of open and close if present.
 */
function trimKeyword(text, open, close) {
    if (text.substring(0, 1) == open &&
        text.substring(text.length - 1) == close) {
        return text.substring(1, text.length - 1);
    }

    return text;
}

/**
 * Tests whether all of the tokens in one keyword's raw text appear in
 * the tokens of a second keyword's text.
 *
 * @param {string} keywordText1 the raw keyword text whose tokens may
 *     appear in the other keyword text.
 * @param {string} keywordText2 the raw keyword text which may contain
 *     the tokens of the other keyword.
 * @return {boolean} Whether all tokens in keywordText1 appear among
 *     the tokens of keywordText2.
 */
function hasAllTokens(keywordText1, keywordText2) {
    var keywordTokens1 = keywordText1.split(' ');
    var keywordTokens2 = keywordText2.split(' ');

    for (var i = 0; i < keywordTokens1.length; i++) {
        if (keywordTokens2.indexOf(keywordTokens1[i]) == -1) {
            return false;
        }
    }

    return true;
}

/**
 * Tests whether all of the tokens in one keyword's raw text appear in
 * order in the tokens of a second keyword's text.
 *
 * @param {string} keywordText1 the raw keyword text whose tokens may
 *     appear in the other keyword text.
 * @param {string} keywordText2 the raw keyword text which may contain
 *     the tokens of the other keyword in order.
 * @return {boolean} Whether all tokens in keywordText1 appear in order
 *     among the tokens of keywordText2.
 */

function isSubsequence(keywordText1, keywordText2) {
    return (' ' + keywordText2 + ' ').indexOf(' ' + keywordText1 + ' ') >= 0;
}

function checkForCapitals(str) {
    return str.match(/[A-Z]/);
}

function compare(a, b) {
    if (a.matchType < b.matchType) {
        return -1;
    }
    if (a.matchType > b.matchType) {
        return 1;
    }
    return 0;
}
