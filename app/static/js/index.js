//$(document).ready (function() {
// DEFINE VARIABLES
// color constants

const colors = {
    bg_NeedSM:  "#0000FF",  // Blue
    fg_NeedSM:  "#FFFFFF",  // White 
    bg_NeedTC:  "#00FF00",  // Green
    fg_NeedTC:  "#000000",  // Black (#000000)
    bg_NeedBoth:"#FF0000",  // Red (#FF0000)
    fg_NeedBoth:"#FFFFFF",  // White (#FFFFFF)
    bg_Filled:  "#FFFFFF",  // White (#FFFFFF)
    fg_Filled:  "#000000",  // Black (#000000)
    bg_Sunday:  "#2E86C1",  // Aqua
    fg_Sunday:  "#FFFFFF",  // White (#FFFFFF)
    bg_Closed:  "#2E86C1",  // Aqua
    fg_Closed:  "#FFFFFF",  // White (#FFFFFF)
    bg_ToManySM:"#FAFE02",  // Yellow
    fg_ToManySM:"#000000",  // Black
    bg_ToManyTC:"#FE4E02",  // Orange
    fg_ToManyTC:"#000000",  // Black
    bg_PastDate:"#cccccc",  // Light grey
    fg_PastDate:"#FFFFFF"   // White (#FFFFFF)
};

// Declare global variables)
var staffID = ''
var currentMemberID = ''
var currentMemberName = ''  // This var is used when refreshing the page.
var startUpYear = ''
var yearFilter = ''
var clientLocation = ''  // Client location is where this app is being used; if is the startup point for shop filter
var shopFilter = ''     // Shop filter, shop location, shop number refers to the shop data being manipulated

var todaysDate = new Date();
var currentYear = todaysDate.getFullYear()
//var firstTimeThrough = localStorage.getItem('firstTimeSwitch')
var shopNames = ['Rolling Acres', 'Brownwood']
var shopData = []

var confirmed = '' 
var swapInProgress = ''
var swap1ID = '' // Save the day clicked id - x20200621 aka idPrefix
var swap2ID = ''
var swapAsgmnt1ID = ''  // Save the row clicked id - day1row03, aka idPrefix
var swapAsgmnt2ID = ''
var deleteAsgmntDt = ''
var curShopNumber = ''

// GET STAFF ID FROM URL IF AVAILABLE, OTHERWISE FROM LOCALSTORAGE, NEXT FROM PROMPT
const params = new URLSearchParams(window.location.search)
var pathArray = window.location.pathname.split('/');
if (pathArray.length = 4) {
    if (pathArray[3] != null & pathArray[3] != '') {
        staffID = pathArray[3]
        localStorage.setItem('staffID',staffID)
    }
    else {
        staffID = ''
    }
}

if (staffID == '' | staffID == null) {
    // CHECK LOCAL STORAGE FOR STAFF ID
    if (!localStorage.getItem('staffID')) {
        staffID = prompt('Staff ID - ','xxxxxx')
        localStorage.setItem('staffID',staffID)
    }
    else {
        staffID = localStorage.getItem('staffID')
    }
}

// IS THERE A STARTUP YEAR STORED IN LOCALSTORAGE, IF NOT USE CURRENT YEAR
// START UP YEAR IS THE MIDDLE VALUE OF THE THREE YEARS LISTED IN THE DROPDOWN LIST
startUpYear = localStorage.getItem('startUpYear')
if (!localStorage.getItem('startUpYear')) {
    startUpYear = currentYear
    localStorage.setItem('startUpYear',startUpYear)
}
else {
    startUpYear = localStorage.getItem('startUpYear')
}
setStartUpYear(startUpYear)
// SET VALUES FOR YEAR DROP DOWN LIST
setupYearFilter(startUpYear)

// WHICH SHOP LOCATION? IS THERE A LOCATION STORED IN LOCALSTORAGE?
if (!localStorage.getItem('clientLocation')) {
    clientLocation = prompt("Location - 'RA' or 'BW",'xx')
    clientLocation = clientLocation.toUpperCase()
    if (clientLocation != 'RA' & clientLocation != 'BW'){
        clientLocation = 'BOTH'
    }
    localStorage.setItem('clientLocation',clientLocation)
}
else {
    clientLocation = localStorage.getItem('clientLocation')
}
// SET UP SHOP FILTER LIST
setShopFilter(clientLocation)

// DEFINE EVENT LISTENERS
document.getElementById("yearToDisplay").addEventListener("change", yearChanged);
document.getElementById("shopToDisplay").addEventListener("change", shopChanged);
document.getElementById("refreshCalendarBtn").addEventListener("click",refreshCalendarRtn)
document.getElementById("selectpicker").addEventListener("change",memberSelectedRtn)
document.getElementById("saveReasonID").addEventListener("click",closeReasonModal)
document.getElementById("memberModalID").addEventListener("change",memberModalChange)
document.getElementById("saveMemberModalID").addEventListener("click",memberModalSave)

//$('#reasonModalID').on('hidden.bs.modal',closeReasonModal)
document.querySelector('.closeModalNotes').addEventListener('click', closeNotesRtn)
$('#reasonModalID').on('shown.bs.modal', function () {
    $('#reasonDescID').trigger('focus')
  })
window.addEventListener('unload', function(event) {
    localStorage.removeItem('currentMemberID')
    //localStorage.removeItem('firstTimeSwitch');
});


// FIRST TIME ROUTINES
// IS THIS THE FIRST TIME ON THIS PAGE?
// firstTimeThrough = localStorage.getItem('firstTimeSwitch')
//if (firstTimeThrough == null) {
//localStorage.setItem('firstTimeSwitch',false)

// HIDE CONFIRMATION MODAL
$('#confirmAction').modal('hide')

// HIDE DAY 1 AND 2 BUTTONS
document.getElementById('day1Notes').style.display='none'
document.getElementById('day1Print').style.display='none'
document.getElementById('day1Clear').style.display='none'
document.getElementById('day2Notes').style.display='none'
document.getElementById('day2Print').style.display='none'
document.getElementById('day2Clear').style.display='none'

// SET 'CANCEL SWAP' AND 'MAKE SWAP' BUTTONS TO DISABLED
document.getElementById('cancelSwap').disabled = true
document.getElementById('makeSwap').disabled = true
swapInProgress = false
swap1ID = ''
swap2ID = ''

//  SET FILTER VALUES BASED ON localStorage values
// Set the value for shop location filter
// Set shop dropdown box default value
setShopFilter(shopFilter)

// Disable the 'Refresh Calendar' button
document.getElementById("refreshCalendarBtn").disabled = true;

// Build initial calendar based on default settings OR get settings from cookies
buildYear(yearFilter); 

// POPULATE CALENDAR USING STARTUP PARAMETERS
populateCalendar(yearFilter,shopFilter) 


// IF RETURNING TO THIS PAGE ...

// IS THERE A CURRENT MEMBER?
if (pathArray.length >= 3) {
    if (pathArray[2] != null & pathArray[2] != '') {
        currentMemberID = pathArray[2]
        localStorage.setItem('currentMemberID',currentMemberID)
    }
    else {
        currentMemberID = ''
    }
}

// IS THE PAGE BEING REFRESHED? TAKE USER BACK TO DATA THEY WERE WORKING WITH.
if (currentMemberID == '' | currentMemberID == null) {
    currentMemberID = localStorage.getItem('currentMemberID')
    //  CHECK FOR A SAVED NAME
    currentMemberName = localStorage.getItem('currentMemberName')
    if (currentMemberName != null) {
        document.getElementById('memberNameHdg').innerHTML = currentMemberName
    }
    // DISPLAY CURRENT MEMBER'S SCHEDULE
    populateMemberSchedule(currentMemberID)
}

clicked_id = localStorage.getItem('clicked_id')
console.log('test for localStorage clicked_id - ' + clicked_id)
if (clicked_id) {
    dayClicked(clicked_id)
}

//  console.log('end of page loading ...')


// ------------------------------------------------------------------------------------------------------
// FUNCTIONS    
// ------------------------------------------------------------------------------------------------------

function yearChanged() {
    yearFilter = this.value;
    localStorage.setItem('yearFilter', yearFilter);
    enableRefreshBtn()
    refreshCalendarRtn()
}

function shopChanged() {
    shopFilter = this.value  //document.getElementById('shop').value
    localStorage.setItem('shopFilter',this.value)
    enableRefreshBtn()
}


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
            curShopNumber = '1'
            break;
        case 'BW':
            localStorage.setItem('shopFilter','BW')
            document.getElementById("shopToDisplay").selectedIndex = 1; //Option Brownwood
            shopFilter = 'BW'
            curShopNumber = '2'
            break;
        default:
            localStorage.setItem('shopFilter','BOTH')
            document.getElementById("shopToDisplay").selectedIndex = 2; //Option Both
            shopFilter = 'BOTH'
            curShopNumber = 0
    }   
}


function enableRefreshBtn() {
    document.getElementById("refreshCalendarBtn").disabled = false; 
}


function dayClicked(clicked_id) {
    // SAVE clicked_id FOR REFRESHING PAGE ON PAGE LOAD
    console.log('clicked id - '+clicked_id)
    localStorage.setItem('clicked_id',clicked_id)
    // send POST request with year, shop, and duty
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/getDayAssignments"); 
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            // PROCESS RESPONSE FROM REQUEST
            sched = JSON.parse(this.response)
            yyyymmdd = clicked_id.slice(1,9)
            dayNumber = sched[0][7]
            if (dayNumber == 0) {
                dayNumber = dayOfYear(yyyymmdd)
            }
            // CONVERT SHOP ABBREV TO SHOP NUMBER
            if (shopFilter == 'BOTH') {
                shopNumber = 0
            }
            else if (shopFilter == 'RA') {
                shopNumber = 1
                }
                else if (shopFilter == 'BW') {
                    shopNumber = 2
                }
                else {
                    alert ('Error in shopFilter setting.')
                    return
                }

            // IF SWAP IN PROGRESS THEN SET scheduleNumber TO THE FIRST EMPTY DAY
            if (swapInProgress) {
                if (swap1ID == '') {
                    scheduleNumber = 1
                    swap1ID = clicked_id
                    swapAsgmnt1ID = ''
                }
                else if (swap2ID == '') {
                    scheduleNumber = 2
                    swap2ID = clicked_id
                    swapAsgmnt2ID = ''
                }
                else {
                    alert('Only two days may be selected. Press CANCEL SWAP to begin again.')
                    return
                }  
                buildDayTable(scheduleNumber,shopNumber,sched,yyyymmdd,dayNumber,clicked_id)
                return
            }

            // IF THE CURRENT SHOP LOCATION IS SET TO 'BOTH' THEN BUILD A DAY SCHEDULE FOR EACH LOCATION
            if (!swapInProgress) {
                if (shopFilter == 'BOTH') {
                    scheduleNumber = 1
                    buildDayTable(scheduleNumber,1,sched,yyyymmdd,dayNumber,clicked_id)
                    scheduleNumber = 2
                    buildDayTable(scheduleNumber,2,sched,yyyymmdd,dayNumber,clicked_id)
                }
                else if (shopFilter == 'RA'){
                    scheduleNumber = 1
                    buildDayTable(scheduleNumber,1,sched,yyyymmdd,dayNumber,clicked_id)
                }
                else {
                    scheduleNumber = 2
                    buildDayTable(scheduleNumber,2,sched,yyyymmdd,dayNumber,clicked_id)
                }
                return
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
    //cancelSwap()
    // REFRESH MEMBERS SCHEDULE
    
    //console.log('before call to populate - ' + currentMemberID)
    //populateMemberSchedule(currentMemberID)    
    //}
}


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
    yearSelected = document.getElementById("yearToDisplay")
    if (yearSelected == null) {
        return
    } 
    var myDate = new Date(yearSelected.value.toString(),00,01);
    for (var d=1;d<=365;d++) {
        dayOfWeek = myDate.getDay()
        if (dayOfWeek == 0) {
            // Append yyyymmdd to 'x'
            var sunday = 'x' + formatDate(myDate)
            sundayElement = document.getElementById(sunday)
            sundayElement.style.backgroundColor = colors.bg_Sunday;  
            sundayElement.style.color = colors.fg_Sunday;
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
        strYear = year.toString()
        newID = 'x' + strYear + strMonth + strDay
        td.setAttribute("id", newID);
        td.onclick = function() {
            dayClicked(this.id);
        }
        td.oncontextmenu = function() {dayRightClick};
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
            td.oncontextmenu = function() {dayRightClick};
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
    var year = d.getFullYear(); //20yy
    var first_date = month_name[month] + " " + 1 + " " + year;
    //September 1 20yy
    var tmp = new Date(first_date).toDateString();
    //Mon Sep 01 20yy ...
    var first_day = tmp.substring(0, 3);    //Mon
    var day_name = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    var day_no = day_name.indexOf(first_day);   //1
    var days = new Date(year, month+1, 0).getDate();    //30
    var monthAbbr = month_name[month].substring(0,3).toLowerCase()
    var monthYearPrefix = monthAbbr + year.toString()

    //Tue Sep 30 20yy ...
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
    xhttp.open("POST", "/index/"); 
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.onreadystatechange = function() {
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

// When the user clicks on the X symbol or 'CLOSE', close the modal form
closeClass = document.getElementsByClassName("closeModal")
closeClass.onclick=function() {
    modal.style.display="none"
}

// When the user clicks on the X symbol or 'CLOSE', close the modal form
closeClass2 = document.getElementsByClassName("closeModal2")
closeClass2.onclick=function() {
    modal2.style.display="none"
}
// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
    if (event.target == modal) {
        this.modal.style.display = "none"
    }
    // if (event.target == modal2) {
    //     this.modal2.style.display = "none"
    // }
}

function buildDayTable(scheduleNumber, shopNumberToDisplay,sched,yyyymmdd,dayNumber,dayID) {
    // if swap-in-progress ... check for day2
    cnt = sched[0].length + 1
    // REVEAL BUTTONS
    document.getElementById('day1Notes').style.display='block'
    document.getElementById('day1Print').style.display='block'
    document.getElementById('day1Clear').style.display='block'
    

    // INSERT DATE INTO APPROPRIATE SCHEDULE HEADING
    if (scheduleNumber == 1) {
        document.getElementById('day1Date').innerHTML = sched[0][1]
        day1Title = "Monitors at " + shopNames[shopNumberToDisplay-1]
        document.getElementById('day1Location').innerHTML = day1Title
        
        prt = document.getElementById("day1Print")
        address = "/printWeeklyMonitorSchedule?dateScheduled="+ yyyymmdd + "&shopNumber=" + shopNumberToDisplay 
        lnk = "window.location.href='" + address +"'"
        prt.setAttribute("onclick",lnk)

        // STORE DATE SCHEDULED IN yyyymmdd FORMAT IN A HIDDEN INPUT ELEMENT
        document.getElementById('day1yyyymmdd').value = yyyymmdd
        // STORE SHOP LOCATION AS A NUMBER IN A HIDDEN INPUT ELEMENT
        document.getElementById('day1shopNumber').value = shopNumberToDisplay
        //  SET day1Detail to detailParent
        detailParent = document.getElementById('day1Detail')
        //  GET staffing requirements for shop 1
        SM_AM_REQD = shopData[dayNumber][5]
        SM_PM_REQD = shopData[dayNumber][6]
        TC_AM_REQD = shopData[dayNumber][7]
        TC_PM_REQD = shopData[dayNumber][8]
    }
    else if (scheduleNumber == 2) {
        // REVEAL BUTTONS
        document.getElementById('day2Notes').style.display='block'
        document.getElementById('day2Print').style.display='block'
        document.getElementById('day2Clear').style.display='block'

        document.getElementById('day2Date').innerHTML = sched[0][1] 
        day2Title = "Monitors at " + shopNames[shopNumberToDisplay-1]
        document.getElementById('day2Location').innerHTML = day2Title
        
        // STORE DATE SCHEDULED IN yyyymmdd FORMAT IN A HIDDEN INPUT ELEMENT
        document.getElementById('day2yyyymmdd').value = yyyymmdd
        // STORE SHOP LOCATION AS A NUMBER IN A HIDDEN INPUT ELEMENT
        document.getElementById('day2shopNumber').value = shopNumberToDisplay
        //  SET day2Detail to detailParent
        detailParent = document.getElementById('day2Detail')
        //  GET staffing requirements for shop 2
        if (swapInProgress) {
            // REQUIREMENTS FOR ONE LOCATION
            SM_AM_REQD = shopData[dayNumber][5]
            SM_PM_REQD = shopData[dayNumber][6]
            TC_AM_REQD = shopData[dayNumber][7]
            TC_PM_REQD = shopData[dayNumber][8]
        }
        else {
            // REQUIREMENTS FOR COMBINED LOCATIONS
            SM_AM_REQD = shopData[dayNumber][9]
            SM_PM_REQD = shopData[dayNumber][10]
            TC_AM_REQD = shopData[dayNumber][11]
            TC_PM_REQD = shopData[dayNumber][12]
        }
    
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
        MemberID = sched[y][5]
        RecordID = sched[y][6]
        dayNumber = sched[y][7]
        
        if (Shift == 'AM' && Duty == 'Shop Monitor') {
            createScheduleDetail(scheduleNumber,ShopNumber,yyyymmdd,Shift,Duty,Name,MemberID,RecordID,dayNumber)
            numberLoaded += 1
            
        }
    }

    // AM SHOP MONITORS - CREATE RECORDS OF SHIFTS TO FILL

    //  SM_AM_REQD = shopData[dayNumber][5]
    SM_AM_TO_FILL = SM_AM_REQD - numberLoaded
    for ( var y=0; y<SM_AM_TO_FILL; y++ ) {
        createScheduleDetail(scheduleNumber,shopNumberToDisplay,yyyymmdd,'AM','Shop Monitor',' ',' ',0,dayNumber)
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
        MemberID = sched[y][5]
        RecordID = sched[y][6]
        dayNumber = sched[y][7]
        if (Shift == 'AM' && Duty == 'Tool Crib') {
            createScheduleDetail(scheduleNumber,ShopNumber,yyyymmdd,Shift,Duty,Name,MemberID,RecordID,dayNumber)
            numberLoaded += 1
        }
    }

    // AM TOOL CRIB - CREATE RECORDS OF SHIFTS TO FILL
    //     TC_AM_REQD = shopData[dayNumber][6]
    TC_AM_TO_FILL = TC_AM_REQD - numberLoaded
    for ( var y=0; y<TC_AM_TO_FILL; y++ ) {
        createScheduleDetail(scheduleNumber,shopNumberToDisplay,yyyymmdd,'AM','Tool Crib',' ',' ',0,dayNumber)
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
        MemberID = sched[y][5]
        RecordID = sched[y][6]
        dayNumber = sched[y][7]
        if (Shift == 'PM' && Duty == 'Shop Monitor') {
            createScheduleDetail(scheduleNumber,ShopNumber,yyyymmdd,Shift,Duty,Name,MemberID,RecordID,dayNumber)
            numberLoaded += 1
        }
    }

    // PM SHOP MONITORS - CREATE RECORDS OF SHIFTS TO FILL
    //     SM_PM_REQD = shopData[dayNumber][7]
    SM_PM_TO_FILL = SM_PM_REQD - numberLoaded
    for ( var y=0; y<SM_PM_TO_FILL; y++ ) {
        createScheduleDetail(scheduleNumber,shopNumberToDisplay,yyyymmdd,'PM','Shop Monitor',' ',' ',0,dayNumber)
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
        MemberID = sched[y][5]
        RecordID = sched[y][6]
        dayNumber = sched[y][7]

        if (Shift == 'PM' && Duty == 'Tool Crib') {
            createScheduleDetail(scheduleNumber,ShopNumber,yyyymmdd,Shift,Duty,Name,MemberID,RecordID,dayNumber)
            numberLoaded += 1
        }
    }

    // PM TOOL CRIB - CREATE RECORDS OF SHIFTS TO FILL
    
    //      TC_PM_REQD = shopData[dayNumber][8]
    TC_PM_TO_FILL = TC_PM_REQD - numberLoaded
    for ( var y=0; y<TC_PM_TO_FILL; y++ ) {
        createScheduleDetail(scheduleNumber,shopNumberToDisplay,yyyymmdd,'PM','Tool Crib',' ',' ',0,dayNumber)
    }
    // END OF TOOL CRIB PM
    
}

function createScheduleDetail (scheduleNumber,ShopNumber,yyyymmdd,Shift,Duty,Name,MemberID,RecordID,dayNumber) {
    //  ......... Sample finished HTML .....................
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
        inputName.value = Name + '  (' + MemberID + ')'
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

    var inputMemberID = document.createElement("input")
    inputMemberID.id=idPrefix + 'memberID'
    inputMemberID.classList.add("memberID")
    inputMemberID.type="hidden"
    inputMemberID.value = MemberID
    dayDetail.appendChild(inputMemberID)

    var inputSchedDate = document.createElement("input")
    inputSchedDate.id=idPrefix + 'schedDateID'
    inputSchedDate.classList.add("schedDateID")
    inputSchedDate.type="hidden"
    inputSchedDate.value = yyyymmdd
    dayDetail.appendChild(inputSchedDate)

}

function memberSelectedRtn() {
    selectedMember = this.value
    console.log('selectedMember - '+selectedMember)

    document.getElementById('memberNameHdg').innerHTML = selectedMember
    localStorage.setItem('currentMemberName',selectedMember)
    lastEight = selectedMember.slice(-8)
    currentMemberID= lastEight.slice(1,7)
    console.log('currentMemberID in memberSelectedRtn - '+currentMemberID)
    // STORE MEMBER ID  
    localStorage.setItem('currentMemberID',currentMemberID)
    console.log('call populateMemberSchedule using - '+ currentMemberID)
    populateMemberSchedule(currentMemberID)
    document.getElementById('selectpicker').value=''
    document.getElementById('memberBtnsID').style.display='block'
}
  
function populateMemberSchedule(memberID) {
    console.log('9. populateMemberSchedule - '+memberID)
    // Ajax request for last training date and monitor schedule for current year forward
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/getMemberSchedule"); 
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            // PROCESS RESPONSE
            sched = JSON.parse(this.response)
            numberOfElements = sched.length // Array is fixed at 100
            
            // SET LINK FOR PRINT BUTTON
            prt = document.getElementById("printMemberScheduleBtn")
            lnk = "window.location.href='/printMemberSchedule/"+ memberID + "'"
            prt.setAttribute("onclick",lnk)

            // IDENTIFY MEMBER SCHEDULE DETAIL AS PARENT NODE
            console.log('IDENTIFY ...')
            memberScheduleDetailID = document.getElementById('memberScheduleDetailID')

            // REMOVE CHILD RECORDS OF memberScheduleDetailID
            console.log('REMOVE CHILD ...')
            while (memberScheduleDetailID.firstChild) {
                memberScheduleDetailID.removeChild(memberScheduleDetailID.lastChild);
            }
   
            // STEP THROUGH ARRAY PASSED IN FROM SERVER AND BUILD MEMBERS SCHEDULE
            // IF THE ASSIGNMENT DATE IS PRIOR TO TODAY, MAKE FONT GREEN, OTHERWISE RED
            console.log('11. DATA RETURNED FROM SERVER ...')
            for ( var y=0; y<numberOfElements; y++ ) {
                // IS THE ARRAY EMPTY?
                if (sched[y][0] == 0) {
                    console.log(' 12. array is empty')
                    break 
                }

                // DOES THE MEMBER HAVE ANY ASSIGNMENTS?
                console.log('11.5 date scheduled - '+sched[y][4])
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
                
                // IF FIRST RECORD OF THE ARRAY, INSERT TRAINING DATE AND HIDDEN MEMBER ID
                if (y == 0) {
                    document.getElementById('lastMonitorTrainingID').value = trainingDate
                    document.getElementById('memberID').innerHTML = memberIDfromArray 
                }

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

                //  THE FOLLOWING ELEMENTS ARE TO BE CHILDREN OF mbrRowDiv NOT memberScheduleDetailID
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
            return
        }  // END OF READY STATE TEST
    }   // END IF READYSTATE ...
    var data = {memberID:memberID}; //send memberID selected to server;
    console.log('10. SEND DATA TO SERVER ...' + memberID)
    xhttp.send(JSON.stringify(data)); 
}   // END xhttp FUNCTION


function confirmAdd(memberID) {
    answer = confirm("Make this assignment for Village ID " + memberID + "?");
    return answer
}
// USER CLICKED ON A BLANK, IE, UNASSIGNED SHIFT SLOT
// ADD A RECORD TO THE TABLE tblMonitor_Schedule

function unAssignedShiftClicked(nameID,scheduleNumber) {
    selectedName = document.getElementById(nameID)
    //selectedName.style.backgroundColor = 'yellow'
    
    // IS A SWAP IN PROGRESS
    if (swapInProgress) {
        if (swapAsgmnt1ID == '') {
            swapAsgmnt1ID = nameID.slice(0,9)
        }
        else if (swapAsgmnt2ID == '') {
            swapAsgmnt2ID = nameID.slice(0,9)
        }
            else {
                alert('Error in swap unAssignedShiftClicked routine.')
                return 
            }
        return
    }
    

    // IF NOT A SWAP OR MOVE THEN IT MUST BE AN ADD OR DELETE
    // HAS A MEMBER BEEN SELECTED?
    if (currentMemberID == '' && !swapInProgress) {
        alert('You must have a member selected.')
        selectedName.style.backgroundColor = 'white'
        return
    }
 
    idPrefix = nameID.slice(0,9)
    
    // GET THE SHIFT AND DUTY FROM PREVIOUS SIBLING ELEMENTS IN THE ROW
    dutyID = idPrefix + 'duty'
    Duty = document.getElementById(dutyID).innerHTML
    
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

    if (!confirmAdd(currentMemberID)) {
        return
    }
    addAssignment(currentMemberID,dateScheduled,Shift,shopNumber,Duty,nameID)
}


// USER CLICKED ON A NAME DISPLAYED IN EITHER THE SCHEDULE 1 OR 2 AREA
// SAVE INFORMATION FOR A SWAP?
function assignedShiftClicked(nameID) {
    if (swapInProgress && shopFilter == 'BOTH') {
        alert('You need to select a specific location before initiating a swap.')
        document.getElementById('cancelSwap').click()
    }
    // HIGHLIGHT NAME SELECTED
    selectedName = document.getElementById(nameID)
    //selectedName.style.backgroundColor = 'yellow'
    
    if (swapInProgress) {
        if (swapAsgmnt1ID == '') {
            swapAsgmnt1ID = nameID.slice(0,9)
        }
        else if (swapAsgmnt2ID == '') {
            swapAsgmnt2ID = nameID.slice(0,9)
        }
            else {
                alert('Error in swap assignedShiftClicked routine.')
                // REMOVE HIGHLIGHT
                selectedName.style.backgroundColor = 'white'
                return 
            }
    }
    
    else {
        currentSelection = nameID.slice(0,9)
    }
}

function confirmDelete() {
    answer = confirm("Delete this assignment?");
    return answer
}


// DELETE AN ASSIGNMENT BY RECORD ID
function delAssignment(id) {
    idPrefix = id.slice(0,9)
    selectedName = document.getElementById(idPrefix + 'name')
    //selectedName.style.backgroundColor = 'yellow'
    if (!confirmDelete()) {
        selectedName.style.backgroundColor = 'white'
        return
    }
    
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/deleteMonitorAssignment"); 
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            // PROCESS RESPONSE; REFRESH CALENDAR
            // DISPLAY RESPONSE MESSAGE
            // THE RESPONSE WILL BE EITHER AN ERROR MSG OR THE actionDesc: 'DELETE ...'
            msg = this.response
            if (msg.slice(0,4) == 'ERROR') {
                alert(msg)
                return
            }
            // CLEAR THE NAME FIELD
            document.getElementById(idPrefix + 'name').value = ''
            // PROMPT FOR REASON; THE MODAL FORM WILL CALL THE ROUTINE TO LOG THE MONITOR SCHEDULE NOTE
            openReasonModal(msg)
        }  // END OF READY STATE TEST
    }  // END OF ONREADYSTATECHANGE
    
    // SEND WEEK#, STAFF ID, MEMBER ID, DATE SCHEDULED, AMPM, DUTY, AND RECORD ID
    
    recordID = document.getElementById(idPrefix+"recordID").value
    deleteAsgmntDt = document.getElementById(idPrefix+"schedDateID").value
    var data = {recordID:recordID,staffID:staffID};
    xhttp.send(JSON.stringify(data)); 
}   // END xhttp FUNCTION


// ADD A NEW ASSIGNMENT 
function addAssignment(memberID,DateScheduled,Shift,shopNumber,Duty,id) {
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/addMonitorAssignment"); 
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            // PROCESS RESPONSE
            // DISPLAY RESPONSE FROM REQUEST
            msg = this.response
            if (msg.slice(0,5) == 'ERROR') {
                alert(msg)
                return
            }
            // DISPLAY THE NAME
            mbrName  = document.getElementById('memberNameHdg').innerHTML
            document.getElementById(id).value = mbrName

            // CONSTRUCT dayID FOR EXECUTING THE dayClicked FUNCTION
            scheduleNumber=id.slice(3,4)
            if (scheduleNumber = 1) {
                dayYearMoDa = document.getElementById('day1yyyymmdd').value
            }
            else
            {
                dayYearMoDa = document.getElementById('day2yyyymmdd').value
            }
            // REFRESH DAYn LIST
            //alert('execute dayClicked')
            //click_id = 'x' + dayYearMoDay
            //dayClicked(click_id)

            // REFRESH CALENDAR DISPLAY TO REFLECT NEW ASSIGNMENT
            refreshCalendarRtn()
            

            // REFRESH MEMBERS SCHEDULE
            populateMemberSchedule(memberID)
            
            // SHOW SUCCESS MSG
            alert(msg)
        }  // END OF READY STATE TEST
    }  // END OF ONREADYSTATECHANGE

    // SEND PARAMETERS FOR ADDING AN ASSIGNMENT
    schedDate = document.getElementById('day1yyyymmdd').value
    var data = {memberID:memberID,schedDate:DateScheduled,Shift:Shift,shopNumber:shopNumber,Duty:Duty,staffID:staffID}
xhttp.send(JSON.stringify(data)); 
}   // END xhttp FUNCTION



function clearDay1() {
    console.log('clearDay1 rtn')
    while (day1Detail.firstChild) {
        day1Detail.removeChild(day1Detail.lastChild);
    }
    day1Date = document.getElementById('day1Date')
    day1Date.innerHTML=''
    document.getElementById('day1Location').innerHTML=''
    // HIDE BUTTONS
    document.getElementById('day1Notes').style.display='none'
    document.getElementById('day1Print').style.display='none'
    document.getElementById('day1Clear').style.display='none'

    // REMOVE STORED VALUE
    localStorage.removeItem('clicked_id')
}

function clearDay2() {
    while (day2Detail.firstChild) {
        day2Detail.removeChild(day2Detail.lastChild);
    }
    day2Date = document.getElementById('day2Date')
    day2Date.innerHTML=''
    document.getElementById('day2Location').innerHTML=''
    // HIDE BUTTONS
    document.getElementById('day2Notes').style.display='none'
    document.getElementById('day2Print').style.display='none'
    document.getElementById('day2Clear').style.display='none'
}

function printDay(dayNumber) {
    
    // alert('Routine not yet implemented.')

}



var modalConfirm = function(callback){
    $('#confirmYes').on('click', function() {
        callback = true;
        $('#confirmAction').modal(hide);
    })
    $('#confirmNo').on('click', function() {
        callback = false;
        $('#confirmAction').modal(hide);
    })
}

function dayOfYear(dateToConvert) {
    var start = new Date(dateToConvert.getFullYear(),0,0);
    var diff = dateToConvert - start;
    var oneDay = 1000 * 60 * 60 * 24;
    var day = Math.floor(diff/oneDay);
    return day;
}

function initiateSwap() {
    swapInProgress = true
    swap1ID = ''
    swap2ID = ''
    swapAsgmnt1ID = ''
    swapAsgmnt2ID = ''
    btnCancelSwap = document.getElementById('cancelSwap')
    btnCancelSwap.disabled = false;
    btnMakeSwap = document.getElementById('makeSwap')
    btnMakeSwap.disabled = false;
    
    clearDay1()
    clearDay2()


    alert('Select two dates, then select two assignments.')
    document.getElementById('initiateSwap').disabled = true
}

function cancelSwap() {
    swapInProgress = false
    swap1ID = ''
    swap2ID = ''
    swapAsgmnt1ID = ''
    swapAsgmnt2ID = ''
    clearDay1()
    clearDay2()
    document.getElementById('makeSwap').disabled = true
    document.getElementById('cancelSwap').disabled = true
    document.getElementById('initiateSwap').disabled = false
}

function makeSwap() {
    if (swapAsgmnt1ID == '' || swapAsgmnt2ID == '') {
        alert("You must select two assignments.")
        return
    }

    // GET NAMES FOR ASSIGNMENTS
    nameID = swapAsgmnt1ID + 'name'
    name1 = document.getElementById(nameID)
    nameID = swapAsgmnt2ID + 'name'
    name2 = document.getElementById(nameID)
    

    // CHECK FOR TWO BLANK ASSIGNMENTS
    if (name1.value.length < 2 && name2.value.length < 2) {
        alert("At least one time slot must not be unassigned.")
        return 
    }

    // SEND SWAP/MOVE DATA TO SERVER
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/swapMonitorAssignments"); 
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            // PROCESS RESPONSE
            // DISPLAY RESPONSE FROM REQUEST
            // THE RESPONSE WILL BE EITHER AN ERROR MESSAGE OR THE actionDesc, SWAP ... MOVE ...
            msg = this.response
            if (msg.slice(0,5) != 'ERROR') {
                // SWITCH NAMES
                nameSave = name1.value
                name1.value = name2.value
                name2.value = nameSave
                openReasonModal(msg)
            }
            else {
                alert(msg)
                return
            } 
        }  // END OF READY STATE TEST
    }  // END OF ONREADYSTATECHANGE

    // SEND WEEK#, STAFF ID, MEMBER ID, DATE SCHEDULED, AMPM, DUTY, AND RECORD ID
    // ASSIGNMENT 1
    idPrefix1 = swapAsgmnt1ID.slice(0,9)
    recordID1 = document.getElementById(idPrefix1+"recordID").value
    memberID1 = document.getElementById(idPrefix1+"memberID").value
    schedDate1 = document.getElementById(idPrefix1 + "schedDateID").value
    shift1 = document.getElementById(idPrefix1 + 'shift').textContent
    duty1 = document.getElementById(idPrefix1 + 'duty').textContent
    shopNumber1 = document.getElementById('day1shopNumber').value    

    // ASSIGNMENT 2
    idPrefix2 = swapAsgmnt2ID.slice(0,9)
    recordID2 = document.getElementById(idPrefix2+"recordID").value
    memberID2 = document.getElementById(idPrefix2+"memberID").value
    schedDate2 = document.getElementById(idPrefix2 + "schedDateID").value
    shift2 = document.getElementById(idPrefix2 + 'shift').textContent
    duty2 = document.getElementById(idPrefix2 + 'duty').textContent
    shopNumber2 = document.getElementById('day2shopNumber').value    
    if (recordID1 != 0) {
        shopNumber = shopNumber1
    }
    else
    {
        shopNumber = shopNumber2
    }
    var data = {schedDate1:schedDate1,schedDate2:schedDate2,shift1:shift1,shift2:shift2,
    recordID1:recordID1,recordID2:recordID2,memberID1:memberID1,memberID2:memberID2,
    duty1:duty1,duty2:duty2,shopNumber:shopNumber,staffID:staffID};
    xhttp.send(JSON.stringify(data)); 
    // END xhttp FUNCTION

    // END OF MAKE SWAP ROUTINE
}

function openNotesRtn(day) {
    if (day == '1') {
        dateScheduled = document.getElementById('day1yyyymmdd').value
        shopNumber = document.getElementById('day1shopNumber').value    
    }
    else {
        dateScheduled = document.getElementById('day2yyyymmdd').value
        shopNumber = document.getElementById('day2shopNumber').value 
    }
    
    // SEND DAY AND SHOP NUMBER TO SERVER
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/getMonitorWeekNotes"); 
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            
            // RETRIEVE NOTES FOR WEEK PLUS SHOP NAME, COORDINATORS NAME, FORMATTED DATE
            notes = JSON.parse(this.response)
            numberOfElements = notes.length // Array is fixed at 100

            // REMOVE CURRENT NOTES, IF ANY
            detailParent = document.getElementById('modalBodyNotes')
            while (detailParent.firstChild) {
                detailParent.removeChild(detailParent.lastChild);
            }
            
            // IS THE ARRAY EMPTY,I.E., NO NOTES FOR THIS WEEK?
            if (notes[0][0] == 0) {
                alert('No notes available.')
                return 
            }

            // BUILD HEADING 'COORDINATOR NOTES FOR WEEK OF m/d/yyyy (coordinator name)'
            document.getElementById('noteWeek').innerHTML = notes[0][0]
            document.getElementById('noteShopName').innerHTML = notes[0][1]
            document.getElementById('noteCoordinator').innerHTML = notes[0][2]

            // STEP THROUGH ARRAY CREATING ONE ROW PER NOTE
            for ( var y=0; y<numberOfElements; y++ ) {
                
                // NO MORE NOTES?
                if (notes[y][4] == 0) {
                    break
                }
                
                // BUILD NOTE ROW
                // DATE OF CHANGE
                var spanDate = document.createElement("span")
                spanDate.innerHTML = notes[y][3]
                detailParent.appendChild(spanDate)
                
                // NOTE TEXT
                var textContent = document.createElement("textarea")
                textContent.rows=2
                textContent.innerHTML = notes[y][4]
                detailParent.appendChild(textContent)

                // AUTHOR'S INITIALS
                var spanAuthor = document.createElement("span")
                spanAuthor.innerHTML = notes[y][5]
                detailParent.appendChild(spanAuthor)

            }
            // OPEN MODAL NOTE
            document.querySelector('.bg-modal-notes').style.display='flex';
            return 
        }  // END OF READY STATE TEST
    }  // END OF ONREADYSTATECHANGE

    // SEND DATE SCHEDULED AND SHOP NUMBER
    var data = {dateScheduled:dateScheduled,shopNumber:shopNumber};
    xhttp.send(JSON.stringify(data)); 
    // END xhttp FUNCTION
// END OF OPEN NOTES ROUTINE 
}

function closeNotesRtn() {
    document.querySelector('.bg-modal-notes').style.display='none';
    refreshCalendarRtn()
}


function openReasonModal(actionDesc) {
    dt = document.getElementById('day1yyyymmdd').value
    document.getElementById('actionDescID').value = actionDesc
    document.getElementById('reasonDescID').value = ""
    $('#reasonModalID').modal('show')
    document.getElementById('reasonDescID').focus
}

function closeReasonModal() {
    $('#reasonModalID').modal('hide')
    actionDesc = document.getElementById('actionDescID').value
    reasonDesc = document.getElementById('reasonDescID').value
    
    if (reasonDesc == '') {
        alert('Please enter a reason.')
        $('#reasonModalID').modal('show')
        return
    }
    if (reasonDesc.length == 0) {
        alert('Please enter a reason.')
        $('#reasonModalID').modal('show')
        return
    }

    // SEND ACTION AND REASON TO SERVER WITH DATES, STAFFID, AND SHOPNUMBER
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/logMonitorScheduleNote"); 
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            msg = this.response
            if (msg.slice(0,5) == 'ERROR') {
                alert(msg)
                return
            }
            alert(msg)
            refreshCalendarRtn()
        }  // END OF READY STATE RESPONSE
    }  // END OF ONREADYSTATECHANGE

    // CAPTURE DATES NEEDED FOR tblMonitor_Schedule_Notes
    if (actionDesc.slice(0,4) == 'SWAP' || actionDesc.slice(0,4) == 'MOVE') {
        swapDate1 = document.getElementById(swapAsgmnt1ID+'schedDateID').value 
        swapDate2 = document.getElementById(swapAsgmnt2ID+'schedDateID').value
    }
    else {
        swapDate1 = ''
        swapDate2 = ''
    }
    // NOTE - staffID, deleteAsgmntDt, swapAsgmnt1ID, and swapAsgmnt2ID are GLOBAL variables
    var data = {actionDesc:actionDesc,reasonDesc:reasonDesc,staffID:staffID,deleteAsgmntDt:deleteAsgmntDt,swapDate1:swapDate1,swapDate2:swapDate2,shopNumber:curShopNumber};
    xhttp.send(JSON.stringify(data));
}  // END OF CLOSE NOTES ROUTINE                 



// MODAL FOR MEMBER DATA
function openMemberModal() {
    memberID = currentMemberID
    if (memberID = '') {
        alert('Must select a member.')
        return
    } 
    mbrName =  document.getElementById('memberNameHdg').innerHTML
    document.getElementById("memberNameID").innerHTML = mbrName
    
    // SEND MEMBER ID TO SERVER
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/getMemberModalData"); 
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
        response = JSON.parse(this.response)
        msg = this.response
        if (msg.slice(0,5) == 'ERROR') {
            alert(msg)
            return
        }
        dataArray = response 

        document.getElementById("janID").checked = dataArray[1]
        document.getElementById("febID").checked = dataArray[2]
        document.getElementById("marID").checked = dataArray[3]
        document.getElementById("aprID").checked = dataArray[4]
        document.getElementById("mayID").checked = dataArray[5]
        document.getElementById("junID").checked = dataArray[6]
        document.getElementById("julID").checked = dataArray[7]
        document.getElementById("augID").checked = dataArray[8]
        document.getElementById("sepID").checked = dataArray[9]
        document.getElementById("octID").checked = dataArray[10]
        document.getElementById("novID").checked = dataArray[11]
        document.getElementById("decID").checked = dataArray[12]

        document.getElementById("certifiedRA").checked = dataArray[13]
        document.getElementById("certifiedBW").checked = dataArray[14]
        
        document.getElementById("lastTrainingDateID").value = dataArray[15]
        document.getElementById("needsToolCribID").checked = dataArray[16]

        document.getElementById("memberNotesID").value = dataArray[17]
        document.getElementById("monitorDutyNotesID").value = dataArray[18]
        document.getElementById("saveMemberModalID").disabled = true
        
        $('#memberModalID').modal('show')
    }  // END OF READY STATE RESPONSE
    }  // END OF ONREADYSTATECHANGE
    // SEND DATA TO SERVER
    var data = {memberID:currentMemberID};
    xhttp.send(JSON.stringify(data));
}  // END OF OPEN MEMBER MODAL ROUTINE    

// ROUTINE FOR MEMBER DATA CHANGE
function memberModalChange() {
    document.getElementById("saveMemberModalID").disabled = false 
}

// ROUTINE FOR MEMBER DATA SAVE
function memberModalSave() {
    monitorNotes=document.getElementById("memberNotesID").value
    memberNotes=document.getElementById("monitorDutyNotesID").value
    jan= document.getElementById("janID").checked
    feb= document.getElementById("febID").checked
    mar= document.getElementById("marID").checked
    apr= document.getElementById("aprID").checked
    may= document.getElementById("mayID").checked
    jun= document.getElementById("junID").checked
    jul= document.getElementById("julID").checked
    aug= document.getElementById("augID").checked
    sep= document.getElementById("sepID").checked
    oct= document.getElementById("octID").checked
    nov= document.getElementById("novID").checked
    dec= document.getElementById("decID").checked
    
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/updateMemberModalData"); 
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            //response = JSON.parse(this.response)
            msg = this.response
            if (msg.slice(0,5) == 'ERROR') {
                alert(msg)
                return 
            }
            alert(msg)
        }  // END OF READY STATE RESPONSE
    }  // END OF ONREADYSTATECHANGE
// SEND DATA TO SERVER
var data = {memberID:currentMemberID,monitorNotes:monitorNotes,memberNotes:memberNotes,jan:jan,feb:feb,mar:mar,apr:apr,may:may,jun:jun,jul:jul,aug:aug,sep:sep,oct:oct,nov:nov,dec:dec};
xhttp.send(JSON.stringify(data));
}  // END OF MEMBER MODAL SAVE ROUTINE   


function printWeeklyMonitorSchedule(dayNumber) {
    // DETERMINE WHICH DAY WAS CLICKED
    if (dayNumber == 1){
        dateScheduled = document.getElementById('day1yyyymmdd').value
        shopNumber = document.getElementById('day1shopNumber').value
    }
    else if (dayNumber == 2) {
        dt = document.getElementById('day2yyyymmdd').value
        shopNumber = document.getElementById('day2shopNumber').value    
        }
        else {
            alert('ERROR - printWeeklyMonitorSchedule routine.')
            return
        }

   
    // SEND DATE AND SHOPNUMBER TO SERVER
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/printWeeklyMonitorSchedule"); 
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            // PROCESS RESPONSE
            // open report ????????????
            alert("Report completed.")
            return 
        }
    }      // END OF READY STATE RESPONSE
   // END OF ONREADYSTATECHANGE
    // SEND DATA TO SERVER
    var data = {dateScheduled:dateScheduled,shopNumber:shopNumber};
    xhttp.send(JSON.stringify(data));
}  // END OF OPEN MEMBER MODAL ROUTINE      
