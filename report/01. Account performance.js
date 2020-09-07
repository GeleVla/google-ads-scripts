// Created by: Wouter Naber
// Changes by: Tibbe van Asten
//
// Created 09-08-2019
// Last update: 15-09-2019
//
// ABOUT THE SCRIPT
// Receive a daily update of your account performance by email.
//
////////////////////////////////////////////////////////////////////

var config = {

  // The name of the conversion in Google Ads
  CONVERSION_NAME : "Transacties (GTM)",

  // The name the conversion is given in the mail
  CONVERSION_MAIL : "purchases",

  // Emailaddresses the email is send to. Split multiple emailaddresses by comma.
  MAIL_RECEIVERS : "",

  // Your timezone
  TIMEZONE : "Europe / Amsterdam"

}

Date.prototype.getWeek = function() {
  var onejan = new Date(this.getFullYear(),0,1);
  return Math.ceil((((this - onejan) / 86400000) + onejan.getDay()+1)/7);
}

////////////////////////////////////////////////////////////////////

function main() {

  var report = AdsApp.report(
     "SELECT AllConversions, ConversionTypeName, CostPerAllConversion " +
     "FROM ACCOUNT_PERFORMANCE_REPORT " +
     "WHERE ConversionTypeName CONTAINS '"+ config.CONVERSION_NAME + "' " +
     "DURING LAST_30_DAYS");

  var rows = report.rows();

  while (rows.hasNext()) {
    var row = rows.next();

    if(row['AllConversions'].indexOf(",") > -1){
      var conv30 = row['AllConversions'].replace(/,/, '');
      var conv30f = Math.round(parseFloat(conv30));
    }

    var conv30f = Math.round(parseFloat(row['AllConversions'].replace(/,/, '')));
    var convname = row['ConversionTypeName'];
    var cpa30 = row['CostPerAllConversion'];
    var conv30perday = Math.round(conv30f/30);

  } // rowIterator

  var report = AdsApp.report(
    "SELECT Clicks, Cost " +
    "FROM ACCOUNT_PERFORMANCE_REPORT " +
    "DURING LAST_30_DAYS");

  var rows = report.rows();

  while (rows.hasNext()) {
    var row = rows.next();

    var clicks30 = row['Clicks'];
    var cost30raw = row['Cost'];

    if(row['Cost'].indexOf(",") > -1){
      var cost30 = row['Cost'].replace(/,/, '');
      var cost30f = Math.round(parseFloat(cost30));
    } else {
      var cost30f = Math.round(parseFloat(row['Cost']));
    }

    var cost30perday = Math.round(cost30f/30);

  } // rowIterator

  var report = AdsApp.report(
    "SELECT Clicks, Cost, Impressions, Ctr, AverageCpc, AveragePosition, SearchImpressionShare  " +
    "FROM ACCOUNT_PERFORMANCE_REPORT " +
    "DURING LAST_7_DAYS");
  
  var rows = report.rows();

  while (rows.hasNext()) {
    var row = rows.next();

    if(row['Clicks'].indexOf(",") > -1){
      var clicks7 = row['Clicks'].replace(/,/, '');
      var clicks7f = Math.round(parseFloat(clicks7));
    }

    var clicks7f = Math.round(parseFloat(row['Clicks'].replace(/,/, '')));

    if(row['Impressions'].indexOf(",") > -1){
      var imp7 = row['Impressions'].replace(/,/, '');
      var imp7f = Math.round(parseFloat(imp7));
    }

    var imp7f = Math.round(parseFloat(row['Impressions'].replace(/,/, '')));
    var ctr7f = parseFloat(row['Ctr']).toFixed(1);
    var AverageCpc7 = parseFloat(row['AverageCpc']).toFixed(1);
    var AveragePosition7f = parseFloat(row['AveragePosition']).toFixed(1);
    var SearchImpressionShare7f = parseFloat(row['SearchImpressionShare']).toFixed(0);

    if(row['Cost'].indexOf(",") > -1){
      var cost7 = row['Cost'].replace(/,/, '');
      var cost7f = Math.round(parseFloat(cost7));
    } else {
      var cost7f = Math.round(parseFloat(row['Cost']));
    }

    var cost7perday = Math.round(cost7f/7);
    var clicks7perday = Math.round(clicks7f/7);

  } // rowIterator

  var report = AdsApp.report(
    "SELECT AllConversions, ConversionTypeName, CostPerAllConversion " +
    "FROM ACCOUNT_PERFORMANCE_REPORT " +
    "WHERE ConversionTypeName CONTAINS '"+ config.CONVERSION_NAME + "' " +
    "DURING LAST_7_DAYS");

  var rows = report.rows();

  while (rows.hasNext()) {
    var row = rows.next();

    if(row['AllConversions'].indexOf(",") > -1){
      var conv7 = row['AllConversions'].replace(/,/, '');
      var conv7f = Math.round(parseFloat(conv7));
    }

    var conv7f = Math.round(parseFloat(row['AllConversions'].replace(/,/, '')));
    var convname = row['ConversionTypeName'];
    var cpa7 = row['CostPerAllConversion'];
    var conv7perday = Math.round(conv7f/7);

  } // rowIterator

  // Last two days
  var MILLIS_PER_DAY = 1000 * 60 * 60 * 24;
  var now = new Date();
  var yesterday = new Date(now.getTime() - MILLIS_PER_DAY);
  var daybeforeYesterday = new Date(yesterday.getTime() - MILLIS_PER_DAY);
  var daterange = Utilities.formatDate(daybeforeYesterday, config.TIMEZONE, 'yyyyMMdd') + "," + Utilities.formatDate(yesterday, config.TIMEZONE, 'yyyyMMdd');
  var dayofweek = now.getDay();

  var report = AdsApp.report(
    "SELECT Clicks, Cost " +
    "FROM ACCOUNT_PERFORMANCE_REPORT " +
    "DURING " + daterange);

  var rows = report.rows();

  while (rows.hasNext()) {
    var row = rows.next();
    var clicks2 = row['Clicks'];

    if(row['Cost'].indexOf(",") > -1){
      var cost2 = row['Cost'].replace(/,/, '');
      var cost2f = Math.round(parseFloat(cost2));
    } else{
      var cost2f = Math.round(parseFloat(row['Cost']));
    }

    var cost2perday = Math.round(cost2f/2);

  } // rowIterator

  var report = AdsApp.report(
    "SELECT AllConversions, ConversionTypeName, CostPerAllConversion " +
    "FROM ACCOUNT_PERFORMANCE_REPORT " +
    "WHERE ConversionTypeName CONTAINS '"+ config.CONVERSION_NAME + "' " +
    "DURING " + daterange);

  var rows = report.rows();

  while (rows.hasNext()) {
    var row = rows.next();

    if(row['AllConversions'].indexOf(",") > -1){
      var conv2 = row['AllConversions'].replace(/,/, '');
      var conv2f = Math.round(parseFloat(conv2));
    }

    var conv2f = Math.round(parseFloat(row['AllConversions'].replace(/,/, '')));
    var convname = row['ConversionTypeName'];
    var cpa2 = row['CostPerAllConversion'];
    var conv2perday = Math.round(conv2f/2);

  } // rowIterator

  // Week over Week
  var MILLIS_PER_DAY = 1000 * 60 * 60 * 24;
	var firstdaylastweek = new Date(now.getTime()  - (14 * MILLIS_PER_DAY));
	var samedaylastweek = new Date(now.getTime() - (8 * MILLIS_PER_DAY));
  var daybeforeYesterday = new Date(yesterday.getTime() - MILLIS_PER_DAY);
  var daterange1 = Utilities.formatDate(firstdaylastweek, config.TIMEZONE, 'yyyyMMdd') + "," + Utilities.formatDate(samedaylastweek, config.TIMEZONE, 'yyyyMMdd');

    Logger.log("samedaylastweek = " + Utilities.formatDate(samedaylastweek, config.TIMEZONE, 'yyyyMMdd'));
    Logger.log("firstdaylastweek = " + Utilities.formatDate(firstdaylastweek, config.TIMEZONE, 'yyyyMMdd') + "samedaylastweek = " + Utilities.formatDate(samedaylastweek, config.TIMEZONE, 'yyyyMMdd'));

  var report1 = AdsApp.report(
    "SELECT Clicks, Cost, Impressions, Ctr, AverageCpc, AveragePosition, SearchImpressionShare " +
    "FROM ACCOUNT_PERFORMANCE_REPORT " +
    "DURING " + daterange1);

  var rows = report1.rows();

  while (rows.hasNext()) {
    var row = rows.next();

    if(row['Impressions'].indexOf(",") > -1){
      var wowimp7 = row['Impressions'].replace(/,/, '');
      var wowimp7f = Math.round(parseFloat(wowimp7));
    }

    var wowimp7f = Math.round(parseFloat(row['Impressions'].replace(/,/, '')));
    var wowctr7f = parseFloat(row['Ctr']).toFixed(1);
    var wowAverageCpc7 = parseFloat(row['AverageCpc']).toFixed(1);
    var wowAveragePosition7f = parseFloat(row['AveragePosition']).toFixed(1);
    var wowSearchImpressionShare7f = parseFloat(row['SearchImpressionShare']).toFixed(0);

    if(row['Clicks'].indexOf(",") > -1){
      var wowclicks7 = row['Clicks'].replace(/,/, '');
      var wowclicks7f = Math.round(parseFloat(wowclicks7));
    }

    var wowclicks7f = Math.round(parseFloat(row['Clicks'].replace(/,/, '')));

    if(row['Cost'].indexOf(",") > -1){
      var wowcost7 = row['Cost'].replace(/,/, '');
      var wowcost7f = Math.round(parseFloat(wowcost7));
    }
    var wowcost7f = Math.round(parseFloat(row['Cost'].replace(/,/, '')));
    var wowcost7perday = Math.round(wowcost7f/7);
    var wowclicks7perday = Math.round(wowclicks7f/7);

  } // rowIterator

  var report1 = AdsApp.report(
    "SELECT AllConversions, ConversionTypeName, CostPerAllConversion " +
    "FROM ACCOUNT_PERFORMANCE_REPORT " +
    "WHERE ConversionTypeName CONTAINS '"+ config.CONVERSION_NAME + "' " +
    "DURING " + daterange1);

  var rows = report1.rows();

  while (rows.hasNext()) {
    var row = rows.next();

    if(row['AllConversions'].indexOf(",") > -1){
    	var wowconv7 = row['AllConversions'].replace(/,/, '');
      var wowconv7f = Math.round(parseFloat(wowconv7));
    }

    var wowconv7f = Math.round(parseFloat(row['AllConversions'].replace(/,/, '')));
  	var convname = row['ConversionTypeName'];
  	var wowcpa7 = row['CostPerAllConversion'];
    var wowconv7perday = Math.round(wowconv7f/7)

  } // rowIterator

  // All text fixes
  var cpatrendlong = Math.round(((cpa7 - cpa30) / cpa30)*100);
  var cpatrendshort = Math.round(((cpa2 - cpa7) / cpa7)*100);
  var costtrendlong = Math.round(((cost7perday - cost30perday) / cost30perday)*100);
  var costtrendshort = Math.round(((cost2perday - cost7perday) / cost7perday)*100);
  var convtrendlong = Math.round(((conv7perday - conv30perday) / conv30perday)*100);
  var convtrendshort = Math.round(((conv2perday - conv7perday) / conv7perday)*100);
  var wowconvtrend = Math.round(((conv7f - wowconv7f) / wowconv7f)*100);
  var wowclicktrend = Math.round(((clicks7f - wowclicks7f) / wowclicks7f)*100);
  var wowimptrend = Math.round(((imp7f - wowimp7f) / wowimp7f)*100);
  var wowctrtrend = Math.round(((ctr7f - wowctr7f) / wowctr7f)*100);
  var wowpostrend = Math.round(((AveragePosition7f - wowAveragePosition7f) / wowAveragePosition7f)*100);
  var wowsistrend = Math.round(((SearchImpressionShare7f - wowSearchImpressionShare7f) / wowSearchImpressionShare7f)*100);
  var wowcpctrend = Math.round(((AverageCpc7 - wowAverageCpc7) / wowAverageCpc7)*100);
  var wowcosttrend = Math.round(((cost7f - wowcost7f) / cost7f)*100);
  var wowcpatrend = Math.round(((conv7perday - wowconv7perday) / wowconv7perday)*100);

  var lastweek = samedaylastweek.getWeek() - 1;
  var thisweek = yesterday.getWeek() - 1;

  if(cpatrendlong > 0){
    var aftoecpatrendlong = 'increased';
    var aftoecpatrendlongcolor = 'red';
  } else {
    var aftoecpatrendlong = 'decreased';
    var aftoecpatrendlongcolor = 'green';
  }

  if(cpatrendshort > 0){
    var aftoecpatrendshort = 'increased';
    var aftoecpatrendshortcolor = 'green';
  } else {
    var aftoecpatrendshort = 'decreased';
    var aftoecpatrendshortcolor = 'red';
  }

  if(convtrendlong > 0){
    var aftoecpalong = 'increase';
    var aftoecpalongcolor = 'red';
    var hooglaagcpalongcolor = 'higher';
  } else {
    var aftoecpalonglong = 'decrease';
    var aftoecpalongcolor = 'green';
    var hooglaagcpalongcolor = 'lower';
  }

  if(convtrendshort > 0){
    var aftoecpashort = 'increase';
    var aftoecpashortcolor = 'red';
    var hooglaagcpashortcolor = 'higher';
  } else {
    var aftoecpashort = 'decrease';
    var aftoecpashortcolor = 'green';
    var hooglaagcpashortcolor = 'lower';
  }

  if(costtrendlong > 0){
    var aftoecosttrendlong = 'increased';
  } else {
    var aftoecosttrendlong = 'decreased';
  }

  if(costtrendshort > 0){
    var aftoecosttrendshort = 'increased';
  } else {
    var aftoecosttrendshort = 'decreased';
  }

  if(wowconvtrend > 0){
    var aftoewowconvtrend = 'increased';
    var aftoewowconvtrendcolor = 'green';
  } else {
    var aftoewowconvtrend = 'decreased';
    var aftoewowconvtrendcolor = 'red';
    wowconvtrend = wowconvtrend * -1;
  }

  if(wowclicktrend > 0){
    var aftoewowclicktrend = 'increased';
    var aftoewowclicktrendcolor = 'green';
  } else {
    var aftoewowclicktrend = 'decreased';
    var aftoewowclicktrendcolor = 'red';
    wowclicktrend = wowclicktrend * -1;
  }

  if(wowimptrend > 0){
    var aftoewowimptrend = 'increased';
    var aftoewowimptrendcolor = 'green';
  } else {
    var aftoewowimptrend = 'decreased';
    var aftoewowimptrendcolor = 'red';
    wowimptrend = wowimptrend * -1;
  }

  if(wowctrtrend > 0){
    var aftoewowctrtrend = 'increased';
    var aftoewowctrtrendcolor = 'green';
  } else {
    var aftoewowctrtrend = 'decreased';
    var aftoewowctrtrendcolor = 'red';
    wowctrtrend = wowctrtrend * -1;
  }

  if(wowpostrend > 0){
    var aftoewowpostrend = 'decreased';
    var aftoewowpostrendcolor = 'green';
    wowpostrend = wowpostrend * -1;
  } else {
    var aftoewowpostrend = 'increased';
    var aftoewowpostrendcolor = 'red';
  }

  if(wowsistrend > 0){
    var aftoewowsistrend = 'increased';
    var aftoewowsistrendcolor = 'green';
  } else {
    var aftoewowsistrend = 'decreased';
    var aftoewowsistrendcolor = 'red';
    wowsistrend = wowsistrend * -1;
  }

  if(wowcpctrend > 0){
    var aftoewowcpctrend = 'increased';
    var aftoewowcpctrendcolor = 'red';
  } else {
    var aftoewowcpctrend = 'decreased';
    var aftoewowcpctrendcolor = 'green';
    wowcpctrend = wowcpctrend * -1;
  }

  if(wowcosttrend > 0){
    var aftoewowcosttrend = 'increased';
    var aftoewowcosttrendcolor = 'red';
  } else {
    var aftoewowcosttrend = 'decreased';
    var aftoewowcosttrendcolor = 'green';
    wowcosttrend = wowcosttrend * -1;
  }

  if(wowcpatrend > 0){
    var aftoewowcpatrend = 'increased';
    var aftoewowcpatrendcolor = 'red';
  } else {
    var aftoewowcpatrend = 'decreased';
    var aftoewowcpatrendcolor = 'green';
    wowcpatrend = wowcpatrend * -1;
  }

  if(dayofweek === 1.0){
    var headline2 = "<h3>Week "+ thisweek+ " vs Week " + lastweek + "</h3>";
  } else {
    var headline2 = "<h3>Last 7 days vs 7 days before that</h3>";
  }
  
  var account = AdsApp.currentAccount().getName();

MailApp.sendEmail({
   to: '' + config.MAIL_RECEIVERS + '',
   subject:  "Daily Google Ads Report " + account,
   htmlBody: "<h2>Summary Google Ads "+ account +"</h2>The last two days <b>€" + cost2f + "</b> is spend (€" + cost2perday + " per day). With " + conv2f + " " + config.CONVERSION_MAIL + " as result ("+ conv2perday + " per day) with a CPA of <b>€" + cpa2 +
    "</b>. <br> The last 7 days <b>€" + cost7f + "</b> is spend (€" + cost7perday + " per day). With " + conv7f + " " + config.CONVERSION_MAIL + " as result ("+ conv7perday + " per day) with a CPA of <b>€" + cpa7 +
    "</b>. <br> The last 30 days <b>€" + cost30f + "</b> is spend (€" + cost30perday + " per day). With " + conv30f + " " + config.CONVERSION_MAIL + " as result ("+ conv30perday + " per day) with a CPA of <b>€" + cpa30 +
    "</b>. <br><br> The last 7 days the CPA <b><font color='"+ aftoecpatrendlongcolor + "'>" + aftoecpatrendlong + " by " + cpatrendlong + "%" +"</font></b>." +
    "<h3>Week "+ thisweek+ " vs Week " + lastweek + "</h3>" +
    "<ul>" +
    "<li>The " + config.CONVERSION_MAIL + " are <b><font color='"+ aftoewowconvtrendcolor + "'>" + aftoewowconvtrend + " by " + wowconvtrend + "%</font></b> " +" ("+ conv7f + " vs " + wowconv7f + ").</li>" +
    "<li>The clicks are <b><font color='"+ aftoewowclicktrendcolor + "'>" + aftoewowclicktrend + " by " + wowclicktrend + "%</font></b> " +" ("+ clicks7f + " vs " + wowclicks7f + "). </li>" +
    "<li>The CTR is <b><font color='"+ aftoewowctrtrendcolor + "'>" + aftoewowctrtrend + " by " + wowctrtrend + "%</font></b> " +" ("+ ctr7f + " vs " + wowctr7f + "). </li>" +
    "<li>The impressions are <b><font color='"+ aftoewowimptrendcolor + "'>" + aftoewowimptrend + " by " + wowimptrend + "%</font></b> " +" ("+ imp7f + " vs " + wowimp7f + "). </li>" +
    "<li>The avg. CPC is <b><font color='"+ aftoewowcpctrendcolor + "'>" + aftoewowcpctrend + " by " + wowcpctrend + "%</font></b> " +" (€"+ AverageCpc7 + " vs €" + wowAverageCpc7 + "). </li>" +
    "<li>The cost is <b><font color='"+ aftoewowcosttrendcolor + "'>" + aftoewowcosttrend + " by " + wowcosttrend + "%</font></b> " +" (€"+ cost7f + " vs €" + wowcost7f + "). </li>" +
    "<li>The avg. position is <b><font color='"+ aftoewowpostrendcolor + "'>" + aftoewowpostrend + " by " + wowpostrend + "%</font></b> " +" ("+ AveragePosition7f + " vs " + wowAveragePosition7f + "). </li>" +
    "<li>The Seach Impression Share is <b><font color='"+ aftoewowsistrendcolor + "'>" + aftoewowsistrend + " by " + wowsistrend + "%</font></b> " +" ("+ SearchImpressionShare7f + " vs " + wowSearchImpressionShare7f + ").</li>" +
    "</ul>"
 });
} // function main
