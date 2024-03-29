
// Copyright 2023. All Rights Reserved.
//
// Original script by Remko van der Zwaag & rewritten by Tibbe van Asten
// That was based on a Google example script: http://goo.gl/aunUKV
// Rewritten by: Arjan Schoorl
//
// ABOUT THE SCRIPT
// This script checks all search queries in your account. Based
// on your own theresholds, these queries can be added as keywords 
// in the same adgroup. It then sends a recap mail.
// I prefer to run it weekly and check the mail for new keywords.
//
////////////////////////////////////////////////////////////////////

var config = {

  EMAILADDRESS: 'mail@yourcompany.com',

  // The date range you want to look at, remember to add up some days if you have a longer conversionLag 
  DATE_RANGE: 30,

  // Set the following thresholds. Set to '0' (zero) to be ignored.
  // These threshold help select the right queries to be added.
  // Each queries must match all thresholds!
  IMPRESSIONS_THRESHOLD: 0,
  CLICKS_THRESHOLD: 0,
  CONVERSIONS_THRESHOLD: 0,
  CTR_THRESHOLD: 0,
  CPA_THRESHOLD: 0,
  COST_THRESHOLD: 0,

  // Set your preffered match types for adding the search terms
  // Choose from EXACT, PHRASE and BROAD
  KEYWORD_MATCH_TYPES: ['EXACT', 'PHRASE', 'BROAD'],

}

// Start script, don't add anything below this line
////////////////////////////////////////////////////////////////////

function main() {

  var exactKeywords = getKeywords();
  var queriesToBeAdded = {};
  var emailRecap = '';
  var adGroupRecap = {};
  var today = new Date();
  var daysAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - config.DATE_RANGE);
  var dateFrom = Utilities.formatDate(daysAgo, AdWordsApp.currentAccount().getTimeZone(), 'yyyyMMdd');
  var dateTo = Utilities.formatDate(today, AdWordsApp.currentAccount().getTimeZone(), 'yyyyMMdd');

  var report = AdsApp.report(
    "SELECT Query, KeywordTextMatchingQuery, AdGroupId, Impressions, Clicks, Cost, Ctr, CostPerConversion, Conversions " +
    "FROM SEARCH_QUERY_PERFORMANCE_REPORT " +
    "WHERE Impressions > 0 " +
    "AND AdGroupStatus = ENABLED " +
    "AND CampaignStatus = ENABLED " +
    "AND KeywordTextMatchingQuery DOES_NOT_CONTAIN_IGNORE_CASE 'URL' " +
    "DURING " + dateFrom + "," + dateTo);

  var rows = report.rows();
  while (rows.hasNext()) {
    var row = rows.next();

    // Some selected queries are the same as the matching keyword.
    // We'll exclude them from being added.
    if (row["Query"] == row["KeywordTextMatchingQuery"]) continue;

    // Skip queries if thresholds are set and not matched.
    if (config.IMPRESSIONS_THRESHOLD != 0 && row["Impressions"] < config.IMPRESSIONS_THRESHOLD) continue;
    if (config.CLICKS_THRESHOLD != 0 && row["Clicks"] < config.CLICKS_THRESHOLD) continue;
    if (config.CONVERSIONS_THRESHOLD != 0 && row["Conversions"] < config.CONVERSIONS_THRESHOLD) continue;
    if (config.CTR_THRESHOLD != 0 && row["Ctr"].replace("%", "") < config.CTR_THRESHOLD) continue;
    if (config.CPA_THRESHOLD != 0 && row["CostPerConversion"] > config.CPA_THRESHOLD) continue;
    if (config.COST_THRESHOLD != 0 && row["Cost"] < config.COST_THRESHOLD) continue;

    // If query is not an exact keyword in the account yet, we'll add it
    if (exactKeywords.indexOf(row["Query"]) < 0) {
      if (queriesToBeAdded[row["Query"]] == null) {
        queriesToBeAdded[row["Query"]] = [];
      }
      queriesToBeAdded[row["Query"]].push(row["Query"], row["AdGroupId"]);
    }
  }

  Logger.log("Found " + Object.keys(queriesToBeAdded).length + " keywords to be added");

  // Add Keywords
  for (var key in queriesToBeAdded) {
    var adGroupId = [];
    adGroupId.push(queriesToBeAdded[key][1])

    var adGroupIterator = AdsApp
      .adGroups()
      .withIds(adGroupId)
      .get();

    while (adGroupIterator.hasNext()) {
      var adGroup = adGroupIterator.next();
      var adGroupName = adGroup.getName();

      if (!adGroupRecap[adGroupName]) {
        adGroupRecap[adGroupName] = [];
      }

      var addedMatchTypes = [];
      
      // Iterate over match types in config.KEYWORD_MATCH_TYPES
      for (var i = 0; i < config.KEYWORD_MATCH_TYPES.length; i++) {
        var matchType = config.KEYWORD_MATCH_TYPES[i];
        var keywordText;

        switch(matchType) {
          case 'EXACT':
            keywordText = "[" + queriesToBeAdded[key][0] + "]";
            break;
          case 'PHRASE':
            keywordText = "\"" + queriesToBeAdded[key][0] + "\"";
            break;
          case 'BROAD':
            keywordText = queriesToBeAdded[key][0];
            break;
        }

        var keywordOperation = adGroup
          .newKeywordBuilder()
          .withText(keywordText)
          .build();

        var keyword = keywordOperation.getResult();

        if (keyword) {
          addedMatchTypes.push(matchType);
          Logger.log("Put " + keyword.getText() + " (" + matchType + ") in " + adGroup.getName());
        } else {
          Logger.log("Failed to add keyword: " + queriesToBeAdded[key][0] + " (" + matchType + ")");
        }
      }

      if (addedMatchTypes.length > 0) {
        adGroupRecap[adGroupName].push({
          searchTerm: queriesToBeAdded[key][0],
          matchTypes: addedMatchTypes
        });
      }
    }
  } 

  // Generate email recap
  for (var adGroupName in adGroupRecap) {
    if (adGroupRecap[adGroupName].length > 0) {
      emailRecap += "Ad Group: " + adGroupName + "\n";
      adGroupRecap[adGroupName].forEach(function (keywordInfo) {
        emailRecap += "  Added search term: " + keywordInfo.searchTerm + " (" + keywordInfo.matchTypes.join(', ') + ")\n";
      });
      emailRecap += "\n";
    }
  }
  sendEmailRecap(emailRecap);
}

////////////////////////////////////////////////////////////////////

function getKeywords() {
  Logger.log("Start collecting keywords");
  var keywords = [];

  var keywordIterator = AdsApp
    .keywords()
    .withCondition("CampaignStatus = ENABLED")
    .withCondition("AdGroupStatus = ENABLED")
    .withCondition("Status != REMOVED")
    .withCondition("KeywordMatchType = EXACT")
    .get();

  while (keywordIterator.hasNext()) {
    var keyword = keywordIterator.next();
    keywords.push(keyword.getText());
  }
  Logger.log("Collected " + keywords.length + " exact keywords");
  return keywords;
}

function sendEmailRecap(emailRecap) {
  if (emailRecap) {
    var accountName = AdsApp.currentAccount().getName();
    var emailAddress = config.EMAILADDRESS;
    var subject = accountName + ': Recap of Added Search Terms';
    var message = emailRecap;

    MailApp.sendEmail(emailAddress, subject, message);
  } else {
    Logger.log('No search terms were added. Email not sent.');
  }
}
