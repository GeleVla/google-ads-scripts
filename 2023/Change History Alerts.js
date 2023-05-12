// Copyright 2023. All Rights Reserved.
// Change History Alerts by Nils Rooijmans
//
// V1.2 - changes made by Arjan Schoorl for Flowboost
//
// ABOUT THE SCRIPT
// The script checks all the entries in the Google Ads change history of your account, 
// and if there is a change by a user outside of floboost.nl, you will get an alert via email.
// The alert mail conatins the number of changes as well as a link to the Google Sheet that lists all changes by unrecognized users.
//
////////////////////////////////////////////////////////////////////

var config = {

    // Insert a new blank spreadsheet url between the double quotes
    SPREADSHEET_URL: "sheets.new",

    // Alert email adresses, insert your email adresses between the double quotes. You can add multiple email addresses between the double quotes, just separate them via a comma, ie: "john@doe.com, jane@doe.com"
    emailAdresses: "mail@company.com",

    // Setting to enable or disable sending of email
    sendMail: true,

    // Threshold settings
    period: "YESTERDAY" // the date range you want to look at

}

function main() {

    Logger.log("Processing account: " + AdsApp.currentAccount().getName());

    var changeAlerts = getChangeAlerts();

    if (changeAlerts.length > 0) {
        reportResults(changeAlerts);
        sendEmail(changeAlerts.length);
    } else {
        Logger.log("Could not find any changes in change history that were made by users other than floboost.nl \n");
    }
}


// look into change history and return changes to add to alert report
function getChangeAlerts() {

    var accountName = AdsApp.currentAccount().getName();

    var changes = [];


    var query = "SELECT " +
        "campaign.name, " +
        "ad_group.name, " +
        "change_event.change_date_time, " +
        "change_event.change_resource_type, " +
        "change_event.changed_fields, " +
        "change_event.client_type, " +
        "change_event.feed, " +
        "change_event.feed_item, " +
        "change_event.new_resource, " +
        "change_event.old_resource, " +
        "change_event.resource_change_operation, " +
        "change_event.resource_name, " +
        "change_event.user_email " +
        "FROM change_event " +
        "WHERE change_event.change_date_time DURING " +config.period+" " +
        "ORDER BY change_event.change_date_time DESC " +
        "LIMIT 9999 "; // max of 10k changes reported per request

    Logger.log("query: " + query);

    try {
        var result = AdsApp.search(query);
    } catch (e) {
        alert("Issue retrieving results from search API: " + e);
    }

    while (result.hasNext()) {
        var row = result.next();

        // Ignore users with email ending with 'floboost.nl'
        if (row.changeEvent.userEmail.endsWith('floboost.nl')) {
            continue;
        }

        var campaignName = "";
        var adGroupName = "";

        // hack to prevent undefined variable from stopping script execution
        try {
            campaignName = row.campaign.name;
            adGroupName = row.adGroup.name;
        } catch (e) {
        }

        try {
            var change = [
                row.changeEvent.changeDateTime,
                accountName,
                row.changeEvent.userEmail,
                row.changeEvent.clientType,
                campaignName,
                adGroupName,
                row.changeEvent.changeResourceType,
                row.changeEvent.changedFields,
                row.changeEvent.feed,
                row.changeEvent.feedItem,
                row.changeEvent.newResource,
                row.changeEvent.oldResource,
                row.changeEvent.resourceChangeOperation
            ];

            changes.push(change);

        } catch (e) {
            Logger.log("Issue with parsing results from search API: " + e);
        }

    }

    return changes;
}


function addHeaderToOutputSheet(sheet) {

    var header = [
        "date",
        "account",
        "user",
        "clientType",
        "campaignName",
        "adGroupName",
        "changeResourceType",
        "changedFields",
        "feed",
        "feedItem",
        "newResource",
        "oldResource",
        "resourceChangeOperation"
    ];

    sheet.appendRow(header);
}


function reportResults(changes) {

    var sheet = prepareOutputSheet();

    addOutputToSheet(changes, sheet);
}


function prepareOutputSheet() {

    var spreadsheet = SpreadsheetApp.openByUrl(config.SPREADSHEET_URL);
    if (!spreadsheet) {
        alert("Cannot open new reporting spreadsheet");
        return;
    }

    var sheet = spreadsheet.getActiveSheet();
    if (!sheet) {
        alert("Cannot open new reporting sheet");
        return;
    }

    var numberOfRows = sheet.getLastRow();

    if (numberOfRows == 0) { // the sheet has no header
        addHeaderToOutputSheet(sheet);
    }

    return sheet;
}


function addOutputToSheet(output, sheet) {

    var numberOfRows = sheet.getLastRow();

    sheet.insertRowsBefore(2, output.length); // add empty rows below header row

    var startRow = 2;

    var range = sheet.getRange(startRow, 1, output.length, output[0].length);
    range.setValues(output);

    Logger.log("\nNumber of rows added to output sheet: " + output.length + "\n\n");

}


function sendEmail(numberOfalerts) {

    var accountName = AdsApp.currentAccount().getName();

    if (config.sendMail) {
        // send the email
        var emailBody =
            "Number of changes: " + numberOfalerts + "\n" +
            "See details: " + config.SPREADSHEET_URL + "\n";

        // Include account name in the subject
        var emailSubject = accountName + " - Change History Alerts";

        MailApp.sendEmail(config.emailAdresses, emailSubject, emailBody);
        Logger.log("Sending alert mail");
    }
}

function alert(string) {
    Logger.log("### " + string);
}
