// Copyright 2020. Increase BV. All Rights Reserved.
//
// Original script by Remko van der Zwaag
// That was based on a Google example script: http://goo.gl/aunUKV
// Rewritten by: Tibbe van Asten
//
// Created: 22-05-2020
// Last update: 24-05-2020
//
// ABOUT THE SCRIPT
// This script checks all search queries in your account. Based
// on your own theresholds, these queries can be added as exact
// keywords in the same adgroup.
//
////////////////////////////////////////////////////////////////////

var config = {

  LOG : true,

  // Set the daterange to select the search queries in your account.
  // Change the number of days to your liking.
  DATE_RANGE : last_n_days(90),

  // Set the following thresholds. Set to '0' (zero) to be ignored.
  // These threshold help select the right queries to be added.
  // Each queries must match all thresholds!
  IMPRESSIONS_THRESHOLD : 0,
  CLICKS_THRESHOLD : 0,
  CONVERSIONS_THRESHOLD : 0,
  CTR_THRESHOLD : 0,
  CPA_THRESHOLD : 0,
  COST_THRESHOLD : 0

}

////////////////////////////////////////////////////////////////////

function main(){

  var exactKeywords = getKeywords();
  var queriesToBeAdded = {};

  var report = AdsApp.report(
    "SELECT Query, KeywordTextMatchingQuery, AdGroupId, Impressions, Clicks, Cost, Ctr, CostPerConversion, Conversions " +
    "FROM SEARCH_QUERY_PERFORMANCE_REPORT " +
    "WHERE Impressions > 0 " +
    "AND AdGroupStatus = ENABLED " +
    "AND CampaignStatus = ENABLED " +
    "AND KeywordTextMatchingQuery DOES_NOT_CONTAIN_IGNORE_CASE 'URL' " +
    "DURING " + config.DATE_RANGE);

  var rows = report.rows();
  while(rows.hasNext()){
    var row = rows.next();
    
    // Some selected queries are the same as the matching keyword.
    // We'll exclude them from being added.
    if(row["Query"] == row["KeywordTextMatchingQuery"]) continue;

    // Skip queries if thresholds are set and not matched.
    if(config.IMPRESSIONS_THRESHOLD != 0 && row["Impressions"] < config.IMPRESSIONS_THRESHOLD) continue;
    if(config.CLICKS_THRESHOLD != 0 && row["Clicks"] < config.CLICKS_THRESHOLD) continue;
    if(config.CONVERSIONS_THRESHOLD != 0 && row["Conversions"] < config.CONVERSIONS_THRESHOLD) continue;
    if(config.CTR_THRESHOLD != 0 && row["Ctr"].replace("%","") < config.CTR_THRESHOLD) continue;
    if(config.CPA_THRESHOLD != 0 && row["CostPerConversion"] > config.CPA_THRESHOLD) continue;
    if(config.COST_THRESHOLD != 0 && row["Cost"] < config.COST_THRESHOLD) continue;
    
      if(config.LOG === true){
        Logger.log(row["Query"] + ": " + row["Impressions"] + " impressions, " + row["Clicks"] + " clicks, " + row["Conversions"] + " conversions, " + row["Ctr"] + " CTR, €" + row["CostPerConversion"] + " CPA, €" + row["Cost"] + " cost.");
        Logger.log("Matched with " + row["KeywordTextMatchingQuery"]);
        Logger.log(" ");
      }

    // If query is not an exact keyword in the account yet, we'll add it
    if(exactKeywords.indexOf(row["Query"]) < 0){

      if(queriesToBeAdded[row["Query"]] == null){
        queriesToBeAdded[row["Query"]] = [];
      }
      queriesToBeAdded[row["Query"]].push(row["Query"], row["AdGroupId"]);

    }

  } // rowIterator

  if(config.LOG === true){
    Logger.log("------------------------");
    Logger.log("Found " + Object.keys(queriesToBeAdded).length + " keywords to be added");
    Logger.log("------------------------");
    Logger.log(" ");
  }

  // Add Keywords
  for (var key in queriesToBeAdded) {

    var adGroupId = [];
    adGroupId.push(queriesToBeAdded[key][1])

    var adGroupIterator = AdsApp
      .adGroups()
      .withIds(adGroupId)
      .get();

    while(adGroupIterator.hasNext()){
      var adGroup = adGroupIterator.next();
      
        adGroup.adParams()
      
      var keywordOperation = adGroup
        .newKeywordBuilder()
        .withText("["+queriesToBeAdded[key][0]+"]")
        .build();
      
      var keyword = keywordOperation.getResult();
      
        if(config.LOG === true){
          Logger.log("Put " + keyword.getText() + " in " + adGroup.getName());
        }        

    } // adGroupIterator


  } // keywordIterator

} // function main()

////////////////////////////////////////////////////////////////////

function last_n_days(n) {

	var	from = new Date(), to = new Date();
	to.setUTCDate(from.getUTCDate() - n);

	return google_date_range(from, to);

} // function last_n_days()

////////////////////////////////////////////////////////////////////

function google_date_range(from, to) {

	function google_format(date) {
		var date_array = [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()];
		if (date_array[1] < 10) date_array[1] = '0' + date_array[1];
		if (date_array[2] < 10) date_array[2] = '0' + date_array[2];

		return date_array.join('');
	}

	var inverse = (from > to);
	from = google_format(from);
	to = google_format(to);
	var result = [from, to];

	if (inverse) {
		result = [to, from];
	}

	return result.join(',');

} // function google_date_range()

////////////////////////////////////////////////////////////////////

function getKeywords(){
  
    if(config.LOG === true){
      Logger.log("Start collecting keywords");
    }

  var keywords = [];

  var keywordIterator = AdsApp
    .keywords()
    .withCondition("CampaignStatus = ENABLED")
    .withCondition("AdGroupStatus = ENABLED")
    .withCondition("Status != REMOVED")
    .withCondition("KeywordMatchType = EXACT")
    .get();

  while(keywordIterator.hasNext()){
    var keyword = keywordIterator.next();
    keywords.push(keyword.getText());
  } // keywordIterator
  
    if(config.LOG === true){
      Logger.log("Collected " + keywords.length + " exact keywords");
      Logger.log(" ");
    }

  return keywords;

} // function getKeywords
