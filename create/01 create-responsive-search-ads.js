// Copyright 2020. Increase BV. All Rights Reserved.
//
// Created By: Tibbe van Asten
// for Increase B.V.
//
// Created: 01-03-2019
// Last update: 20-05-2020
//
// ABOUT THE SCRIPT
// With this script you can automatically add Responsive Search Ads
// to all of your adgroups. The script selects all adgroups without an RSA, 
// collects headlines and descriptions from active text ads in that adgroup, 
// finds the Final-URL with the highest conversionrate in the adgroup and 
// puts all of that together in an RSA. 
// You can also add backup headlines and descriptions.
//
// Link guide: https://adsscripts.com/scripts/google-ads-scripts/create-responsive-search-ads
//
////////////////////////////////////////////////////////////////////

var config = {
  
  LOG : true,
  
  // Back-up adcopy. When space left, these headlines and descriptions are added to the RSA
  // You can add as many backup headlines as you want, but make sure the set NUM_HEADLINES
  // correct to the number of headlines you've created and name the headlines consecutive
  HEADLINE_1 : "",
  HEADLINE_2 : "",
  HEADLINE_3 : "",
  NUM_HEADLINES : 3,
  
  DESCRIPTION_1 : "",
  DESCRIPTION_2 : "",
  
  // Select only adgroups with this label. Leave empty when you don't want to use this.
  ADGROUP_LABEL : "",
  
  // Add a label to the new Responsive Search Ads. Leave empty when you don't want to use this.
  RSA_LABEL : ""
  
}

////////////////////////////////////////////////////////////////////

function main() {
  
  checkLabel();
  
  var result = testCopy();
  var list = [];
  
  if(config.ADGROUP_LABEL !== ""){
    var adGroupIterator = AdsApp
      .adGroups()
      .withCondition("Status = ENABLED")
      .withCondition("CampaignStatus = ENABLED")
      .withCondition("AdvertisingChannelType = SEARCH")	
      .withCondition("LabelNames CONTAINS_ANY ['"+config.ADGROUP_LABEL+"']")	    
      .get();
  } else{
    var adGroupIterator = AdsApp
      .adGroups()
      .withCondition("Status = ENABLED")
      .withCondition("CampaignStatus = ENABLED")
      .withCondition("AdvertisingChannelType = SEARCH")	    
      .get();
  }    
  
  while(adGroupIterator.hasNext()){
    var adGroup = adGroupIterator.next();
    
    if(!adGroup.ads().withCondition("Type IN [RESPONSIVE_SEARCH_AD]").get().hasNext() && adGroup.getCampaign().isBaseCampaign() === true){
      
      	var url = getUrl(adGroup);      
      	if(!url){ continue; }
      
      	var adOperation = adGroup.newAd().responsiveSearchAdBuilder().withFinalUrl(url);

        adOperation = getAdcopy(adGroup, adOperation).build();      
      	list.push(adOperation);
      
    } // Filter adgroups with responsive search ads
    
  } // adGroupIterator   
  
  	if(list.length > 0){
  	  Logger.log("Added Responsive Search Ads to"); 
  	}
  
  // Log all added adGroups
  for (var i = 0; i < list.length; i++) {
    var adOperation = list[i];
    
   	if(adOperation.isSuccessful() === true){
    	  var ad = adOperation.getResult();  
      
      	  if(config.RSA_LABEL !== ""){
      	    ad.applyLabel(config.RSA_LABEL);
          }
      
      	Logger.log(ad.getAdGroup().getCampaign().getName() + ", " + ad.getAdGroup().getName());
    } else {
      Logger.log("ERROR: " + adOperation.getErrors());
    }
      
  }
  
  Logger.log("Thanks for using this custom script by Tibbe van Asten. Winning!");
  
} // function main()

////////////////////////////////////////////////////////////////////

function testCopy(){
    
    for (var i = 1;i < (config.NUM_HEADLINES + 1); i++) { 
        if(eval('config.HEADLINE_' + i).length > 30 || eval('config.HEADLINE_' + i) === ""){
          	throw Error("Check Headline " + i);
        }
    }
  
    if(config.DESCRIPTION_1.length > 90 || config.DESCRIPTION_1 === ""){
      throw Error("Check Description 1");
    }
  
    if(config.DESCRIPTION_2.length > 90 || config.DESCRIPTION_2 === ""){
      throw Error("Check Description 2");
    }
  
} // testCopy

////////////////////////////////////////////////////////////////////

function getUrl(adGroup){
 
  if(adGroup.getStatsFor("LAST_30_DAYS").getConversions() > 0){
    
    var adIterator = adGroup
      .ads()
      .withCondition("Status = ENABLED")
      .orderBy("ConversionRate DESC")
      .forDateRange("LAST_30_DAYS")
      .withLimit(1)
      .get();

    while(adIterator.hasNext()){
      var ad = adIterator.next();
      var url = ad.urls().getFinalUrl();
    }
    
  } else{
  
    var adIterator = adGroup
      .ads()
      .withCondition("Status = ENABLED")
      .withLimit(1)
      .get();

    while(adIterator.hasNext()){
      var ad = adIterator.next();
      var url = ad.urls().getFinalUrl();
    }
    
  }
  
    if(config.LOG === true && url !== null){
      Logger.log(adGroup.getName());
      Logger.log("Url: " + url);
    }
  
  return url;
  
} // getUrl()

////////////////////////////////////////////////////////////////////

function checkLabel(){
  
  if(config.RSA_LABEL !== "" && !AdsApp.labels().withCondition("Name = '"+config.RSA_LABEL+"'").get().hasNext()) {
    AdsApp.createLabel(config.RSA_LABEL);

    	if(config.LOG === true){
    	  Logger.log("Label " + config.RSA_LABEL + " created");
        }
  }
  
} // function checkLabel()

////////////////////////////////////////////////////////////////////

function getAdcopy(adGroup, adOperation){
  
  var headlines = [];
  var descriptions = [];
  var path1 = "";
  var path2 = "";
  
  var adIterator = adGroup
    .ads()
    .withCondition("Status = ENABLED")
    .withCondition("Type = EXPANDED_TEXT_AD")
    .get();
  
  while(adIterator.hasNext()){
    var ad = adIterator.next();    
    
    // Add headlines if unique
    if(ad.getHeadlinePart1().indexOf("{=") < 0 && headlines.indexOf(ad.getHeadlinePart1()) < 0 && headlines.length < 15){
      headlines.push(ad.getHeadlinePart1());
      
        if(config.LOG === true){
          Logger.log("Added a headline 1");
        }
    }
    
    if(ad.getHeadlinePart2().indexOf("{=") < 0 && headlines.indexOf(ad.getHeadlinePart2()) < 0 && headlines.length < 15){
      headlines.push(ad.getHeadlinePart2());
      
      	if(config.LOG === true){
          Logger.log("Added a headline 2");
        }
    }
    
    if(ad.getHeadlinePart3() != null && ad.getHeadlinePart3().indexOf("{=") < 0  && headlines.indexOf(ad.getHeadlinePart3()) < 0 && headlines.length < 15){
      headlines.push(ad.getHeadlinePart3());
      
         if(config.LOG === true){
          Logger.log("Added a headline 3");
        }
    }
    
    // Add descriptions if unique
    if(ad.getDescription1().indexOf("{=") < 0 && descriptions.indexOf(ad.getDescription1()) < 0 && descriptions.length < 4){
      descriptions.push(ad.getDescription1());
      
        if(config.LOG === true){
          Logger.log("Added a description 1");
        }
    }
    
    if(ad.getDescription2() !== null && ad.getDescription2().indexOf("{=") < 0 && descriptions.indexOf(ad.getDescription2()) < 0 && descriptions.length < 4){
      descriptions.push(ad.getDescription2());
      
        if(config.LOG === true){
          Logger.log("Added a description 2");        
        }
    }    

    // Add paths
    if(ad.getPath1() != "" && path1 == ""){
      path1 = ad.getPath1() || "";
      
        if(config.LOG === true){
          Logger.log("Added path 1");        
        }
    }

    // Add paths
    if(ad.getPath2() != "" && path2 == ""){
      path2 = ad.getPath2() || "";
      
        if(config.LOG === true){
          Logger.log("Added path 2");        
        }
    }
    
  } // adIterator
  
  
  // If the number of headlines from existing ads is less then 15, we add the backup headlines
  for (var i = 1;headlines.length < 15 && i < (config.NUM_HEADLINES + 1); i++) { 
    if(headlines.indexOf(eval('config.HEADLINE_' + i)) < 0){
  	headlines.push(eval('config.HEADLINE_' + i));
    }
  }
  
    // Now we add all headlines to the adOperation
    for (var i = 0; i < headlines.length; i++) { 
      adOperation.addHeadline(headlines[i]);
    }
  
  // If the number of descriptions from existing ads is less then 4, we add the backup descriptions
  for (var i = 1;descriptions.length < 4 && i < 3; i++) { 
    if(descriptions.indexOf(eval('config.DESCRIPTION_' + i)) < 0){
  	descriptions.push(eval('config.DESCRIPTION_' + i));
    }
  }
  
    // Now we add all descriptions to the adOperation
    for (var i = 0; i < descriptions.length; i++) { 
      adOperation.addDescription(descriptions[i]);
    }

    // Now we add the paths to the adOperation
    if(path1 != ""){
      adOperation.withPath1(path1);
    }

    if(path2 != ""){
      adOperation.withPath2(path2)
    }
  
    if(config.LOG === true){
      Logger.log(headlines);
      Logger.log(descriptions);
      Logger.log(" "); 
    }
  
  return adOperation;    
  
} // getAdcopy
