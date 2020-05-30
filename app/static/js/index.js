// DEFINE VARIABLES
// color constants
//console.log('Define color constants')

const colors = {
    bg_NeedSM:  "#0000FF",  // Blue
    fg_NeedSM:  "#FFFFFF",  // White
    bg_NeedTC:  "#00FF00",  // Green
    fg_NeedTC:  "#FFFFFF",  // White
    bg_NeedBoth:"#FFFFFF",  // White
    fg_NeedBoth:"#000000",  // Black
    bg_Filled:  "#FF0000",  // Red
    fg_Filled:  "#FFFFFF",  // White
    bg_Sunday:  "#cccccc",  // Light grey
    fg_Sunday:  "#FFFFFF",  // White
    bg_Closed:  "#2E86C1",  // Aqua
    fg_Closed:  "#000000",  // Black
    bg_ToManySM:"#FAFE02",  // Yellow
    fg_ToManySM:"#000000",  // Black
    bg_ToManyTC:"#FE4E02",  // Orange
    fg_ToManyTC:"#000000",  // Black
    bg_PastDate:"#cccccc",  // Light grey
    fg_PastDate:"#FFFFFF"   // White
};

// Declare global variables)
//console.log('Define current filter variables')
var yearFilter=localStorage.getItem('yearFilter')
var shopFilter =localStorage.getItem('shopFilter')
// var dutyFilter=localStorage.getItem('dutyFilter')
var startUpYear = localStorage.getItem('startUpYear')
var clientLocation = localStorage.getItem('clientLocation')
var todaysDate = new Date();
var currentYear = todaysDate.getFullYear()
var firstTimeThrough = localStorage.getItem('firstTimeSwitch')
var currentMemberID = ''
var shopNames = ['Rolling Acres', 'Brownwood']
var shopData = []
var staffID = '111111'

//var nameList = []

// DEFINE EVENT LISTENERS
document.getElementById("yearToDisplay").addEventListener("change", yearChanged);
document.getElementById("shopToDisplay").addEventListener("change", shopChanged);
document.getElementById("refreshCalendarBtn").addEventListener("click",refreshCalendarRtn)
document.getElementById("selectpicker").addEventListener("change",memberSelectedRtn)
window.addEventListener('unload', function(event) {
    //console.log('Removing firstTimeSwitch from localStorage.');
    localStorage.removeItem('firstTimeSwitch');
});


// FIRST TIME ROUTINES
// IS THIS THE FIRST TIME ON THIS PAGE?
// firstTimeThrough = localStorage.getItem('firstTimeSwitch')
if (firstTimeThrough == null) {
    localStorage.setItem('firstTimeSwitch',false)

    if (!localStorage.getItem('staffID')) {
        localStorage.setItem('staffID','111111')
    }
    else {
        staffID = localStorage.getItem('staffID')
    }
    
    // IF clientLocation OR startUpYear IS NOT FOUND IN LOCAL STORAGE
    // THEN PROMPT WITH MODAL FORM FOR LOCATION AND YEAR
    if (!clientLocation || !startUpYear) {
        // PROMPT USER TO ENTER THEIR DESIRED LOCATION AND STARTING YEAR
        document.getElementById('settingsBtn').click()
    }

    // Get stored start up year if it exists otherwise set todays date
    // startUpYear  = localStorage.getItem('startUpYear')
    if (startUpYear != null) {
        setStartUpYear(startUpYear)
        setupYearFilter(startUpYear)
    }
    else {
        setupYearFilter(currentYear)
    }

    setShopFilter(clientLocation)

    // WAS A MEMBER ID INCLUDED IN THE URL?
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    if (urlParams.has('id')) {
        currentMemberID = urlParams.get('id')
        populateMemberSchedule(currentMemberID)
    }
    else {
        currentMemberID=''
        document.getElementById('memberNameHdg').innerHTML = ' '  
    }
    
    //  END OF FIRST TIME ROUTINE
}

//  SET FILTER VALUES BASED ON localStorage values

// Set the value for shop location filter
// Set shop dropdown box default value
setShopFilter(shopFilter)

// Set the value for duty
//setDutyFilter(dutyFilter)

// Disable the 'Refresh Calendar' button
document.getElementById("refreshCalendarBtn").disabled = true;

// Build initial calendar based on default settings OR get settings from cookies
buildYear(yearFilter); 

// POPULATE CALENDAR USING STARTUP PARAMETERS
populateCalendar(yearFilter,shopFilter) //,dutyFilter)
//populateNameList()


// ------------------------------------------------------------------------------------------------------
// FUNCTIONS    
// ------------------------------------------------------------------------------------------------------

function yearChanged() {
    yearFilter = this.value;
    localStorage.setItem('yearFilter', yearFilter);
    enableRefreshBtn()
}

function shopChanged() {
    shopFilter = this.value  //document.getElementById('shop').value
    localStorage.setItem('shopFilter',this.value)
    enableRefreshBtn()
}

// function dutyChanged() {
//     dutyFilter = this.value
//     localStorage.setItem('dutyFilter',this.value)
//     enableRefreshBtn();
// }

function setStartUpYear(startYear) {
    yearFilter = startYear;
    localStorage.setItem('yearFilter', yearFilter)
    localStorage.setItem('startUpYear', yearFilter)
}

function setupYearFilter(startYear) {
    yearFilter = startYear;
    localStorage.setItem('yearFilter', yearFilter)
    thisYear = startYear
    intYear = parseInt(startYear)
    numLastYear = intYear - 1
    numNextYear = intYear + 1
    lastYear = numLastYear.toString();
    nextYear = numNextYear.toString();
    document.getElementById('lastYear').innerHTML= lastYear
    document.getElementById('thisYear').innerHTML= thisYear
    document.getElementById('nextYear').innerHTML= nextYear
    document.getElementById('lastYear').value = lastYear
    document.getElementById('thisYear').value = thisYear
    document.getElementById('nextYear').value = nextYear
    document.getElementById("yearToDisplay").selectedIndex = 1; //Option middle year
}

function setShopFilter(shopLocation) {
    switch(shopLocation){
        case 'RA':
            localStorage.setItem('shopFilter','RA')
            document.getElementById("shopToDisplay").selectedIndex = 0; //Option Rolling Acres
            shopFilter = 'RA'
            break;
        case 'BW':
            localStorage.setItem('shopFilter','BW')
            document.getElementById("shopToDisplay").selectedIndex = 0; //Option Rolling Acres
            shopFilter = 'BW'
            break;
        default:
            localStorage.setItem('shopFilter','BOTH')
            document.getElementById("shopToDisplay").selectedIndex = 2; //Option Both
            shopFilter = 'BOTH'
    }   
}


function enableRefreshBtn() {
    document.getElementById("refreshCalendarBtn").disabled = false; 
}


function dayClicked(clicked_id) {
    // send POST request with year, shop, and duty
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/getDayAssignments"); 
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.onreadystatechange = function() {
        //console.log('onreadystatechange')
        if (this.readyState == 4 && this.status == 200) {
            // PROCESS RESPONSE FROM REQUEST
            sched = JSON.parse(this.response)
            yyyymmdd = clicked_id.slice(1,9)
            dayNumber = sched[1][7]
            // IF THE CURRENT SHOP LOCATION IS SET TO 'BOTH' THEN BUILD A DAY SCHEDULE FOR EACH LOCATION
            if (shopFilter == 'BOTH') {
                scheduleNumber = 1
                buildDayTable(scheduleNumber,1,sched,yyyymmdd,dayNumber)
                scheduleNumber = 2
                buildDayTable(scheduleNumber,2,sched,yyyymmdd,dayNumber)
            }
            else if (shopFilter == 'RA'){
                    scheduleNumber = 1
                    buildDayTable(scheduleNumber,1,sched,yyyymmdd,dayNumber)
                }
                else {
                    scheduleNumber = 2
                    buildDayTable(scheduleNumber,2,sched,yyyymmdd,dayNumber)
                }
        
            
        }
    }  // END OF xhttp
    // SEND REQUEST
    if (shopFilter == 'BOTH') {
        alert("Assignments for each location will be displayed.")
        shopNumber = '3'
    }

    if (shopFilter == 'RA') {    
        shopNumber = '1'
    }
    else if (shopFilter == 'BW') {
        shopNumber = '2'
    }
    var data = {shopNumber:shopNumber,dayID:clicked_id}; //send date selected to server;
    xhttp.send(JSON.stringify(data));
}

function refreshCalendarRtn() {
    yearSelected = document.getElementById("yearToDisplay")
    shopSelected = document.getElementById("shopToDisplay")
    yearFilter = yearSelected.value
    shopFilter = shopSelected.value
    buildYear(yearFilter);
    populateCalendar(yearFilter,shopFilter)  //,dutyFilter)
    document.getElementById("refreshCalendarBtn").disabled = true;
}


// function resetCalendarFilters() {
//     yearFilter = startUpYear
//     shopFilter = clientLocation
//     // dutyFilter = "BOTH"

//     setupYearFilter(startUpYear)
//     setShopFilter(clientLocation)
//     // setDutyFilter("BOTH")
// }

// ----------------------------------------------------------------
// CALENDAR DEFINITION CODE
// ----------------------------------------------------------------
function buildYear(strYear){
    // Remove current calendar if one exists
    currentCalendar = document.querySelector('#calendar-container')
    currentCalendar.innerHTML = ''

    // Build new calendar
    for(var m=1; m<=12; m++){
        strMonth = m.toString();
        if (strMonth.length == 1)
            strMonth = '0' + strMonth
        buildMonth(strYear,m)       
    }
    // Mark Sundays with 'closed color'
    markSundays()
}


function markSundays() {
    //console.log('Marking Sundays ...')
    yearSelected = document.getElementById("yearToDisplay")
    var myDate = new Date(yearSelected.value.toString(),00,01);
    for (var d=1;d<=365;d++) {
        dayOfWeek = myDate.getDay()
        if (dayOfWeek == 0) {
            var sunday = 'x' + formatDate(myDate) // Append yyyymmdd to 'x'
            document.getElementById(sunday).style.backgroundColor = colors.bg_Sunday;
            document.getElementById(sunday).style.color = colors.fg_Sunday;
        }
        
        // Increment the date
        myDate.setDate(myDate.getDate() + 1);
    }
}

function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();
    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;
    yyyymmdd = year + month + day
    return yyyymmdd;
}


function get_calendar(day_no, days,month,year,monthYearHdg){
    var table = document.createElement('table');
    // temp line
    // var thead = document.createElement('thead');
    // thead.innerHTML = monthYearHdg
    // table.appendChild(thead)
    var tr = document.createElement('tr');
    
    //row for the day letters
    for(var c=0; c<=6; c++){
        var td = document.createElement('td');
        td.innerHTML = "SMTWTFS"[c];
        tr.appendChild(td);
    }
    table.appendChild(tr);
    
    //create 2nd row - inactive, blank, days
    tr = document.createElement('tr');
    var c;
    for(c=0; c<=6; c++){
        if(c == day_no){
            break;
        }
        var td = document.createElement('td');
        td.innerHTML = "";
        tr.appendChild(td);
    }
    //create 2nd row - active, numbered, days
    var count = 1;
    for(; c<=6; c++){
        var td = document.createElement('td');
        td.innerHTML = count;
        // Append class='dayCell' id='xyyyymmdd'
        td.classList.add("dayCell(this.id)");
        strDay = count.toString();
        if (strDay.length == 1)
            strDay = "0" + strDay
        strMonth = month.toString();
        if (strMonth.length == 1)
            strMonth = '0' + strMonth
        // console.log('1. strMonth = ' + strMonth)
        strYear = year.toString()
        newID = 'x' + strYear + strMonth + strDay
        // console.log('1. newID = ' + newID)
        td.setAttribute("id", newID);
        // set onclick =
        td.onclick = function() {
            dayClicked(this.id);
        }
        count++;
        tr.appendChild(td);
    }
    table.appendChild(tr);
    
    //rest of the date rows
    for(var r=3; r<=7; r++){
        tr = document.createElement('tr');
        for(var c=0; c<=6; c++){
            if(count > days){
                table.appendChild(tr);
                return table;
            }
            var td = document.createElement('td');
            td.innerHTML = count;
            // Append class='dayCell' id='xyyyymmdd'
            td.classList.add("dayCell(this.id)");
            strDay = count.toString();
            if (strDay.length == 1)
                strDay = "0" + strDay
            strMonth = month.toString();
            if (strMonth.length == 1)
                strMonth = '0' + strMonth
            strYear = year.toString()
            newID = 'x' + strYear + strMonth + strDay
            td.setAttribute("id", newID);
            td.onclick = function() {
                dayClicked(this.id);
            };
            count++;
            tr.appendChild(td);
        }
        table.appendChild(tr);
    }
	return table;
}

function buildMonth(yr,mnth) {
    strMnth = mnth.toString()
    if (strMnth.length == 1)
        strMnth = '0' + strMnth
    strMDY = yr + '/' + strMnth + '/01' //'2020-01-02'
    var d = new Date(strMDY)
    var month_name = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    var month = d.getMonth();   //0-11
    var year = d.getFullYear(); //2014
    var first_date = month_name[month] + " " + 1 + " " + year;
    //September 1 2014
    var tmp = new Date(first_date).toDateString();
    //Mon Sep 01 2014 ...
    var first_day = tmp.substring(0, 3);    //Mon
    var day_name = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    var day_no = day_name.indexOf(first_day);   //1
    var days = new Date(year, month+1, 0).getDate();    //30
    var monthAbbr = month_name[month].substring(0,3).toLowerCase()
    var monthYearPrefix = monthAbbr + year.toString()

    //Tue Sep 30 2014 ...
    // create div for xxx-calendar-month-year
    // JAN-calendar-month-year, FEB-calendar-month-year, etc
    var monthYearHdgID = monthYearPrefix + '-calendar-month-year';
    var newMonthYearHdgDIV = document.createElement('div');
    newMonthYearHdgDIV.id = monthYearHdgID;
    newMonthYearHdgDIV.classList.add('calendarMonth')
    newMonthYearHdgDIV.innerHTML = "<div class='monthYearHdg'>" + month_name[month]+" "+year + "</div>";
    monthYearHdg = month_name[month]+" "+year;
    document.getElementById('calendar-container').appendChild(newMonthYearHdgDIV);
    var calendar = get_calendar(day_no, days,month+1,year,monthYearHdg);
    document.getElementById(monthYearHdgID).appendChild(calendar);
}

// POPULATE CALENDAR
function populateCalendar(yearValue,shopValue) { //,dutyValue) {
    // send POST request with year, shop, and duty
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/index"); 
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.onreadystatechange = function() {
        //console.log('onreadystatechange')
        if (this.readyState == 4 && this.status == 200) {
            sched = JSON.parse(this.response)
            shopData = sched
            for ( var y=0; y<367; y++ ) {
                DateScheduled = sched[y][0]
                status = sched[y][1]
                dayNumber = sched[y][2]
                SM_ASGND = sched[y][3]
                TC_ASGND = sched[y][4]
                SM_AM_REQD1 = sched[y][5]
                SM_PM_REQD1 = sched[y][6]
                TC_AM_REQD1 = sched[y][7]
                TC_PM_REQD1 = sched[y][8]
                SM_AM_REQD2 = sched[y][9]
                SM_PM_REQD2 = sched[y][10]
                TC_AM_REQD2 = sched[y][11]
                TC_PM_REQD2 = sched[y][12]

                // BUILD DAY ID
                var dayID = "x" + DateScheduled
                if (shopValue == 'RA'){
                    SM_TO_FILL = (SM_AM_REQD1 + SM_PM_REQD1) - SM_ASGND
                    TC_TO_FILL = (TC_AM_REQD1 + TC_PM_REQD1) - TC_ASGND 
                }
                else if (shopValue == 'BW'){
                        SM_TO_FILL = (SM_AM_REQD2 + SM_PM_REQD2) - SM_ASGND
                        TC_TO_FILL = (TC_AM_REQD2 + TC_PM_REQD2) - TC_ASGND 
                    }
                    else {
                        SM_TO_FILL = (SM_AM_REQD1 + SM_PM_REQD1 + SM_AM_REQD2 + SM_PM_REQD2) - SM_ASGND
                        TC_TO_FILL = (TC_AM_REQD1 + TC_PM_REQD1 + TC_AM_REQD2 + TC_PM_REQD2) - TC_ASGND
                    }

                currentDate = new Date
                if (DateScheduled != 0) {
                    mo=DateScheduled.slice(4,6)
                    da=DateScheduled.slice(6,8)
                    yr=DateScheduled.slice(0,4)
                    mmddyy=mo + '-' + da + '-' + yr
                    yymmdd=(yr + '/' + mo + '/' + da)
                    dateSched = new Date(yymmdd)
                }
                else {
                    dateSched = currentDate
                }                

                switch (true) {
                    case DateScheduled == 0:
                        break 

                    case (status == 'CLOSED'):
                        document.getElementById(dayID).style.backgroundColor = colors.bg_Closed;
                        document.getElementById(dayID).style.color = colors.fg_Closed;
                        break
                    
                    case (dateSched < currentDate):
                        document.getElementById(dayID).style.backgroundColor = colors.bg_PastDate;
                        document.getElementById(dayID).style.color = colors.fg_Past;
                        break

                    // CHECK FOR ASSIGNMENTS COMPLETED
                    case (SM_TO_FILL == 0  && TC_TO_FILL == 0):
                        document.getElementById(dayID).style.backgroundColor = colors.bg_Filled;
                        document.getElementById(dayID).style.color = colors.fg_Filled;
                        break

                    // ONLY SHOP MONITORS NEEDED?
                    case (SM_TO_FILL > 0 && TC_TO_FILL == 0):
                        document.getElementById(dayID).style.backgroundColor = colors.bg_NeedSM;
                        document.getElementById(dayID).style.color = colors.fg_NeedSM;
                        break

                    // ONLY TOOL CRIB NEEDED?
                    case (TC_TO_FILL > 0 && SM_TO_FILL == 0 ):
                        document.getElementById(dayID).style.backgroundColor = colors.bg_NeedTC;
                        document.getElementById(dayID).style.color = colors.fg_NeedTC;      
                        break

                    // BOTH SHOP MONITORS AND TOOL CRIB ARE NEEDED?
                    case (SM_TO_FILL > 0 && TC_TO_FILL > 0):
                        document.getElementById(dayID).style.backgroundColor = colors.bg_NeedBoth;
                        document.getElementById(dayID).style.color = colors.fg_NeedBoth;    
                        break

                    // DO WE HAVE MORE SHOP MONITORS ASSIGNED THAN ARE REQUIRED?    
                    case (SM_TO_FILL < 0 ):
                        document.getElementById(dayID).style.backgroundColor = colors.bg_ToManySM;
                        document.getElementById(dayID).style.color = colors.fg_ToManySM;    
                        break

                    // DO WE HAVE MORE TOOL CRIB MONITORS ASSIGNED THAN ARE REQUIRED?    
                    case (TC_TO_FILL < 0 ):
                        document.getElementById(dayID).style.backgroundColor = colors.bg_ToManyTC;
                        document.getElementById(dayID).style.color = colors.fg_ToManyTC;    
                        break
                    // ERROR?
                    default:
                        alert("Error: " + dayID + ' ' + SM_TO_FILL.toString() + ' ' + TC_TO_FILL.toString())
                
                }  // END OF SWITCH
            }  // END FOR LOOP
        }   // END IF READYSTATE ...
    }   // END xhttp FUNCTION
    var data = {year:yearValue,shop: shopValue}; //,duty: dutyValue};
    xhttp.send(JSON.stringify(data)); 
}

// function populateNameList() {
//     console.log('{{nameList}}')
//     var nameLst = '{{nameList | tojson}}';

//     //var nameLst = {{ nameList | safe }};
//     console.log(nameLst)
//     nameArray = JSON.parse('{{nameList}}')
//     for ( var i=0; i < nameArray.length -1; i++ ) {
//         alert(nameArray(i))
//     }
// }


 // SEARCH FOR A MATCHING NAME
  $(document).on('keyup','#myInput', function (e) {
    // Declare variables
    var input, filter, i, txtValue;
    input = document.getElementById("myInput");
    filter = input.value.toUpperCase();
    // select = document.getElementsByClassName("selectNames")
    
    optionArray = select.getElementsByClassName("optName")
    
    // Loop through all option rows, and hide those who don't match the search query
    for (i = 0; i < optionArray.length; i++) {
        txtValue = option(i).textContent
    //   option = option[i].getElementsByTagName("td")[0];
    //   if (td) {
        // txtValue = td.textContent || td.innerText;
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
          optionArray[i].style.display = "";
        } else {
          optionArray[i].style.display = "none";
        }
      }
  })

// DEFINE MODAL EVENT LISTENERS
$('#settingsModal').on('show.bs.modal', function () {  
    // Set modal form year to current setting
    if (!localStorage.getItem('startUpYear')) {
        todaysDate = new Date()
        startUpYr = todaysDate.getFullYear()
    }
    else {
        startUpYr = localStorage.getItem('startUpYear')
    }
    document.getElementById('yearDefault').value = startUpYr

    // Set modal form location to current settings
    currentLocation = localStorage.getItem('clientLocation')
    switch(currentLocation){
        case 'RA':
            document.getElementById("shopDefault").selectedIndex = 1; //Option Rolling Acres
            break;
        case 'BW':
            document.getElementById("shopDefault").selectedIndex = 2; //Option Rolling Acres
            break;
        default:
            document.getElementById("shopDefault").selectedIndex = 0; //Option 'Select a Shop'
    }
})


$('#settingsModal').on('hide.bs.modal', function () {  
    var newLocation = $("#shopDefault").val();    
    localStorage.setItem('clientLocation',newLocation)
    setShopFilter(newLocation)
    var newYear = $('#yearDefault').val();
    if (isNaN(newYear)) {
        todaysDate= new date();
        newYear = todaysDate.getFullYear()
    }
    setStartUpYear(newYear)
    setupYearFilter(newYear)
    
    refreshCalendarRtn()
})

// Assign the modal button and form to variables
var modal = document.getElementById("settingsModalID")
//var modalBtn = document.getElementById("settingsModalBtn")

// When the user clicks on the X symbol or 'CLOSE', close the modal form
closeClass = document.getElementsByClassName("closeModal")
closeClass.onclick=function() {
    modal.style.display="none"
}

// When the user clics anywhere outside of the modal, close it
window.onclick = function(event) {
    if (event.target == modal) {
        this.modal.style.display = "none"
    }
}

function buildDayTable(scheduleNumber, shopNumberToDisplay,sched,yyyymmdd,dayNumber) {
    
    // if swap-in-progress ... check for day2
    cnt = sched[0].length + 1
    
    // INSERT DATE INTO APPROPRIATE SCHEDULE HEADING
    if (scheduleNumber == 1) {
        //document.getElementById('day1Number').innerHTML = shopNames[shopNumberToDisplay-1]
        document.getElementById('day1Date').innerHTML = sched[0][1]
        day1Title = "Monitors at " + shopNames[shopNumberToDisplay-1]
        document.getElementById('day1Location').innerHTML = day1Title
        // STORE DATE SCHEDULED IN yyyymmdd FORMAT IN A HIDDEN INPUT ELEMENT
        document.getElementById('day1yyyymmdd').value = yyyymmdd
        // STORE SHOP LOCATION AS A NUMBER IN A HIDDEN INPUT ELEMENT
        document.getElementById('day1shopNumber').value = shopNumberToDisplay
        //  SET day1Detail to detailParent
        detailParent = document.getElementById('day1Detail')
        //  GET staffing requirements for shop 1
        console.log('dayNumber=' + dayNumber.toString())
        console.log('shopData=' + shopData[dayNumber][5])
        SM_AM_REQD = shopData[dayNumber][5]
        SM_PM_REQD = shopData[dayNumber][6]
        TC_AM_REQD = shopData[dayNumber][7]
        TC_PM_REQD = shopData[dayNumber][8]
    }
    else if (scheduleNumber == 2) {
        document.getElementById('day2Date').innerHTML = sched[1][1] 
        day2Title = "Monitors at " + shopNames[shopNumberToDisplay-1]
        document.getElementById('day2Location').innerHTML = day2Title
        // STORE DATE SCHEDULED IN yyyymmdd FORMAT IN A HIDDEN INPUT ELEMENT
        document.getElementById('day2yyyymmdd').value = yyyymmdd
        // STORE SHOP LOCATION AS A NUMBER IN A HIDDEN INPUT ELEMENT
        document.getElementById('day2shopNumber').value = shopNumberToDisplay
        //  SET day2Detail to detailParent
        detailParent = document.getElementById('day2Detail')
        //  GET staffing requirements for shop 2
        SM_AM_REQD = shopData[dayNumber][9]
        SM_PM_REQD = shopData[dayNumber][10]
        TC_AM_REQD = shopData[dayNumber][11]
        TC_PM_REQD = shopData[dayNumber][12]
        //alert(SM_AM_REQD)
    }
    // REMOVE CURRENT DAY ASSIGNMENTS FOR SELECTED SCHEDULE DAY
    while (detailParent.firstChild) {
        detailParent.removeChild(detailParent.lastChild);
    }

    //  AM SHOP MONITORS - LIST THOSE ASSIGNED ----------------------------------------------------
    numberLoaded = 0
    for ( var y=0; y<cnt; y++ ) {
        ShopNumber = sched[y][0]
        if (ShopNumber != shopNumberToDisplay) {
            continue
        }
        DateScheduled = sched[y][1]
        Shift = sched[y][2]
        Duty = sched[y][3]
        Name = sched[y][4]
        VillageID = sched[y][5]
        RecordID = sched[y][6]
        dayNumber = sched[y][7]
        
        if (Shift == 'AM' && Duty == 'Shop Monitor') {
            createScheduleDetail(scheduleNumber,ShopNumber,DateScheduled,Shift,Duty,Name,VillageID,RecordID,dayNumber)
            numberLoaded += 1
            
        }
    }

    // AM SHOP MONITORS - CREATE RECORDS OF SHIFTS TO FILL

    //  SM_AM_REQD = shopData[dayNumber][5]
    SM_AM_TO_FILL = SM_AM_REQD - numberLoaded
    for ( var y=0; y<SM_AM_TO_FILL; y++ ) {
        createScheduleDetail(scheduleNumber,shopNumberToDisplay,DateScheduled,'AM','Shop Monitor',' ',' ',0,dayNumber)
    }
    //  END OF SHOP MONITORS AM

    //  AM TOOL CRIB - LIST THOSE ASSIGNED ----------------------------------------------------
    numberLoaded = 0
    for ( var y=0; y<cnt; y++ ) {
        
        ShopNumber = sched[y][0]
        if (ShopNumber != shopNumberToDisplay) {
            continue
        }
        DateScheduled = sched[y][1]
        Shift = sched[y][2]
        Duty = sched[y][3]
        Name = sched[y][4]
        VillageID = sched[y][5]
        RecordID = sched[y][6]
        dayNumber = sched[y][7]
        console.log('AM Tool Crib ',Name,Shift, Duty)
        if (Shift == 'AM' && Duty == 'Tool Crib') {
            console.log(Name)
            createScheduleDetail(scheduleNumber,ShopNumber,DateScheduled,Shift,Duty,Name,VillageID,RecordID,dayNumber)
            numberLoaded += 1
        }
    }

    // AM TOOL CRIB - CREATE RECORDS OF SHIFTS TO FILL
    //     TC_AM_REQD = shopData[dayNumber][6]
    TC_AM_TO_FILL = TC_AM_REQD - numberLoaded
    for ( var y=0; y<TC_AM_TO_FILL; y++ ) {
        createScheduleDetail(scheduleNumber,shopNumberToDisplay,DateScheduled,'AM','Tool Crib',' ',' ',0,dayNumber)
    }
    // END OF TOOL CRIB AM

    //  PM SHOP MONITORS - LIST THOSE ASSIGNED ----------------------------------------------------
    numberLoaded = 0
    for ( var y=1; y<cnt; y++ ) {
        ShopNumber = sched[y][0]
        if (ShopNumber != shopNumberToDisplay) {
            continue
        }
        DateScheduled = sched[y][1]
        Shift = sched[y][2]
        Duty = sched[y][3]
        Name = sched[y][4]
        VillageID = sched[y][5]
        RecordID = sched[y][6]
        dayNumber = sched[y][7]
        console.log(Shift,Duty,Name)
        if (Shift == 'PM' && Duty == 'Shop Monitor') {
            createScheduleDetail(scheduleNumber,ShopNumber,DateScheduled,Shift,Duty,Name,VillageID,RecordID,dayNumber)
            numberLoaded += 1
        }
    }

    // PM SHOP MONITORS - CREATE RECORDS OF SHIFTS TO FILL
    //     SM_PM_REQD = shopData[dayNumber][7]
    SM_PM_TO_FILL = SM_PM_REQD - numberLoaded
    for ( var y=0; y<SM_PM_TO_FILL; y++ ) {
        createScheduleDetail(scheduleNumber,shopNumberToDisplay,DateScheduled,'PM','Shop Monitor',' ',' ',0,dayNumber)
    }
    //  END OF SHOP MONITORS PM

    //  PM TOOL CRIB - LIST THOSE ASSIGNED ----------------------------------------------------
    numberLoaded = 0
    for ( var y=1; y<cnt; y++ ) {
        ShopNumber = sched[y][0]
        if (ShopNumber != shopNumberToDisplay) {
            continue
        }
        DateScheduled = sched[y][1]
        Shift = sched[y][2]
        Duty = sched[y][3]
        Name = sched[y][4]
        VillageID = sched[y][5]
        RecordID = sched[y][6]
        dayNumber = sched[y][7]

        if (Shift == 'PM' && Duty == 'Tool Crib') {
            createScheduleDetail(scheduleNumber,ShopNumber,DateScheduled,Shift,Duty,Name,VillageID,RecordID,dayNumber)
            numberLoaded += 1
        }
    }

    // PM TOOL CRIB - CREATE RECORDS OF SHIFTS TO FILL
    
    //      TC_PM_REQD = shopData[dayNumber][8]
    TC_PM_TO_FILL = TC_PM_REQD - numberLoaded
    for ( var y=0; y<TC_PM_TO_FILL; y++ ) {
        createScheduleDetail(scheduleNumber,shopNumberToDisplay,DateScheduled,'PM','Tool Crib',' ',' ',0,dayNumber)
    }
    // END OF TOOL CRIB PM
    
}

function createScheduleDetail (scheduleNumber,ShopNumber,DateScheduled,Shift,Duty,Name,VillageID,RecordID,dayNumber) {
    //  .........  put sample finished HTML here
    //  <div ID='day1row01'> 
    //      <span id='day1row01shift'>AM</span>
    //      <span id='day1row01location'>Rolling Acres</span>
    //      <input id='day1row01name'>Smith, John</input>

    
    // DETERMINE HOW MANY CHILD RECORDS EXIST
    
    // ESTABLISH EITHER day1Detail or day2Detail as detailParent
    if (scheduleNumber == 1) {
        detailParent = document.getElementById('day1Detail')
        rowCount = detailParent.childElementCount
        rowCount += 1
        if (rowCount < 10) {
            idPrefix = 'day1row0' + rowCount.toString()
        }
        else {
            idPrefix = 'day1row' + rowCount.toString()
        }
    }
    else {
        detailParent = document.getElementById('day2Detail')
        rowCount = detailParent.childElementCount
        rowCount += 1
        if (rowCount < 10) {
            idPrefix = 'day2row0' + rowCount.toString()
        }
        else {
            idPrefix = 'day2row' + rowCount.toString()
        }
    }
    

    //  EACH ELEMENT WILL HAVE A UNIQUE ID CONSISTING OF THE DAY, ROW AND ELEMENT USE
    //  FOR EXAMPLE day1row01shift, day1row01duty, day1row02shift, etc.

    // CREATE CHILD ROWS OF DETAILn (new DIV row)
    var dayDetail = document.createElement("div")
    dayDetail.id=idPrefix
    dayDetail.classList.add('dayDetail') 
    detailParent.appendChild(dayDetail) 

    var spanShift = document.createElement("span")
    spanShift.id=idPrefix + 'shift'
    spanShift.classList.add("shift")
    spanShift.innerHTML = Shift
    dayDetail.appendChild(spanShift)

    var spanDuty = document.createElement("span")
    spanDuty.id=idPrefix + 'duty'
    spanDuty.classList.add("duty")
    spanDuty.innerHTML = Duty
    dayDetail.appendChild(spanDuty)

    var inputName = document.createElement("input")
    inputName.id=idPrefix + 'name'
    inputName.classList.add("nameID")
    inputName.style.border='1px solid black'
    inputName.type="text"
    if (Name != ' ') {
        inputName.value = Name + '  (' + VillageID + ')'
        inputName.onclick = function() {
            assignedShiftClicked(this.id);
        }
    }
    else 
    {
        inputName.value = ' '
        inputName.onclick = function() {
            unAssignedShiftClicked(this.id,scheduleNumber);
        }
    }
    var c = detailParent.childElementCount;
    
    dayDetail.appendChild(inputName)

    var btnDelete = document.createElement("button")
    btnDelete.id=idPrefix + 'delete'
    btnDelete.classList.add("delBtn")
    btnDelete.classList.add("btn")
    btnDelete.classList.add("btn-outline-secondary")
    btnDelete.classList.add("btn-sm")

    //btnDelete.classList.add("fa, fa-trash")
    btnDelete.innerHTML = "DEL"
    btnDelete.style.width='40px'
    btnDelete.style.marginLeft='40px'
    btnDelete.onclick = function() {
        delAssignment(this.id)
    }
    dayDetail.appendChild(btnDelete)

    var inputRecordID = document.createElement("input")
    inputRecordID.id=idPrefix + 'recordID'
    inputRecordID.classList.add("recordID")
    inputRecordID.type="hidden"
    inputRecordID.value = RecordID
    dayDetail.appendChild(inputRecordID)

}

function memberSelectedRtn() {
    selectedMember = this.value
    document.getElementById('memberNameHdg').innerHTML = selectedMember
    lastEight = selectedMember.slice(-8)
    currentMemberID= lastEight.slice(1,7)
    populateMemberSchedule(currentMemberID)
    document.getElementById('selectpicker').value=''
}
  
function populateMemberSchedule(memberID) {
    // Ajax request for last training date and monitor schedule for current year forward
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/getMemberSchedule"); 
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            // PROCESS RESPONSE
            sched = JSON.parse(this.response)
            numberOfElements = sched.length // Array is fixed at 100
            
            // IDENTIFY MEMBER SCHEDULE DETAIL AS PARENT NODE
            memberScheduleDetailID = document.getElementById('memberScheduleDetailID')

            // REMOVE CHILD RECORDS OF memberScheduleDetailID
            while (memberScheduleDetailID.firstChild) {
                memberScheduleDetailID.removeChild(memberScheduleDetailID.lastChild);
            }
   
            // STEP THROUGH ARRAY PASSED IN FROM SERVER AND BUILD MEMBERS SCHEDULE
            // IF THE ASSIGNMENT DATE IS PRIOR TO TODAY, MAKE FONT GREEN, OTHERWISE RED
            for ( var y=0; y<numberOfElements; y++ ) {
                // IS THE ARRAY EMPTY?
                //console.log('y=' + y.toString)
                if (sched[y][0] == 0) {
                    break 
                }
                // IF RECORD 1 OF THE ARRAY, INSERT DISPLAY NAME AND TRAINING DATE
                if (y == 1) {
                    document.getElementById('memberNameHdg').innerHTML = displayName
                    document.getElementById('lastMonitorTraining').value = trainingDate
                }

                // DOES THE MEMBER HAVE ANY ASSIGNMENTS?
                if (sched[y][4] == 0) {
                    return
                }
                // BUILD MEMBERS SCHEDULE
                memberIDfromArray = sched[y][0]
                shopNumber = sched[y][1]
                displayName = sched[y][2]
                trainingDate = sched[y][3]
                dateScheduled = sched[y][4]
                dateScheduledFormatted = sched[y][5]
                shift = sched[y][6]
                duty = sched[y][7]
                noShow = sched[y][8]
                locationName = shopNames[shopNumber - 1]
                
                // CREATE NEW day1shift AS CHILD OF memberSchedule (new row)
                var mbrRowDiv = document.createElement("div")
                //day1shift.id='day1shift'
                mbrRowDiv.classList.add('memberScheduleRow')  
                
                // PARENT NODE IS memberScheduleDetailID

                //  BUILD VALID DATE BY ASSEMBLING COMPONENTS FROM dateScheduled
                if (dateScheduled != 0) {
                    mo=dateScheduled.slice(4,6)
                    da=dateScheduled.slice(6,8)
                    yr=dateScheduled.slice(0,4)
                    mmddyy=mo + '-' + da + '-' + yr
                    yymmdd=(yr + '/' + mo + '/' + da)
                    dateSched = new Date(yymmdd)
                }
                todaysDate = new Date()
                if (dateSched > todaysDate) {
                    mbrRowDiv.style.color="Red"   
                }
                else {
                mbrRowDiv.style.color="Green"
                }
                memberScheduleDetailID.appendChild(mbrRowDiv)

                //  THE FOLLOWING ELEMENTS ARE TO BE CHILDREN OF mbrRowDiv NOT memberSheduleDetailID
                var spanLocation = document.createElement("span")
                spanLocation.classList.add("memberScheduleCol")
                spanLocation.innerHTML = locationName
                mbrRowDiv.appendChild(spanLocation)
            
                var spanDateScheduled = document.createElement("span")
                spanDateScheduled.classList.add("memberScheduleCol")
                spanDateScheduled.innerHTML = dateScheduledFormatted
                mbrRowDiv.appendChild(spanDateScheduled)
            
                
                var spanShift = document.createElement("span")
                spanShift.classList.add("memberScheduleCol")
                spanShift.innerHTML = shift
                mbrRowDiv.appendChild(spanShift)

                var spanDuty = document.createElement("span")
                spanDuty.classList.add("memberScheduleCol")
                spanDuty.innerHTML = duty
                mbrRowDiv.appendChild(spanDuty)

                var spanNoShow = document.createElement("span")
                spanNoShow.classList.add("memberScheduleCol")
                spanNoShow.innerHTML = noShow
                mbrRowDiv.appendChild(spanNoShow)
            }  // END OF FOR LOOP  
        }  // END OF READY STATE TEST
    }   // END IF READYSTATE ...
    var data = {memberID:memberID}; //send memberID selected to server;
    xhttp.send(JSON.stringify(data)); 
}   // END xhttp FUNCTION



// USER CLICKED ON A BLANK, IE, UNASSIGNED SHIFT SLOT
// ADD A RECORD TO THE TABLE tblMonitor_Schedule

function unAssignedShiftClicked(id,scheduleNumber) {
    // HAS A MEMBER BEEN SELECTED?
    if (currentMemberID == '') {
        alert('You must have a member selected.')
        return
    }
    idPrefix = id.slice(0,9)
    
    // GET THE SHIFT AND DUTY FROM PREVIOUS SIBLING ELEMENTS IN THE ROW
    dutyID = idPrefix + 'duty'
    Duty = document.getElementById(dutyID).innerHTML
    //dutyElement=document.getElementById(id).previousSibling

    shiftID = idPrefix + 'shift'
    Shift = document.getElementById(shiftID).innerHTML

    // GET THE SHOPNUMBER, LOCATION, FROM day1header ....
    if (scheduleNumber == 1) {
        shopNumber=document.getElementById('day1shopNumber').value
        dateScheduled=document.getElementById('day1yyyymmdd').value
    }
    else
    {
        shopNumber=document.getElementById('day2shopNumber').value
        dateScheduled=document.getElementById('day2yyyymmdd').value
    }

    addAssignment(currentMemberID,dateScheduled,Shift,shopNumber,Duty)
}

// USER CLICKED ON A NAME DISPLAYED IN EITHER THE SCHEDULE 1 OR 2 AREA
// SAVE INFORMATION FOR A SWAP?
function assignedShiftClicked(nameValue) {
    alert('An ASSIGNED shift was clicked - ' + this.value + nameValue)
}

// DELETE AN AN ASSIGNMENT BY RECORD ID
function delAssignment(id) {
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/deleteMonitorAssignment"); 
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            // PROCESS RESPONSE
            msg = this.response
            alert(msg)
        }  // END OF READY STATE TEST
    }  // END OF ONREADYSTATECHANGE
    
    // SEND WEEK#, STAFF ID, MEMBER ID, DATE SCHEDULED, AMPM, DUTY, AND RECORD ID
    idPrefix = id.slice(0,9)
    recordID = document.getElementById(idPrefix+"recordID").value
    var data = {recordID:recordID,staffID:staffID};
    xhttp.send(JSON.stringify(data)); 
}   // END xhttp FUNCTION


// ADD A NEW ASSIGNMENT 
function addAssignment(memberID,DateScheduled,Shift,shopNumbner,Duty) {
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/addMonitorAssignment"); 
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            // PROCESS RESPONSE
            msg = this.response
            alert(msg)
        }  // END OF READY STATE TEST
    }  // END OF ONREADYSTATECHANGE

    // SEND PARAMETERS FOR ADDING AN ASSIGNMENT
    schedDate = document.getElementById('day1yyyymmdd').value
    var data = {memberID:memberID,schedDate:schedDate,Shift:Shift,shopNumber:shopNumber,Duty:Duty}
xhttp.send(JSON.stringify(data)); 
}   // END xhttp FUNCTION



function clearDay1() {
    while (day1Detail.firstChild) {
        day1Detail.removeChild(day1Detail.lastChild);
    }
    day1Date = document.getElementById('day1Date')
    day1Date.innerHTML=''
    document.getElementById('day1Location').innerHTML=''
}

function clearDay2() {
    while (day2Detail.firstChild) {
        day2Detail.removeChild(day2Detail.lastChild);
    }
    day2Date = document.getElementById('day2Date')
    day2Date.innerHTML=''
    document.getElementById('day2Location').innerHTML=''
}

function printDay1() {
    alert('Routine not yet implemented.')
}


function printDay2() {
    alert('Routine not yet implemented.')
}