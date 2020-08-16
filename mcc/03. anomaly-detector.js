/**
 * @name Anomaly checker stdev
 *
 * @author Bas Baudoin
 *
 * @instructions
 * - add email addresses and accountlabels
 * - guide: https://adsscripts.com/nl/scripts/google-ads-scripts/standaardafwijking-anomaly-checker
 *
 * @todo
 * - Impressions?
 *
 * @version 0.92 (working)
 * - added two standard deviations
 * - added data delay config item
 *
 */

var config = {
  email: [''],
  accountLabel: 'anomaly_detector',
  daysFrom: 180,
  daysTo: 1,
  dataDelayHours: 2
}

function main() {
  var account = AdsManagerApp.accounts().withCondition('LabelNames CONTAINS "' + config.accountLabel + '"')
  account.executeInParallel('go')
}

function go() {
  var alertMsg = ''
  var log = '--- \n' + AdsApp.currentAccount().getName() + '\n'

  var timeZone = timeZone || AdsApp.currentAccount().getTimeZone()
  var weekDays = {
    '1': 'MONDAY',
    '2': 'TUESDAY',
    '3': 'WEDNESDAY',
    '4': 'THURSDAY',
    '5': 'FRIDAY',
    '6': 'SATURDAY',
    '7': 'SUNDAY'
  }
  var dayOfWeek = weekDays[Utilities.formatDate(new Date(), timeZone, 'u').toUpperCase()]
  var hourOfDay = Utilities.formatDate(new Date(), timeZone, 'H')
  var adjustedHourOfDay = hourOfDay - config.dataDelayHours
  
  var dataPast = AdsApp.report(
   "SELECT Date, DayOfWeek, HourOfDay, Clicks, Impressions, Conversions, ConversionValue, Cost " +
    "FROM ACCOUNT_PERFORMANCE_REPORT " +
    "WHERE DayOfWeek = " + dayOfWeek + " " +
    "AND HourOfDay < " + adjustedHourOfDay + " " +
    "DURING " + getDateByDaysAgo(config.daysFrom) + ',' + getDateByDaysAgo(config.daysTo)
  )
  
  var weekDayObj = {}
  
  var rows = dataPast.rows()
  while (rows.hasNext()) {
    var week = rows.next()
    var date = week["Date"]
    var clicks = parseFloat(week["Clicks"])
    var conversions = parseFloat(week["Conversions"])
    if (weekDayObj[date] === undefined) {
      weekDayObj[date] = []
      weekDayObj[date]['clicks'] = []
      weekDayObj[date]['conversions'] = []
      weekDayObj[date]['clicks'].push(clicks)
      weekDayObj[date]['conversions'].push(conversions)
    } else {
      weekDayObj[date]['clicks'].push(clicks)
      weekDayObj[date]['conversions'].push(conversions)
    }
  }
  
  var pastClicks = []
  var pastConversions = []
  for (var date in weekDayObj) {
    var dayClicks = weekDayObj[date]['clicks']
    var dayConversions = weekDayObj[date]['conversions']
    var sumClicks = dayClicks.reduce(function (a,b) {return a + b}, 0)
    var sumConversions = dayConversions.reduce(function (a,b) {return a + b}, 0)
    pastClicks.push(sumClicks)
    pastConversions.push(sumConversions)
  }
  Logger.log(pastClicks)
  Logger.log(pastConversions)
  
  var todayClicks = AdsApp.currentAccount().getStatsFor('TODAY').getClicks()
  var statisticsClicks = getStatistics(pastClicks)
  var minClicks = statisticsClicks.mean - statisticsClicks.stdDev
  var minTwoClicks = statisticsClicks.mean - statisticsClicks.stdDev
  if (minTwoClicks > todayClicks) {
    alertMsg += 'Clicks: 2+ std van gemiddelde (min: ' + minTwoClicks.toFixed(2) + '), vandaag: ' + todayClicks + ' clicks \n'
  } else if (minClicks > todayClicks) {
    alertMsg += 'Clicks: 1+ std van gemiddelde (min: ' + minClicks.toFixed(2) + '), vandaag: ' + todayClicks + ' clicks \n'
  } else {
    log += 'Clicks: business as usual, min: ' + parseInt(minClicks) + ' today: ' + todayClicks + ' clicks \n'
  }
  
  var todayConversions = AdsApp.currentAccount().getStatsFor('TODAY').getConversions()
  var statisticsConversions = getStatistics(pastConversions)
  var minConversions = statisticsConversions.mean - statisticsConversions.stdDev
  var minTwoConversions = statisticsConversions.mean - statisticsConversions.stdDev * 2
  if (minTwoConversions > todayConversions) {
    alertMsg += 'Conversions: 2+ std van gemiddelde (min: ' + minTwoConversions.toFixed(2) + '), vandaag: ' + todayConversions + ' conversions \n'
  } else if (minConversions > todayConversions) {
    alertMsg += 'Conversions: 1+ std van gemiddelde (min: ' + minConversions.toFixed(2) + '), vandaag: ' + todayConversions + ' conversions \n'
  } else {
    log += 'Conversions: business as usual, min: ' + parseInt(minConversions) + ' today: ' + todayConversions + ' conversions \n'
  }
  
  Logger.log(log)
  if (alertMsg !== '') {
    Logger.log(alertMsg)
    MailApp.sendEmail(config.email, AdsApp.currentAccount().getName() + ' anomaly', alertMsg)
  }
}

// mean, variance, stdev, coefficient of variation
function getStatistics(numbers) {
  var total = 0
  for (i=0; i<numbers.length; i++) {
    total += numbers[i]
  }
  var mean = total / numbers.length
  
  var varTotal = 0
  for (j=0; j<numbers.length; j++) {
    varTotal += (numbers[j] - mean) * (numbers[j] - mean)
  }
  var variance = varTotal / numbers.length
  var stdDev = Math.sqrt(variance)
  var coefficientOfVariation = stdDev/mean
  var statistics = {
    variance: variance,
    stdDev: stdDev,
    mean: mean,
    coefficientOfVariation: coefficientOfVariation
  }
  //Logger.log('mean     = ' + mean.toFixed(2))
  //Logger.log('variance = ' + variance.toFixed(2))
  //Logger.log('stdev    = ' + stdDev.toFixed(2))
  //Logger.log('coefficient of variation = ' + coefficientOfVariation.toFixed(2))
  return statistics
}

function getDateByDaysAgo(daysAgo) {
	var today = new Date()
	today.setDate(today.getDate() - daysAgo)
  var formattedDate = Utilities.formatDate(today, 'PST', 'yyyyMMdd')
  return formattedDate
}
