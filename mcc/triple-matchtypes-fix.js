/**
* Title: Triple Match MCC
* Descritpion: Adds the missing match types of each keyword in every ad group
* Author: Wolf+Bär Agency, Aleksandar Vucenovic
* Website: https://wolfundbaer.ch
* License: GNU GPLv3
* Version: 0.4
* URL: https://gist.github.com/alewolf/ae90ea9c658df09b08d129f58575213c
* URL documentary: https://adsscripts.com/nl/scripts/google-ads-scripts/drie-typen-zoekwoorden
*/

/********* START Description ************************************************
* 
* This scripts adds all missing keyword match types to each ad group. 
* Eg. If only an exact match keyword has been added to the ad group,
* the script will add the corresponding modified broad match and phrase match
* keywords to the ad group.
* 
* Mark each account that you want to be processed with the
* ACCOUNTS_TO_PROCESS label from the settings below.
*
* In case one account is very, very large and the script stops because of
* one of the script limitations (eg time limit), this script will continue 
* where it left off in the next run. 
*
********** END Description **************************************************/

/********* START Settings **************************************************/


var ACCOUNTS_TO_PROCESS = 'triple_keyword_fix';
// Add this label to every account you want to be processed

var TRIPLE_MATCH_LABEL = 'triple_match_done';
// This label will be added to each keyword that has been processed
// in order to omit them in later runs.

var TRIPLE_MATCH_ADGROUP_PROCESS_LABEL = 'do_adgroup_triple_match_fix';
// All ad groups that need to be processed will be temporarily marked with this label

var TRIPLE_MATCH_CAMPAIGN_OMIT_LABEL = 'omit_campaign_triple_match_fix';
// Tag the campaigns, that you want to omit, with this label.

var keywordOperations = [];

/********* END Settings **************************************************/


// Run the main function
// Get all accounts tagged to be processed
function main() {
  getAccountsByLabel();
}


// Get all tagged accounts and process them in parallel
function getAccountsByLabel() {

  var accountSelector = MccApp.accounts()
      .withCondition("LabelNames CONTAINS '" + ACCOUNTS_TO_PROCESS + "'");
  
   accountSelector.executeInParallel('processAccount', 'allFinished');
}


// Process each account
function processAccount() {
  
  // Select the account to process
  var account = AdWordsApp.currentAccount();
  Logger.log('account name = ' + account.getName());
  
  // Check if the previous run has not been aborted.
  // If not, execute in full,
  // otherwise, omit the initialization. 
  Logger.log('checking if TRIPLE_MATCH_ADGROUP_PROCESS_LABEL exists');
  if( checkLabel(TRIPLE_MATCH_ADGROUP_PROCESS_LABEL) == false ){
    
    // We know now that the label doesn't exist yet,
    // so create it.
    Logger.log('creating TRIPLE_MATCH_ADGROUP_PROCESS_LABEL');
    createLabel(TRIPLE_MATCH_ADGROUP_PROCESS_LABEL);
        
    // Check if the keyword label already exists in the account. 
    // If not create it. 
    Logger.log('checking if TRIPLE_MATCH_LABEL exists');
    if( checkLabel(TRIPLE_MATCH_LABEL) == false ){
      Logger.log('creating TRIPLE_MATCH_LABEL');
      createLabel(TRIPLE_MATCH_LABEL);
    }
    
    // Mark all ad groups that need to be processed.
    Logger.log('markAllAdGroupsForProcessing');
    markAllAdGroupsForProcessing();
  } // end if
  

  // Process all tagged ad grouops.
  Logger.log('goThroughEachAdGroup');
  goThroughEachAdGroup();
  
  // Add labels to new keywords
  Logger.log('addLabelsToNewKeywords');
  addLabelsToNewKeywords();
  
  // Finish up, by removing the temporary labels from the ad groups
  removeTheLabel(TRIPLE_MATCH_ADGROUP_PROCESS_LABEL);
}


// Run closing report
function allFinished(){
  Logger.log('finished processing all accounts');
}


// This function tags all ad groups that need to be processed.
// It is slow in the first run, but allows a much faster execution of the entire script
// in each subsequent run.
function markAllAdGroupsForProcessing(){
  
  // A list of all campaigns to omit
  var campaignsToOmit = [];
  
  // Get all campaigns that will be omitted
  Logger.log('Get all campaigns that will be omitted');
  if( checkLabel(TRIPLE_MATCH_CAMPAIGN_OMIT_LABEL) == true ){
    var campaignIterator = AdWordsApp
    .campaigns()
    .withCondition("LabelNames CONTAINS_ANY [ '" + TRIPLE_MATCH_CAMPAIGN_OMIT_LABEL + "' ]")
    .get();
  
    // Push all campaign IDs, that will be omitted, into an array
    Logger.log('logging campaigns to omit');
    while( campaignIterator.hasNext() ){
      var campaignIdToOmit = campaignIterator.next().getId();
      campaignsToOmit.push(campaignIdToOmit); 
      Logger.log('campaignID to omit: ' + campaignIdToOmit );
    }
  }
  
  Logger.log("CampaignId NOT_IN [" + campaignsToOmit.join(",") + "]");
  // Select all keywords that have not been processed yet
  
  if(campaignsToOmit.length == 0){
    Logger.log('campaignsToOmit = 0');
    var keywordIterator = AdWordsApp
    .keywords()
    .withCondition("CampaignStatus = ENABLED")
    .withCondition("AdvertisingChannelType = SEARCH")
    .withCondition("AdGroupStatus = ENABLED")
    .withCondition("Status = ENABLED")
    .withCondition("LabelNames CONTAINS_NONE [ '" + TRIPLE_MATCH_LABEL + "' ]")
    .withLimit(40000)
    .forDateRange("ALL_TIME")
    .get();
  } else {
    Logger.log('campaignsToOmit > 1');
    var keywordIterator = AdWordsApp
    .keywords()
    .withCondition("CampaignStatus = ENABLED")
    .withCondition("CampaignId NOT_IN [" + campaignsToOmit.join(",") + "]")
    .withCondition("AdvertisingChannelType = SEARCH")
    .withCondition("AdGroupStatus = ENABLED")
    .withCondition("Status = ENABLED")
    .withCondition("LabelNames CONTAINS_NONE [ '" + TRIPLE_MATCH_LABEL + "' ]")
    .withLimit(40000)
    .forDateRange("ALL_TIME")
    .get();
  }
  
  Logger.log('marking ad groups for processing');
  var adGroupsToProcess = [];
  
  // Loop through all keywords  
  while( keywordIterator.hasNext() ){
  
    // Get the keyword
    var keyword = keywordIterator.next();
    
    // Get the keyword's adGroup ID
    var adGroupID = keyword.getAdGroup().getId();
    
    //Logger.log('account name: ' + AdWordsApp.currentAccount().getName() + ' | campaign name: ' + keyword.getCampaign().getName() );
    
    // Look if the adGroup already is marked,
    // if not, mark it and add it to the process list.
    if (adGroupsToProcess.indexOf(adGroupID) == -1){
      keyword.getAdGroup().applyLabel(TRIPLE_MATCH_ADGROUP_PROCESS_LABEL);
      adGroupsToProcess.push(adGroupID);
    }
  }
}


// Process all marked adGroups
function goThroughEachAdGroup(){
  
  // Logger.log('getting ad group iterator');
  
  // Select all ad groups that are labeled for processing
  var adGroupIterator = AdWordsApp
  .adGroups()
  .withCondition("Status = ENABLED")
  .withCondition("CampaignStatus = ENABLED")
  .withCondition("AdvertisingChannelType = SEARCH")
  .withCondition("LabelNames CONTAINS_ANY ['" + TRIPLE_MATCH_ADGROUP_PROCESS_LABEL + "']")
  .get();
    
  // Loop through all adGroups
  while (adGroupIterator.hasNext()) {
    
    // Logger.log('');
    // Logger.log('going through each ad group');
    
    // Get the adGroup
    var adGroup = adGroupIterator.next();
    
    // Process the adGroup's keywords
    processKeywordsFromAdGroup(adGroup);
    
    // After finishing processing the adGroup remove the label
    adGroup.removeLabel(TRIPLE_MATCH_ADGROUP_PROCESS_LABEL);
  } // end while
}


// Process each keyword from the adGroup
function processKeywordsFromAdGroup(adGroup){
  
  // Logger.log('processing keywords');
 
  // Create keyword arrays for each match type
  var broad_match_list  = [];
  var phrase_match_list = [];
  var exact_match_list  = [];
  
  // Logger.log('getting keyword iterator');
  
  // Get all keywords of that specific adGroup
  var keywordIterator = adGroup.keywords()
  .withCondition("Status = ENABLED")
  .withCondition("LabelNames CONTAINS_NONE [ " + TRIPLE_MATCH_LABEL + " ]")
  .get();
    
  
  // Logger.log('go through each keyword');
  // Iterate through the keyword list
  while (keywordIterator.hasNext()) {
   
    // Get the next keyword
    var keyword = keywordIterator.next();
    
    // Get the match type of the keyword
    var keywordMatchType = keyword.getMatchType();
    
    // Get a version of the keyword withough +, [] and ""
    var cleanKeywordText = cleanText(keyword.getText());
    
    //Logger.log('keyword text: ' + keyword.getText());
    //Logger.log('keyword match type: ' + keywordMatchType);
    
    // Push each keyword into its corresponding match type array
    if( keywordMatchType == 'BROAD' ){
      
      // it could be faster to add all duplicates into the list first and then remove them in one filter action after the while loop: https://stackoverflow.com/a/44565918/4688612
      if(broad_match_list.indexOf(cleanKeywordText) == -1 ){
        broad_match_list.push(cleanKeywordText);
      }
    
    } else if ( keywordMatchType == 'PHRASE' ){
      if(phrase_match_list.indexOf(cleanKeywordText) == -1 ){
        phrase_match_list.push(cleanKeywordText);
      }
      
    } else {
      if(exact_match_list.indexOf(cleanKeywordText) == -1 ){
        exact_match_list.push(cleanKeywordText);
      }
    }
    
    //Logger.log('keyword text: ' + keyword.getText());
    //Logger.log('campaign: ' + keyword.getCampaign().getName() + ' | ad group: ' + keyword.getAdGroup().getName() + ' | match type: ' + keyword.getMatchType() + ' | text: ' + keyword.getText());
    
    // Mark the keyword as processed
    keyword.applyLabel(TRIPLE_MATCH_LABEL);
    
  } // end while
  
  // Logger.log('');
  // Logger.log('print broad_match_list');
  // showList(broad_match_list);
  
  // Logger.log('');
  // Logger.log('print phrase_match_list');
  // showList(phrase_match_list);
  
  // Logger.log('');
  // Logger.log('print exact_match_list');
  // showList(exact_match_list);
  
  // Go through each list, find out if the same keyword is also one of the other match types, 
  // if not, create the keyword, if yes, delete it from the list. Then delete the keyword from the current list.
  var updatedLists;
  
  updatedLists = tripleMatchMagic(adGroup, broad_match_list, phrase_match_list, 'PHRASE', exact_match_list, 'EXACT');
  broad_match_list  = updatedLists[0];
  phrase_match_list = updatedLists[1];
  exact_match_list  = updatedLists[2];
  
  updatedLists = tripleMatchMagic(adGroup, phrase_match_list, exact_match_list, 'EXACT', broad_match_list, 'BROAD');
  phrase_match_list = updatedLists[0];
  exact_match_list  = updatedLists[1];
  broad_match_list  = updatedLists[2];
  
  updatedLists = tripleMatchMagic(adGroup, exact_match_list, broad_match_list, 'BROAD', phrase_match_list, 'PHRASE');
  
}


// Add labels to new keywords
// This is sperated into an operations list for performance reasons
function addLabelsToNewKeywords(){
  
  // Logger.log('keywordOperations.length: ' + keywordOperations.length);
  
  // Loop through all keywordOperations and add a label
  for (var i = keywordOperations.length - 1; i > -1; i-- ) {
    var newKeyword = keywordOperations[i].getResult();
    newKeyword.applyLabel(TRIPLE_MATCH_LABEL);
  }
}


// This is the magic function that finds all missing keyword match types efficiently
// and creates new ones if necessary
function tripleMatchMagic(adGroup, a, b, bb, c, cc){
  
  //Logger.log('text in: ' + a[0]);
  
  for( i = a.length - 1; i > -1; i--){
    var indexOnBlist = b.indexOf(a[0]);
    if( indexOnBlist > -1 ){
      b.splice(indexOnBlist, 1);
    } else {
      createNewKeyword(adGroup, a[0], bb);
    }
    
    var indexOnClist = c.indexOf(a[0]);
    if( indexOnClist > -1 ){
      c.splice(indexOnClist, 1);
    } else {
      createNewKeyword(adGroup, a[0], cc);
    }
     
    // Since this keyword now has been processed in all lists
    // we can delete it from this one too.
    a.splice(0,1);
  } // end of index list loop
  
  var updatedLists = [a, b, c];
  return updatedLists;
}


// Create the new keyword
function createNewKeyword(adGroup, keywordText, matchType){
  
  
    // Logger.log('keywordText before modification: ' + keywordText);
  
    // Merge the keywordText with the match type operators
    keywordText = combineKeywordTextAndMatchType(keywordText, matchType);
  
    // Logger.log('keywordText to be created: ' + keywordText);
  
  //Only create the keyword if it is less than, or equal to, 80 charachters
  if( keywordText.length <= 80 ){
    // Build the new keyword
    var keywordOperation = adGroup.newKeywordBuilder()
    .withText(keywordText)
    .build();
  
    // Push the keyword operation into an array
    // We will use it to a add labels to all of them
    keywordOperations.push(keywordOperation);
  } // end if
}


// Change the broad match keyword into a modified broad match keyword
function combineKeywordTextAndMatchType(keywordText, matchType){
  
  if( matchType == 'BROAD'){
    
    // add a plus at the beginning of the keyword
    keywordText = "+" + keywordText;
    
    // change all spaces into space_pluses
    keywordText = keywordText.replace(/ /g, " +");
  } else if (matchType == 'PHRASE'){
    // Add the quotes for phrase match
    keywordText = "\"" + keywordText + "\"";
  } else {
    // Add the square brackets for exact match
    keywordText = "[" + keywordText + "]";
  } // end if
  
  return keywordText;
}


// Print the list
// This is a debugging function
function showList(listArray){
  for ( i = listArray.length - 1; i > -1; i-- ){
    Logger.log(listArray[i]);
  }
}


// Remove all match type operators from the keyword
function cleanText(keywordText){
  
  //Logger.log("TextToFix = " + keywordText);
  
  var cleanKeywordText;
  
  // replace all pluses with spaces
  cleanKeywordText = keywordText.replace(/\+/g, " "); 
  
  // replace all left square brackets with nothing
  cleanKeywordText = cleanKeywordText.replace(/\[/g, "");
  
  // replace all right square brackets with nothing
  cleanKeywordText = cleanKeywordText.replace(/\]/g, "");
  
  // replace all quotes with nothing
  cleanKeywordText = cleanKeywordText.replace(/\"/g, "");
  
  // replace all multiple spaces with a single space
  cleanKeywordText = cleanKeywordText.replace(/\s\s+/g, ' ');; 
  
  // remove all spaces in front of the keyword
  cleanKeywordText = cleanKeywordText.replace(/^ /g, ""); 
  
  // remove all spaces at the end of the keyword
  cleanKeywordText = cleanKeywordText.replace(/ $/g, ""); 
  
  // Logger.log("cleaned text:  " + cleanKeywordText);
  return cleanKeywordText;
}


// Check if the label exists in the account.
// If not, create it
function checkLabel(label_to_check) {
  // Logger.log("check if label exists");
  
  // Get a list of all labels with the set label name
  var labelIterator = AdWordsApp.labels()
      .withCondition('Name = ' + label_to_check)
      .get();
  
  // Logger.log( "labelIterator.int = " + labelIterator.totalNumEntities());
  
  // Check if the label name is in the list
  if ( labelIterator.totalNumEntities() == 0 ) {
    return false;
  } else {
    return true;
  }
}


// Create the label
function createLabel(label_to_create){
  // Logger.log("creating label: " + label_to_create);
  AdWordsApp.createLabel(label_to_create);
  // Logger.log("label created");
}


// Remove a label
function removeTheLabel(labelToRemove){
  
  var labelIterator = AdWordsApp.labels()
  .withCondition("Name CONTAINS '" + labelToRemove + "'")
  .get();

 while (labelIterator.hasNext()) {
   var label = labelIterator.next();
   // Logger.log('');
   // Logger.log('removing label: ' + label.getName());
   label.remove();
 }
}
