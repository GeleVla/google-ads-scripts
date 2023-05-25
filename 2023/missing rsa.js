function main() {
  var missingCount = 0;

  // Selector for all active campaigns
  var campaignIterator = AdsApp.campaigns()
  .withCondition("Status = ENABLED")
  .withCondition("AdvertisingChannelType = SEARCH")
  .get();

  // Iterate through all active campaigns
  while (campaignIterator.hasNext()) {
    var campaign = campaignIterator.next();

    // Selector for all active ad groups in the current campaign
    var adGroupIterator = campaign.adGroups()
    .withCondition("Status = ENABLED")
    .get();

    // Iterate through all active ad groups
    while (adGroupIterator.hasNext()) {
      var adGroup = adGroupIterator.next();

      // Selector for all responsive search ads in the current ad group
      var rsaIterator = adGroup.ads()
      .withCondition("Type = RESPONSIVE_SEARCH_AD")
      .withCondition("Status = ENABLED")
      .get();

      // Check if RSA is missing in the current ad group
      if (!rsaIterator.hasNext()) {
        missingCount++;
      }
    }
  }

  Logger.log("Number of active ad groups missing RSA: " + missingCount);
}
