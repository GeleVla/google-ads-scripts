// Copyright 2019. Increase BV. All Rights Reserved.
// Not to be used without permission of the creator or Increase B.V.
//
// Created By: Tibbe van Asten
// for Increase B.V.
// 
// Last update: 29-11-2018
//
// ABOUT THE SCRIPT
// 
// With this script, we will create a report with all keywords
// in your accounts that have quality issues.
//
// ------------------------------------------------------------

// Script settings
var config = {
  
  LOG : true,
  
  THRESHOLD_IMPRESSIONS : 20,  
  DATE_RANGE : "LAST_30_DAYS",
  
  ACCOUNT_LABEL : "keyword_quality_report",
  KEYWORD_LABEL : "Keyword Quality - Script",
  
  THRESHOLD_BOUNCE : 80,
  THRESHOLD_TOS : 20,
  
  // Copy from http://tinyurl.com/y536ld89
  SPREADSHEET_URL : "https://docs.google.com/spreadsheets/d/1vAuyT7TJHNuL-ansHPFLzwoE1voT_8MtJgWSMttyTqE/edit",
  
  API_VERSION : "v201809"
}

// ------------------------------------------------------------

function main() {
  
  var ss = connectSheet();
  
  // Selecting all Ads Accounts
  var accountIterator = AdsManagerApp
    .accounts()
    .withCondition("LabelNames CONTAINS '" + config.ACCOUNT_LABEL + "'")
    .get();

  while(accountIterator.hasNext()){
    var account = accountIterator.next();
    MccApp.select(account);
    
        Logger.log("Account: " + account.getName());
        Logger.log("-----");
    
    // Create a label when it doesn't already exists
    keywordLabel(account);
    var label = AdsApp.labels().withCondition("Name = '" + config.KEYWORD_LABEL + "'").get().next();
    
    // Check if a sheet already exists for this account
    var sheet = checkSheet(ss, account);
    
    // Selecting all keywords
    var report = AdsApp.report(
      "SELECT AccountDescriptiveName, CampaignName, AdGroupName, AdGroupId, Criteria, Id, KeywordMatchType, BounceRate, AverageTimeOnSite, FinalUrls, CpcBid, SearchPredictedCtr, CreativeQualityScore, HistoricalLandingPageQualityScore, Clicks " +
      "FROM KEYWORDS_PERFORMANCE_REPORT " +
      "WHERE LabelIds CONTAINS_NONE [" + label.getId() + "] " +
      "AND CampaignStatus = ENABLED " +
      "AND AdGroupStatus = ENABLED " +
      "AND Status = ENABLED " +
      "AND Impressions > " + config.THRESHOLD_IMPRESSIONS +
      " DURING " + config.DATE_RANGE
    );

    var rows = report.rows();    
    while (rows.hasNext()) {
      var row = rows.next();
      
      reportRows(row, sheet);
    
    } // row iterator
    
    	Logger.log(account.getName() + " afgerond");
    
  } // account iterator
  
} // function main()

// ------------------------------------------------------------

function reportRows(row, sheet){
  
  // Checking a couple of variables, to make sure everything works as expected
  var bounceRate = checkBounce(row);
  var tos = checkTos(row)
  
  if((tos < config.THRESHOLD_TOS && tos != "") || bounceRate > config.THRESHOLD_BOUNCE || row["SearchPredictedCtr"] == "Below average" || row["CreativeQualityScore"] == "Below average" || row["HistoricalLandingPageQualityScore"] == "Below average"){

    if(config.LOG == true){
      Logger.log("Keyword: " + row["Criteria"]);  
      Logger.log("TOS: " + row["AverageTimeOnSite"]);
      Logger.log("Bounce: " + row["BounceRate"]);
      Logger.log("Ad Quality: " + row["CreativeQualityScore"]);
      Logger.log("LP Experience: " + row["HistoricalLandingPageQualityScore"]);
      Logger.log("Exp. CTR: " + row["SearchPredictedCtr"]);
      Logger.log(" ");
    }

    // Checking the final URL of a keyword. If not set, we will find the URL of the best performing ad in the adgroup
    var finalUrl = findUrl(row);
    
    // Now we put all the info in the sheet
    sheet.appendRow([row["AccountDescriptiveName"],row["CampaignName"],row["AdGroupName"],row["AdGroupId"],"'" + row["Criteria"],row["Id"],row["KeywordMatchType"],bounceRate,row["CreativeQualityScore"],row["HistoricalLandingPageQualityScore"],row["SearchPredictedCtr"],tos,row["CpcBid"],finalUrl]);

    // Label the keyword, so we know it's processed
    labelKeywords(row["AdGroupId"], row["Id"]);

  } // keyword selection
  
} // function reportRows

// ------------------------------------------------------------

function findUrl(row){
  
  if(row["FinalUrls"] == "--"){

    var keywordIterator = AdsApp
    .keywords()
    .withIds([[row["AdGroupId"], row["Id"]]])
    .get();

    while(keywordIterator.hasNext()){
      var keyword = keywordIterator.next();
      var finalUrl = keyword.getAdGroup().ads().orderBy("Ctr DESC").forDateRange(config.DATE_RANGE).withLimit(1).get().next().urls().getFinalUrl();

    } // keyword iterator

  } else {
    var finalUrl = row["FinalUrls"];  
  }
  
  return finalUrl;
  
} // function findUrl()

// ------------------------------------------------------------

function checkBounce(row){
  
  if(row["Clicks"] >= 10){
    var bounceRate = parseInt(row["BounceRate"]);
  } else {
  	var bounceRate = "";  
  }
  
  return bounceRate;
  
} // checkBounce()

// ------------------------------------------------------------

function checkTos(row){
  
  if(row["Clicks"] >= 10){
    var tos = parseInt(row["AverageTimeOnSite"]);
  } else {
  	var tos = "";  
  }
    
  return tos;
  
} // function checkTos()

// ------------------------------------------------------------

function keywordLabel(account){
  
  if(!AdsApp.labels().withCondition("Name = '"+config.KEYWORD_LABEL+"'").get().hasNext()) {
    AdsApp.createLabel(config.KEYWORD_LABEL);

    	if(config.LOG == true){
    		Logger.log("Label " + config.KEYWORD_LABEL + " created");
        }
  }
  
} // function keywordLabel()

// ------------------------------------------------------------

function labelKeywords(adGroupId, keywordId){

  var keywordIterator = AdsApp
  	.keywords()
  	.withIds([[adGroupId, keywordId]])
 	.get();
  
  while(keywordIterator.hasNext()){
    var keyword = keywordIterator.next();
    keyword.applyLabel(config.KEYWORD_LABEL);
    
    	if(config.LOG == true){
    		Logger.log("Label toegepast op " + keyword.getText());
          	Logger.log(" ");
        }
    
  } // keyword iterator
  
} // function labelKeywords

// ------------------------------------------------------------

function connectSheet(){
  
  var ss = SpreadsheetApp.openByUrl(config.SPREADSHEET_URL);  
  return ss;
  
} // function connectSheet()

// ------------------------------------------------------------

function checkSheet(ss, account){
  
  var sheet = ss.getSheetByName(account.getName());
  
  	if (sheet == null) {
      var templateSheet = ss.getSheetByName("Template");
      ss.insertSheet(account.getName(), {template: templateSheet});
      var sheet = ss.getSheetByName(account.getName());
      
      	Logger.log("New sheet created for " + account.getName());
      
    } // if sheet doesn't exists
  
  return sheet;
  
} // checkSheet()
