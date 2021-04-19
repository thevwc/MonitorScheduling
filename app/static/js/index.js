// index.js

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
    bg_Closed_Both: "#704241",  // Brown
    fg_Closed:  "#FFFFFF",  // White (#FFFFFF)
    bg_ToManySM:"#FAFE02",  // Yellow
    fg_ToManySM:"#000000",  // Black
    bg_ToManyTC:"#FE4E02",  // Orange
    fg_ToManyTC:"#000000",  // Black
    bg_PastDate:"#cccccc",  // Light grey
    fg_PastDate:"#FFFFFF",  // White (#FFFFFF)
    font_Red:   "#FF0000",  // Red
    bg_White:   "#FFFFFF",  // White (#FFFFFF)
    font_Yellow:"#FAFE02",  // Yellow
    bg_Navy:    "#000080"   // Navy
};

// Declare global variables)
var currentMemberID = ''
var startUpYear = ''
var yearFilter = ''
var clientLocation = ''  // Client location is where this app is being used; if is the startup point for shop filter
var shopFilter = ''     // Shop filter, shop location, shop number refers to the shop data being manipulated

var todaysDate = new Date();
var currentYear = todaysDate.getFullYear()
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

// WHICH SHOP LOCATION? USE THE SHOP LOCATION SPECIFIED AT LOGIN AND PASSED TO INDEX.HTML
clientLocation = document.getElementById('shopID').value
if (clientLocation != 'RA' & clientLocation != 'BW'){
    alert('Missing shopID; cannot continue.')
}

// SET UP SHOP FILTER LIST
setShopFilter(clientLocation)

// Set modal form location to current settings
document.getElementById("shopDefault").selectedIndex = curShopNumber

// CHECK FOR A CURRENT MEMBER ID; IF FOUND DISPLAY NAME AND SCHEDULE
currentMemberID = document.getElementById('memberID').innerHTML 
if (currentMemberID.length == 6) {
    document.getElementById('memberBtnsID').style.display='block'
    populateMemberSchedule(currentMemberID,'')
}


// DEFINE EVENT LISTENERS
document.getElementById("yearToDisplay").addEventListener("change", yearChanged);
document.getElementById("shopToDisplay").addEventListener("change", shopChanged);
document.getElementById("refreshCalendarBtn").addEventListener("click",refreshCalendarRtn)
document.getElementById("selectpicker").addEventListener("change",memberSelectedRtn)
document.getElementById("saveReasonID").addEventListener("click",saveReasonModal)
document.getElementById("saveMemberModalID").addEventListener("click",memberModalSave)
document.getElementById("closeMemberModalID").addEventListener("click",memberModalClose)



$('#reasonModalID').on('shown.bs.modal', function () {
    $('#reasonDescID').trigger('focus')
  })


// HIDE DAY 1 AND 2 BUTTONS
clearAll()

// SET 'CANCEL SWAP' AND 'MAKE SWAP' BUTTONS TO DISABLED
// document.getElementById('cancelSwap').disabled = true
// document.getElementById('makeSwap').disabled = true
// document.getElementById('clearAll').disabled = true

swapInProgress = false
swap1ID = ''
swap2ID = ''

//  SET FILTER VALUES BASED ON localStorage values
setShopFilter(shopFilter)

// Build initial calendar based on default settings OR get settings from cookies
buildYear(yearFilter); 

// POPULATE CALENDAR USING STARTUP PARAMETERS
populateCalendar(yearFilter,shopFilter) 

// RESTORE DAY DISPLAY
dayClickedID = localStorage.getItem('dayClickedID')
if (dayClickedID) {
    dayClicked(dayClickedID)
}

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
    shopFilter = this.value
    localStorage.setItem('shopFilter',this.value)
    clearDay1()
    clearDay2()
    enableRefreshBtn()
    refreshCalendarRtn()
    // if (shopFilter == 'RA') {
    //     document.getElementById('day1Location').innerHTML='Rolling Acres'
    //     document.getElementById('day1Container').border='1px solid black'
    // }
    // else if (shopFilter == 'BW') {
    //     document.getElementById('day1Location').innerHTML='Brownwood'
    //     document.getElementById('day1Container').border='1px solid orange'
    // }
    // else {
    //     document.getElementById('day1Location').innerHTML='Rolling Acres'
    //     document.getElementById('day2Location').innerHTML='Brownwood' 
    // }
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


function dayClicked(dayClickedID) {
    shopSelected = document.getElementById('shopToDisplay').value
    console.log('2.5 shopSelected - '+ shopSelected)
    
    // IS THE SHOP OPEN?
    curDay = document.getElementById(dayClickedID)
    if (curDay.classList.contains('closed')){
        modalAlert("VWC","The shop is closed.\nYou may not schedule a member on this date.")
        return
    }
    
    if (document.getElementById('day1-container').classList.contains('tableSelected')){
        upperTableOpen = false
    }
    else {
        upperTableOpen = true
    }
    if (document.getElementById('day2-container').classList.contains('tableSelected')){
        lowerTableOpen = false
    }
    else {
        lowerTableOpen = true
    }
    
    // WHEN 'BOTH' LOCATIONS IS NOT SELECTED AND THERE IS NOT A CURRENT MEMBER,
    // THE FIRST DAY CLICKED GOES TO UPPER TABLE, THE SECOND TO THE LOWER TABLE
    if (shopSelected != 'BOTH' && currentMemberID.length < 6) {
        console.log('not a current member - '+ currentMemberID)

        if (upperTableOpen) {
            // UPPER TABLE IS OPEN
            console.log('shopSelected - '+shopSelected)
            buildDayTable('upper',shopSelected,dayClickedID)
            document.getElementById('day1-container').classList.add('tableSelected')
            localStorage.setItem('upperDayClickedID',dayClickedID)
        }
        else {
            // LOWER TABLE IS OPEN
            if (lowerTableOpen){
                console.log('shopSelected - '+shopSelected)

                buildDayTable('lower',shopSelected,dayClickedID)
                document.getElementById('day2-container').classList.add('tableSelected')
                localStorage.setItem('lowerDayClickedID',dayClickedID)
            }
            else {
                modalAlert('Table status','You need to clear a day before selecting another date.')
            }
        }
        return
    }

    // WHEN 'BOTH' LOCATIONS IS NOT SELECTED AND THERE IS A CURRENT MEMBER,
    // THE FIRST DAY CLICKED GOES TO UPPER TABLE, THE SECOND TO THE LOWER TABLE
    if (shopSelected != 'BOTH' && currentMemberID.length == 6) {
        console.log('there is a current member - '+ currentMemberID)
        console.log('shopSelected - '+shopSelected)
        buildDayTable('upper',shopSelected,dayClickedID)
        if (!upperTableOpen) {
            document.getElementById('day1-container').classList.add('tableSelected')
        }
        localStorage.setItem('upperDayClickedID',dayClickedID)
    }


    // 'BOTH' LOCATIONS HAS BEEN SELECTED; RA GOES TO UPPER TABLE, BW TO LOWER TABLE
    if (shopSelected == 'BOTH') {
        if (upperTableOpen) {
            // UPPER TABLE IS OPEN
            buildDayTable('upper','RA',dayClickedID)
            document.getElementById('day1-container').classList.add('tableSelected')
            localStorage.setItem('upperDayClickedID',dayClickedID)
        }
        else {
            if (lowerTableOpen){
                // LOWER TABLE IS OPEN
                buildDayTable('lower','BW',dayClickedID)
                document.getElementById('day2-container').classList.add('tableSelected')
                localStorage.setItem('lowerDayClickedID',dayClickedID)
            }
            else {
                modalAlert('Table status','You need to clear a day before selecting another date.')
            }
        }
    }
}
 
function refreshCalendarRtn() {
    console.log('... refreshCalendarRtn')
    yearSelected = document.getElementById("yearToDisplay")
    shopSelected = document.getElementById("shopToDisplay")
    yearFilter = yearSelected.value
    shopFilter = shopSelected.value
    buildYear(yearFilter);
    populateCalendar(yearFilter,shopFilter) 
    
    // REFRESH MEMBERS SCHEDULE
    currentMemberID = document.getElementById('memberID').innerHTML 
    if (currentMemberID.length == 6) { 
        populateMemberSchedule(currentMemberID,'')
        document.getElementById('memberBtnsID').style.display='block'
    }   
    console.log('... end of refreshCalendar')
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
        //td.classList.add("dayCell(this.id)");
        td.classList.add("dayCell");
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
            //console.log ('shopData - ' + shopData)
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

                    case (status == 'CLOSED' && shopValue != 'BOTH'):
                        document.getElementById(dayID).style.backgroundColor = colors.bg_Closed;
                        document.getElementById(dayID).style.color = colors.fg_Closed;
                        document.getElementById(dayID).classList.add('closed')
                        break

                    case (status == 'CLOSED' && shopValue == 'BOTH'):
                        document.getElementById(dayID).style.backgroundColor = colors.bg_Closed_Both;
                        document.getElementById(dayID).style.color = colors.fg_Closed;
                        document.getElementById(dayID).classList.add('closed')
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
    
    optionArray = select.getElementsByClassName("optName")
    
    // Loop through all option rows, and hide those who don't match the search query
    for (i = 0; i < optionArray.length; i++) {
        txtValue = option(i).textContent
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

function closeAlertModal() {
    document.getElementById('myAlertModal').style.display="none"
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
}

function buildDayTable(tableArea, shopLocation, dayClickedID) {
    console.log('... buildDayTable')
    // tableArea is 'upper' or 'lower'
    // upper = tableArea 1
    // lower = tableArea 2
    // send POST request with year, shop, and day of year
    console.log('tableArea - '+tableArea)
    console.log('shopLocation - '+shopLocation)
    console.log('dayClickedID - '+dayClickedID)

    console.log('7. BEGIN buildDayTable - '+tableArea+' '+ shopLocation + ' '+ dayClickedID)
    if (shopLocation == 'RA') {    
        shopNumber = '1'
        shopName = 'Rolling Acres'
    }
    else {
        if (shopLocation == 'BW') {
            shopNumber = '2'
            shopName = 'Brownwood'
        }
        else {
            alert('Invalid shopLocation')
            return
        }
    }
   
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/getDayAssignments"); 
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.onreadystatechange = function() {
        console.log('9. onreadystatechange')
        if (this.readyState == 4 && this.status == 200) {
            // PROCESS RESPONSE FROM REQUEST
            sched = JSON.parse(this.response)
            yyyymmdd = dayClickedID.slice(1,9)
            dayNumber = sched[0][7]
            if (dayNumber == 0) {
                dayNumber = dayOfYear(yyyymmdd)
            }
    
            // if swap-in-progress ... check for day2
            console.log('sched[0] - ' + sched[0])
            cnt = sched[0].length + 1
            

            // INSERT DATE, SHOP NAME INTO APPROPRIATE SCHEDULE HEADING
            console.log('10. tableArea - '+tableArea)
            console.log('11. shopName - '+ shopName)
            if (tableArea == 'upper') {
                console.log ('11.1 upper table')
                // REVEAL BUTTONS
                document.getElementById('day1Notes').style.display='block'
                document.getElementById('day1Print').style.display='block'
                document.getElementById('day1Clear').style.display='block'
            
                document.getElementById('day1Date').innerHTML = sched[0][1]
                day1Title = shopName
                document.getElementById('day1Location').innerHTML = day1Title
                
                prt = document.getElementById("day1Print")
                address = "/printWeeklyMonitorSchedule?dateScheduled="+ yyyymmdd + "&shopNumber=" + shopNumber 
                lnk = "window.location.href='" + address +"'"
                prt.setAttribute("onclick",lnk)

                // STORE DATE SCHEDULED IN yyyymmdd FORMAT IN A HIDDEN INPUT ELEMENT
                document.getElementById('day1yyyymmdd').value = yyyymmdd
                // STORE SHOP LOCATION AS A NUMBER IN A HIDDEN INPUT ELEMENT
                document.getElementById('day1ShopNumber').value = shopNumber
                document.getElementById('day1ShopInitials').value = shopLocation
                //  SET day1Detail to detailParent
                detailParent = document.getElementById('day1Detail')
                if (shopNumber == 1) {
                    SM_AM_REQD = shopData[dayNumber][5]
                    SM_PM_REQD = shopData[dayNumber][6]
                    TC_AM_REQD = shopData[dayNumber][7]
                    TC_PM_REQD = shopData[dayNumber][8]
                }
                else {
                    //  GET staffing requirements for shop 2
                    SM_AM_REQD = shopData[dayNumber][9]
                    SM_PM_REQD = shopData[dayNumber][10]
                    TC_AM_REQD = shopData[dayNumber][11]
                    TC_PM_REQD = shopData[dayNumber][12]
                }
                // console.log('sm am - '+SM_AM_REQD)
                // console.log('sm pm - '+SM_PM_REQD)
                // console.log('tc am - '+TC_AM_REQD)
                // console.log('tc pm - '+TC_PM_REQD)
            }
            else if (tableArea == 'lower') {
                console.log ('11.2 lower table')
                // REVEAL BUTTONS
                document.getElementById('day2Notes').style.display='block'
                document.getElementById('day2Print').style.display='block'
                document.getElementById('day2Clear').style.display='block'

                document.getElementById('day2Date').innerHTML = sched[0][1] 
                day2Title = shopName
                document.getElementById('day2Location').innerHTML = day2Title
                
                // STORE DATE SCHEDULED IN yyyymmdd FORMAT IN A HIDDEN INPUT ELEMENT
                document.getElementById('day2yyyymmdd').value = yyyymmdd
                // STORE SHOP LOCATION AS A NUMBER IN A HIDDEN INPUT ELEMENT
                document.getElementById('day2ShopNumber').value = shopNumber
                document.getElementById('day2ShopInitials').value = shopLocation

                //  SET day2Detail to detailParent
                detailParent = document.getElementById('day2Detail')
                //  GET staffing requirements for shop 2
                // if (swapInProgress) {
                //     // REQUIREMENTS FOR ONE LOCATION
                //     SM_AM_REQD = shopData[dayNumber][5]
                //     SM_PM_REQD = shopData[dayNumber][6]
                //     TC_AM_REQD = shopData[dayNumber][7]
                //     TC_PM_REQD = shopData[dayNumber][8]
                // }
                // else {
                //     // REQUIREMENTS FOR COMBINED LOCATIONS
                //     SM_AM_REQD = shopData[dayNumber][9]
                //     SM_PM_REQD = shopData[dayNumber][10]
                //     TC_AM_REQD = shopData[dayNumber][11]
                //     TC_PM_REQD = shopData[dayNumber][12]
                // }
            
            }
            // REMOVE CURRENT DAY ASSIGNMENTS FOR SELECTED SCHEDULE DAY
            while (detailParent.firstChild) {
                detailParent.removeChild(detailParent.lastChild);
            }

            //  AM SHOP MONITORS - LIST THOSE ASSIGNED ----------------------------------------------------
            numberLoaded = 0
            for ( var y=0; y<cnt; y++ ) {
                ShopNumber = sched[y][0]
                if (ShopNumber != shopNumber) {
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
                    createScheduleDetail(tableArea,yyyymmdd,Shift,Duty,Name,MemberID,RecordID)
                    numberLoaded += 1
                    
                }
            }

            // AM SHOP MONITORS - CREATE RECORDS OF SHIFTS TO FILL

            //  SM_AM_REQD = shopData[dayNumber][5]
            SM_AM_TO_FILL = SM_AM_REQD - numberLoaded
            for ( var y=0; y<SM_AM_TO_FILL; y++ ) {
                createScheduleDetail(tableArea,yyyymmdd,'AM','Shop Monitor',' ',' ',0)
            }
            //  END OF SHOP MONITORS AM

            //  AM TOOL CRIB - LIST THOSE ASSIGNED ----------------------------------------------------
            numberLoaded = 0
            for ( var y=0; y<cnt; y++ ) {
                
                ShopNumber = sched[y][0]
                if (ShopNumber != shopNumber) {
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
                    createScheduleDetail(tableArea,yyyymmdd,Shift,Duty,Name,MemberID,RecordID)
                    numberLoaded += 1
                }
            }

            // AM TOOL CRIB - CREATE RECORDS OF SHIFTS TO FILL
            //     TC_AM_REQD = shopData[dayNumber][6]
            TC_AM_TO_FILL = TC_AM_REQD - numberLoaded
            for ( var y=0; y<TC_AM_TO_FILL; y++ ) {
                createScheduleDetail(tableArea,yyyymmdd,'AM','Tool Crib',' ',' ',0)
            }
            // END OF TOOL CRIB AM

            //  PM SHOP MONITORS - LIST THOSE ASSIGNED ----------------------------------------------------
            numberLoaded = 0
            for ( var y=1; y<cnt; y++ ) {
                ShopNumber = sched[y][0]
                if (ShopNumber != shopNumber) {
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
                    createScheduleDetail(tableArea,yyyymmdd,Shift,Duty,Name,MemberID,RecordID)
                    numberLoaded += 1
                }
            }

            // PM SHOP MONITORS - CREATE RECORDS OF SHIFTS TO FILL
            //     SM_PM_REQD = shopData[dayNumber][7]
            SM_PM_TO_FILL = SM_PM_REQD - numberLoaded
            for ( var y=0; y<SM_PM_TO_FILL; y++ ) {
                createScheduleDetail(tableArea,yyyymmdd,'PM','Shop Monitor',' ',' ',0)
            }
            //  END OF SHOP MONITORS PM

            //  PM TOOL CRIB - LIST THOSE ASSIGNED ----------------------------------------------------
            numberLoaded = 0
            for ( var y=1; y<cnt; y++ ) {
                ShopNumber = sched[y][0]
                if (ShopNumber != shopNumber) {
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
                    createScheduleDetail(tableArea,yyyymmdd,Shift,Duty,Name,MemberID,RecordID)
                    numberLoaded += 1
                }
            }

            // PM TOOL CRIB - CREATE RECORDS OF SHIFTS TO FILL
            
            //      TC_PM_REQD = shopData[dayNumber][8]
            TC_PM_TO_FILL = TC_PM_REQD - numberLoaded
            for ( var y=0; y<TC_PM_TO_FILL; y++ ) {
                createScheduleDetail(tableArea,yyyymmdd,'PM','Tool Crib',' ',' ',0)
            }
            console.log('12. END build day table')
            // END OF TOOL CRIB PM
        //console.log('9.1 end of ready state - ' + shopName)    
        } // END OF IF READY ...
        
    }  // END OF xhttp
    // SEND REQUEST

    var data = {shopNumber:shopNumber,dayID:dayClickedID}; //send date selected to server;
    console.log('8. send date selected to server')
    xhttp.send(JSON.stringify(data));
    
}


function createScheduleDetail (tableArea,yyyymmdd,Shift,Duty,Name,MemberID,RecordID) {   
    // DETERMINE HOW MANY CHILD RECORDS EXIST
    //console.log('... createScheduleDetail - '+tableArea + ' ' + yyyymmdd + ' ' + Shift + ' '+ Duty + ' '+ Name)
    // ESTABLISH EITHER day1Detail or day2Detail as detailParent
    if (tableArea == 'upper') {
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
            unAssignedShiftClicked(this.id,tableArea);
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
    document.getElementById('memberName').innerHTML = selectedMember
    lastEight = selectedMember.slice(-8)
    currentMemberID= lastEight.slice(1,7)
   
    // STORE MEMBER ID  
    localStorage.setItem('currentMemberID',currentMemberID)
    populateMemberSchedule(currentMemberID,'')
    document.getElementById('selectpicker').value=''
    //document.getElementById('memberOptions').style.display='block'

    // SHOW BUTTONS
    showMemberButtons()
}

function populateMemberSchedule(memberID,scheduleYear) {
    if (memberID == null) {
        return
    }
    thisYear = document.getElementById('thisYearBtn').value
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

            // SET LINK FOR eMail BUTTON
            prt = document.getElementById("emailMemberScheduleBtn")
            lnk = "window.location.href='/emailMemberSchedule/"+ memberID + "'"
            prt.setAttribute("onclick",lnk)

            // FROM FIRST RECORD OF THE ARRAY, INSERT TRAINING DATE AND HIDDEN MEMBER ID
            trainingDate = sched[0][3]
            document.getElementById('lastMonitorTrainingID').value = trainingDate
            memberIDfromArray = sched[0][0]
            document.getElementById('memberID').innerHTML = memberIDfromArray 
            document.getElementById('needsToolCribDuty').value=sched[0][11]
           
            if (sched[0][11].slice(0,5) == 'NEEDS') {
                document.getElementById('needsToolCribDuty').style.backgroundColor = colors.bg_White
                document.getElementById('needsToolCribDuty').style.color=colors.font_Red
            }

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
                if (sched[y][0] == 0) {
                    break 
                }

                // DOES THE MEMBER HAVE ANY ASSIGNMENTS?
                if (sched[y][4] == 0) {
                    return
                }
                // BUILD MEMBERS SCHEDULE
                memberIDfromArray = sched[y][0]
                shopNumber = sched[y][1]
                displayName = sched[y][2]
                dateScheduled = sched[y][4]
                dateScheduledFormatted = sched[y][5]
                shift = sched[y][6]
                duty = sched[y][7]
                noShow = sched[y][8]
                locationName = shopNames[shopNumber - 1]
                recordID = sched[y][10]

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
                // todaysDate = new Date()
                if (scheduleYear == thisYear) {
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
               
                var inputNoShow = document.createElement("input")
                inputNoShow.type='checkbox'
                inputNoShow.id='R'+recordID
                lnk = "window.location.href='/setNoShow/?recordID="+recordID + "'"
                inputNoShow.setAttribute("onclick",lnk)
                if (noShow){
                    inputNoShow.checked="checked"
                }
                //labelNoShow.appendChild(inputNoShow)
                mbrRowDiv.appendChild(inputNoShow)
            
            }  // END OF FOR LOOP  
            return
        }  // END OF READY STATE TEST
    }   // END IF READYSTATE ...
    var data = {memberID:memberID,scheduleYear:scheduleYear}; //send memberID selected to server;
    xhttp.send(JSON.stringify(data)); 
}   // END xhttp FUNCTION



// USER CLICKED ON A BLANK, IE, UNASSIGNED SHIFT SLOT
// ADD A RECORD TO THE TABLE tblMonitor_Schedule
function unAssignedShiftClicked(nameID,tableArea) {

    // MUST HAVE A CURRENT MEMBER OR HAVE INITIATED A SWAP
    console.log('currentMemberID - '+currentMemberID + '/n swapInProgress - ' + swapInProgress)
    // if (currentMemberID.length != 6 &  !swapInProgress) {
    //     modalAlert('SELECT ASSIGNMENT SLOT','You need to select a member or initiate a swap \nbefore selecting an assignment.')
    //     return
    // }

    selectedName = document.getElementById(nameID)
    
    // HIGHLIGHT NAME SELECTED
    selectedName = document.getElementById(nameID)
    if (selectedName.classList.contains('rowSelected')) {
        selectedName.classList.remove('rowSelected')
        return
    }
    
    //     if (swapAsgmnt1ID = nameID.slice(0,9)){
    //         swapAsgmnt1ID = ''
    //         swap1Location = ''
    //     }
    //     if (swapAsgmnt2ID = nameID.slice(0,9)){
    //         swapAsgmnt2ID = ''
    //         swap2Location = ''
    //     }
    // }
    // else {
    numberOfRowsSelected=document.getElementsByClassName('rowSelected').length
    console.log('numberOfRowsSelected - '+numberOfRowsSelected)
    if (numberOfRowsSelected < 2) {
        selectedName.classList.add('rowSelected')
    }
    else {
        modalAlert("SELECT ASSIGNMENT","You may only have two rows selected at once.")
        return
    }
    
    
    // IS A SWAP IN PROGRESS
    // if (swapInProgress) {
    //     if (swapAsgmnt1ID == '') {
    //         swapAsgmnt1ID = nameID.slice(0,9)
    //         //alert('swapAsgmnt1ID - '+ swapAsgmnt1ID)
    //     }
    //     else if (swapAsgmnt2ID == '') {
    //         swapAsgmnt2ID = nameID.slice(0,9)
    //     }
    //         else {
    //             alert('Error in swap unAssignedShiftClicked routine.')
    //             return 
    //         }
    //     return
        
    // }
    
    // confirm add ?


    // IF NO CURRENT MEMBER THEN JUST HIGHLIGHT FOR SWAP
    if (currentMemberID.length != 6) {
        return
    }

    // VERIFY THAT YOU WANT TO ADD THIS ASSIGNMENT TO THE CURRENT MEMBER'S SCHEDULE?
    console.log('currentMemberID - '+currentMemberID + '/n swapInProgress - ' + swapInProgress)
    
    if (!confirmAdd()) {
        selectedName.style.backgroundColor = 'white'
        return
    }    
    
    // PROCESS ADD ASSIGNMENT
    
    idPrefix = nameID.slice(0,9)
    
    // GET THE SHIFT AND DUTY FROM PREVIOUS SIBLING ELEMENTS IN THE ROW
    dutyID = idPrefix + 'duty'
    Duty = document.getElementById(dutyID).innerHTML
    
    shiftID = idPrefix + 'shift'
    Shift = document.getElementById(shiftID).innerHTML

    // GET THE SHOPNUMBER, LOCATION, FROM day1header ....
    if (tableArea == 'upper') {
        shopNumber=document.getElementById('day1ShopNumber').value
        dateScheduled=document.getElementById('day1yyyymmdd').value
    }
    else
    {
        shopNumber=document.getElementById('day2ShopNumber').value
        dateScheduled=document.getElementById('day2yyyymmdd').value
    }
    print (currentMemberID,dateScheduled,Shift,shopNumber,Duty,nameID)
    addAssignment(currentMemberID,dateScheduled,Shift,shopNumber,Duty,nameID)
}


// USER CLICKED ON A NAME DISPLAYED IN EITHER THE SCHEDULE 1 OR 2 AREA
// SAVE INFORMATION FOR A SWAP?
function assignedShiftClicked(nameID) {
    //console.log('nameID - '+nameID)
    // HIGHLIGHT NAME SELECTED
    selectedName = document.getElementById(nameID)
    //console.log('selectedName classes - '+ selectedName.classList)
    if (selectedName.classList.contains('rowSelected')) {
        selectedName.classList.remove('rowSelected')
        return
    }
    
    numberOfRowsSelected=document.getElementsByClassName('rowSelected').length
    //console.log('numberOfRowsSelected - '+ numberOfRowsSelected)
    if (numberOfRowsSelected < 2) {
        selectedName.classList.add('rowSelected')
        return
    }
    else {
        modalAlert('SELECT ASSIGNMENT','You may only select 2 assignments at once.')
        return
    }
    
}

function confirmDelete() {
    answer = confirm("Delete this assignment?");
    return answer
}

function confirmAdd() {
    answer = confirm('Add this assignment?')
    return answer
}

// DELETE AN ASSIGNMENT BY RECORD ID
function delAssignment(id) {
    console.log('delAssignment id -'+id)
    idPrefix = id.slice(0,9)
    console.log('idPrefix - '+idPrefix)
    schedDateID = idPrefix + 'schedDateID'
    console.log('schedDateID - '+schedDateID)
    schedDateValue = document.getElementById(schedDateID).value
    console.log('schedDateValue - '+ schedDateValue)
    dayClickedID = 'x'+schedDateValue
    console.log('dayClickedID - ' + dayClickedID)
    
    selectedName = document.getElementById(idPrefix + 'name')
    memberID = document.getElementById('memberID').innerHTML
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
            openReasonModal(msg,asgmntID1,asgmntID2)

            populateMemberSchedule(memberID,'')
            // REFRESH DAY 
            if (dayClickedID){
                dayClicked(dayClickedID)
            }
            selectedName.style.backgroundColor = 'white'

        }  // END OF READY STATE TEST
    }  // END OF ONREADYSTATECHANGE
    
    // SEND WEEK#, STAFF ID, MEMBER ID, DATE SCHEDULED, AMPM, DUTY, AND RECORD ID
    
    recordID = document.getElementById(idPrefix+"recordID").value
    //deleteAsgmntDt = document.getElementById(idPrefix+"schedDateID").value
    var data = {recordID:recordID};
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
                modalAlert('ADD ASSIGNMENT',msg)
                return
            }
            // DISPLAY THE NAME
            mbrName  = document.getElementById('memberName').innerHTML
            document.getElementById(id).value = mbrName

            // CONSTRUCT dayID FOR EXECUTING THE dayClicked FUNCTION
            tableArea=id.slice(3,4)
            if (tableArea = 'upper') {
                dayYearMoDa = document.getElementById('day1yyyymmdd').value
            }
            else
            {
                dayYearMoDa = document.getElementById('day2yyyymmdd').value
            }

            // REFRESH CALENDAR DISPLAY TO REFLECT NEW ASSIGNMENT
            refreshCalendarRtn()

            // REFRESH MEMBERS SCHEDULE
            populateMemberSchedule(memberID,'')
            
        }  // END OF READY STATE TEST
    }  // END OF ONREADYSTATECHANGE

    // SEND PARAMETERS FOR ADDING AN ASSIGNMENT
    schedDate = document.getElementById('day1yyyymmdd').value
    var data = {memberID:memberID,schedDate:DateScheduled,Shift:Shift,shopNumber:shopNumber,Duty:Duty}
xhttp.send(JSON.stringify(data)); 
}   // END xhttp FUNCTION


function clearAll() {
    //cancelSwap()
    // document.getElementById('makeSwap').disabled = true
    // document.getElementById('cancelSwap').disabled = true
    // document.getElementById('clearAll').disabled = true
    clearDay1()
    clearDay2()
}
function clearDay1() {
    console.log('clearDay1 .....')
    document.getElementById('day1-container').classList.remove('tableSelected')
    localStorage.removeItem('upperDayClickedID')
    while (day1Detail.firstChild) {
        day1Detail.removeChild(day1Detail.lastChild);
    }
    document.getElementById('day1Date').innerHTML = ''
    document.getElementById('day1Location').innerHTML=''
    // HIDE BUTTONS
    document.getElementById('day1Notes').style.display='none'
    document.getElementById('day1Print').style.display='none'
    document.getElementById('day1Clear').style.display='none'

    // REMOVE STORED VALUE
    localStorage.removeItem('dayClickedID')
    localStorage.removeItem('swap1ID')
}

function clearDay2() {
    console.log('clearDay2 ...')
    document.getElementById('day2-container').classList.remove('tableSelected')
    localStorage.removeItem('lowerDayClickedID')
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

    // REMOVE STORED VALUE
    localStorage.removeItem('dayClickedID')
    localStorage.removeItem('swap2ID')
}

function printDay(dayNumber) {
    
    // alert('Routine not yet implemented.')

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
    localStorage.removeItem('swap1ID')
    localStorage.removeItem('swap2ID')
    swapAsgmnt1ID = ''
    swapAsgmnt2ID = ''
    dayClickedSaved = ''
    dayClickedSaved2 = ''
    btnCancelSwap = document.getElementById('cancelSwap')
    btnCancelSwap.disabled = false;
    btnMakeSwap = document.getElementById('makeSwap')
    btnMakeSwap.disabled = false;
    btnClearAll = document.getElementById('clearAll')
    btnClearAll.disabled = true;
    clearDay1()
    clearDay2()

    if (shopFilter != 'BOTH') {
        msg = 'Select one or two dates, then select two assignments.'
        modalAlert('SET UP SWAP',msg)
    }
    else {
        msg = 'Select a date for Rolling Acres, \nthen select a date for Brownwood,\nthen select the assignments to swap.'
        modalAlert('SET UP SWAP BETWEEN LOCATIONS',msg)
    }
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
    // document.getElementById('makeSwap').disabled = true
    // document.getElementById('cancelSwap').disabled = true
    // document.getElementById('clearAll').disabled = false
    // document.getElementById('initiateSwap').disabled = false
}

function makeSwapOrMove() {
    console.log('#1 ... makeSwapOrMove')
    // SHOP NUMBER IS ALWAYS THE SAME FOR ALL ASSIGNMENTS SHOWN FOR A SPECIFIC DAY
    // THE ELEMENT day1ShopNumber/day2ShopNumber CONTAINS THE SHOP NUMBER/SHOP INITIALS FOR ALL ASSIGNMENTS SHOWN 
    // GET SHOP NUMBER FROM DROP DOWN SELECTION OR DAYxSHOPNUMBER
    
    // ARE THERE TWO ASSIGNMENTS SELECTED?
    numberOfRowsSelected=document.getElementsByClassName('rowSelected').length
    console.log('numberOfRowsSelected - '+numberOfRowsSelected)

    if (numberOfRowsSelected < 2) {
        alert("You must select two assignments.")
        return
    }
    if (numberOfRowsSelected > 2) {
        alert("You may only select two assignments.")
        return
    }
    rowsSelected = document.getElementsByClassName('rowSelected')
    swapAsgmnt1ID = rowsSelected[0].id
    swapAsgmnt2ID = rowsSelected[1].id
    asgmntID1 = swapAsgmnt1ID.slice(0,9)
    asgmntID2 = swapAsgmnt2ID.slice(0,9)
    console.log('swapAsgmnt1ID(0,4) - |'+swapAsgmnt1ID.slice(0,4)+'|')
    if (swapAsgmnt1ID.slice(0,4) == 'day1') {
        tableArea1 = 'upper'
        swap1Location = document.getElementById('day1ShopInitials')
    }
    else {
        tableArea1 = 'lower'
        swap1Location = document.getElementById('day2ShopInitials')
    }
    if (swapAsgmnt2ID.slice(0,4) == 'day1') {
        tableArea2 = 'upper'
        swap2Location = document.getElementById('day1ShopInitials')
    }
    else {
        tableArea2 = 'lower'
        swap2Location = document.getElementById('day2ShopInitials')
    }

    recordID1 = document.getElementById(asgmntID1+'recordID').value
    recordID2 = document.getElementById(asgmntID2+'recordID').value
    console.log('swapAsgmnt1ID - ',swapAsgmnt1ID)
    console.log('swapAsgmnt2ID - ',swapAsgmnt2ID)

    name1 = document.getElementById(asgmntID1 + 'name').value
    console.log('name1 - '+name1)
    
    name2 = document.getElementById(asgmntID2 + 'name').value
    console.log('name2 - '+name2)
     
    
    // CHECK FOR TWO BLANK ASSIGNMENTS
    if (name1.length < 2 && name2.length < 2) {
        modalAlert("Swap/Move","At least one time slot must not be unassigned.")
        return 
    }
    // CALL MOVE ROUTINE OR SWAP ROUTINE
    if (name1.length < 2 | name2.length < 2) {
        // CALL MOVE ROUTINE
        if (name1.length < 2) {
            // send name1 memberID
            // send name2 recordID,scheduleDate,shift,duty,location
            makeMove(tableArea1,recordID1,tableArea2,recordID2)
        }
        else {
            // send name2 memberID
            // send name1 recordID,scheduleDate,shift,duty,location
        }
    }
    else {
        // CALL SWAP ROUTINE
        // send memberID1,memberID2,record1,record2
        makeSwap(tableArea1,recordID1,tableArea2,recordID2,asgmntID1,asgmntID2)
    }
//--------------------------------------------------------------------------
function makeSwap(tableArea1,recordID1,tableArea2,recordID2,asgmntID1,asgmntID2) {
    console.log('#2 ... makeSwap')
    // SEND SWAP DATA TO SERVER
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
                console.log('... refresh day(s) display')

                // REFRESH DAY(S) DISPLAY
                //if (swapAsgmnt1ID.slice(3,4) == 1 | swapAsgmnt2ID.slice(3,4) == 1){
                console.log('tableArea1 - '+tableArea1)
                if (tableArea1 == 'upper' | tableArea2 == 'upper') {
                    // REFRESH DAY 1
                    dayDate = document.getElementById('day1yyyymmdd').value
                    shopInitials = document.getElementById('day1ShopInitials').value
                    dayClickedID = "X" + dayDate
                    console.log('1636 shopInitials - '+shopInitials)
                    console.log('dayClickedID - '+dayClickedID)

                    buildDayTable('upper',shopInitials,dayClickedID)
                }
                console.log('tableArea2 - '+tableArea2)
                if (tableArea1 == 'lower' | tableArea2 == 'lower') {
                    // REFRESH DAY 1
                    dayDate = document.getElementById('day2yyyymmdd')
                    shopInitials = document.getElementById('day2ShopInitials').value
                    dayClickedID = "X" + dayDate
                    console.log('1645 shopInitials - '+shopInitials)

                    buildDayTable('lower',shopInitials,dayClickedID)
                }
                document.getElementById('clearAll').disabled = false
                console.log('#3 ... call openReasonModal')
                openReasonModal(msg,asgmntID1,asgmntID2)
                console.log('... end of makeSwap ')
                return
            }
            else {
                alert(msg)
                
            } 
        }  // END OF READY STATE TEST
    }  // END OF ONREADYSTATECHANGE

    // SEND WEEK#, STAFF ID, MEMBER ID, DATE SCHEDULED, AMPM, DUTY, SHOP LOCATION AND RECORD ID
    var data = {recordID1:recordID1,recordID2:recordID2}
    xhttp.send(JSON.stringify(data)); 
    // END xhttp FUNCTION

    // END OF MAKE SWAP ROUTINE
}

function makeMove(toTableArea,fromTableArea,fromDate,toDate,memberID,fromRecordID,newShift,newDuty,newLocation) {
    // SEND MOVE DATA TO SERVER
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/moveMonitorAssignment"); 
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
                
                // REFRESH DAY(S) DISPLAY
                if (swapAsgmnt1ID.slice(3,4) == 1 | swapAsgmnt2ID.slice(3,4) == 1){
                    // REFRESH DAY 1
                    dayDate = document.getElementById('day1yyyymmdd')
                    shopInitials = document.getElementById('day1ShopInitials').value
                    console.log('1689 shopInitials - '+shopInitials)
                    buildDayTable('upper',shopInitials,dayClickedID)
                }
                if (swapAsgmnt1ID.slice(3,4) == 2 | swapAsgmnt2ID.slice(3,4) == 2){
                    // REFRESH DAY 2
                    dayDate2 = document.getElementById('day2yyyymmdd')
                    shopInitials = document.getElementById('day2ShopInitials').value
                    console.log('1696 shopInitials - '+shopInitials)

                    buildDayTable('lower',shopInitials,dayClickedID)
                }
                console.log('dayClickedSaved - '+dayClickedSaved)
                console.log('dayClickedSaved2 - '+dayClickedSaved2)
                dayClicked(dayClickedSaved)
                if (dayClickedSaved2 != ''){
                    console.log('dayClickedSaved2 not null')
                    if (dayClickedSaved2){
                        dayClicked(dayClickedSaved2)
                    }
                    
                }
                document.getElementById('clearAll').disabled = false
                openReasonModal(msg,asgmntID1,asgmntID2)
            }
            else {
                alert(msg)
                //cancelSwap()
                return
            } 
        }  // END OF READY STATE TEST
    }  // END OF ONREADYSTATECHANGE

    // SEND WEEK#, STAFF ID, MEMBER ID, DATE SCHEDULED, AMPM, DUTY, SHOP LOCATION AND RECORD ID

    // GET DATA FOR ASSIGNMENT 1
    idPrefix1 = swapAsgmnt1ID.slice(0,9)
    recordID1 = document.getElementById(idPrefix1+"recordID").value
    memberID1 = document.getElementById(idPrefix1+"memberID").value
    schedDate1 = document.getElementById(idPrefix1 + "schedDateID").value
    shift1 = document.getElementById(idPrefix1 + 'shift').textContent
    duty1 = document.getElementById(idPrefix1 + 'duty').textContent

    // IS THE FIRST SELECTION IN DAY 1 OR DAY 2?
    if (swapAsgmnt1ID.slice(3,4) == 1){
        swap1Location = document.getElementById('day1ShopInitials').value
    }
    else { swap1Location = document.getElementById('day2ShopInitials').value
    }

    // GET DATA FOR ASSIGNMENT 2
    idPrefix2 = swapAsgmnt2ID.slice(0,9)
    recordID2 = document.getElementById(idPrefix2+"recordID").value
    memberID2 = document.getElementById(idPrefix2+"memberID").value
    schedDate2 = document.getElementById(idPrefix2 + "schedDateID").value
    shift2 = document.getElementById(idPrefix2 + 'shift').textContent
    duty2 = document.getElementById(idPrefix2 + 'duty').textContent

    // IS THE SECOND SELECTION IN DAY 1 OR DAY 2?
    if (swapAsgmnt2ID.slice(3,4) == 1){
        swap2Location = document.getElementById('day1ShopInitials').value
    }
    else { swap2Location = document.getElementById('day2ShopInitials').value
    }
    
    var data = {schedDate1:schedDate1,schedDate2:schedDate2,shift1:shift1,shift2:shift2,
    recordID1:recordID1,recordID2:recordID2,memberID1:memberID1,memberID2:memberID2,
    duty1:duty1,duty2:duty2,shopNumber:shopNumber,swap1Location:swap1Location,swap2Location:swap2Location};
    xhttp.send(JSON.stringify(data)); 
    // END xhttp FUNCTION

    // END OF MAKE SWAP ROUTINE
}
}


function openNotesRtn(day) {
    if (day == '1') {
        dateScheduled = document.getElementById('day1yyyymmdd').value
        shopNumber = document.getElementById('day1ShopNumber').value    
    }
    else {
        dateScheduled = document.getElementById('day2yyyymmdd').value
        shopNumber = document.getElementById('day2ShopNumber').value 
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


function openReasonModal(actionDesc,asgmntID1,asgmntID2) {
    console.log('#4 ... openReasonModal rtn')
    dt = document.getElementById('day1yyyymmdd').value
    document.getElementById('actionDescID').value = actionDesc
    document.getElementById('reasonDescID').value = ""
    document.getElementById('asgmnt1ID').value = asgmntID1
    document.getElementById('asgmnt2ID').value = asgmntID2

    if (document.getElementById('day1Location').value = 'Rolling Acres') {
        shopNumber = 1
        shopID = 'RA'
    }
    else {
        shopNumber = 2
        shopID = 'BW'
    }
    document.getElementById('shopNumber').value = shopNumber
    document.getElementById('shopID').value = shopID
    $('#reasonModalID').modal('show')
    document.getElementById('reasonDescID').focus
    console.log('... end of openReasonModal')
    return
}

function saveReasonModal() {
    console.log('#5 ... saveReasonModal')
    asgmnt1ID = document.getElementById('asgmnt1ID').value
    asgmnt2ID = document.getElementById('asgmnt2ID').value
    console.log('asgmnt1ID - '+ asgmnt1ID)
    console.log('asgmnt2ID - '+ asgmnt2ID)

    //dayNumber1 = (asgmnt1ID.slice(0,4))
    //console.log('dayNumber1 - '+dayNumber)

    shopInitials = document.getElementById('shopToDisplay').value
    asgmnt1ShopNumber = asgmnt1ID.slice(3,4)
    console.log('asgmnt1ShopNumber - '+asgmnt1ShopNumber)

    //asgmnt1Location = document.getElementById(dayNumber1 + 'ShopInitials').value
    //dayNumber2 = (asgmnt2ID.slice(0,4))
    asgmnt2ShopNumber = asgmnt2ID.slice(3,4)
    //asgmnt2Location = document.getElementById(dayNumber2 + 'ShopInitials').value

    console.log('asgmnt2ShopNumber - '+asgmnt2ShopNumber)

    // SHOP INITIALS WILL BE 'RA', 'BW', OR 'BOTH'
    // if (shopInitials == 'RA') {
    //     shopNumber = 1
    // }
    // else {
    //     if (shopInitials == 'BW') {
    //         shopNumber = 2
    //     }
    //     else {
    //         shopNumber = 3
    //     }
        
    // }
    //console.log('dayNumber1 - '+dayNumber1)
    //console.log('dayNumber2 - '+dayNumber2)
    if (asgmnt1ShopNumber == 1){
        asgmnt1Date = document.getElementById('day1yyyymmdd').value
    }
    else{
        asgmnt1Date = document.getElementById('day2yyyymmdd').value
    }
    if (asgmnt2ShopNumber == 1){
        asgmnt2Date = document.getElementById('day1yyyymmdd').value
    }
    else{
        asgmnt2Date = document.getElementById('day2yyyymmdd').value
    }
    console.log('asgmnt1Date - ' + asgmnt1Date)
    console.log('asgmnt2Date - ' + asgmnt2Date)

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
   
    // SEND ACTION AND REASON TO SERVER WITH DATES, AND SHOPNUMBER
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
            console.log('#6 ... end of saveReasonModal')
            //refreshCalendarRtn()
        }  // END OF READY STATE RESPONSE
    }  // END OF ONREADYSTATECHANGE

    
    var data = {actionDesc:actionDesc,reasonDesc:reasonDesc,asgmnt1Date:asgmnt1Date,asgmnt2Date:asgmnt2Date,asgmnt1ShopNumber:asgmnt1ShopNumber,asgmnt2ShopNumber:asgmnt2ShopNumber};
    xhttp.send(JSON.stringify(data));
}  // END OF CLOSE NOTES ROUTINE                 



// MODAL FOR MEMBER DATA
function openMemberModal() {
    memberID = currentMemberID
    if (memberID = '') {
        alert('Must select a member.')
        return
    } 
    mbrName =  document.getElementById('memberName').innerHTML
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
        
        $('#memberModalID').modal('show')
    }  // END OF READY STATE RESPONSE
    }  // END OF ONREADYSTATECHANGE
    // SEND DATA TO SERVER
    var data = {memberID:currentMemberID};
    xhttp.send(JSON.stringify(data));
}  // END OF OPEN MEMBER MODAL ROUTINE    

// ROUTINE FOR MEMBER DATA SAVE
function memberModalSave() {
    lastTraining = document.getElementById('lastTrainingDateID').value
    needsToolCrib = document.getElementById('needsToolCribID').checked
    console.log('needsToolCrib - '+needsToolCrib)
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
            
            document.getElementById('saveMemberModalID').style.display='None'
            document.getElementById('closeMemberModalID').style.display='Block'
            $('#memberModalID').modal('show')
           
        }  // END OF READY STATE RESPONSE
    }  // END OF ONREADYSTATECHANGE
// SEND DATA TO SERVER
var data = {memberID:currentMemberID,lastTraining:lastTraining,monitorNotes:monitorNotes,memberNotes:memberNotes,
    jan:jan,feb:feb,mar:mar,apr:apr,may:may,jun:jun,jul:jul,aug:aug,sep:sep,oct:oct,nov:nov,dec:dec,needsToolCrib:needsToolCrib};
xhttp.send(JSON.stringify(data));
}  // END OF MEMBER MODAL SAVE ROUTINE   

function memberModalClose() {
    $('#memberModalID').modal('hide')
    document.getElementById('saveMemberModalID').style.display='Block'
    document.getElementById('closeMemberModalID').style.display='None'
    refreshMemberSchedule()
}

function printWeeklyMonitorSchedule(dayNumber) {
    // DETERMINE WHICH DAY WAS CLICKED
    if (dayNumber == 1){
        dateScheduled = document.getElementById('day1yyyymmdd').value
        shopNumber = document.getElementById('day1ShopNumber').value
    }
    else if (dayNumber == 2) {
        dt = document.getElementById('day2yyyymmdd').value
        shopNumber = document.getElementById('day2ShopNumber').value    
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

function modalAlert(title,msg) {
	document.getElementById("modalAlertTitle").innerHTML = title
	document.getElementById("modalAlertBody").innerHTML= "<pre>" + msg + "</pre>"
	$('#myAlertModal').modal('show')
}
	
function closeAlertModal() {
	$('#myAlertModal').modal('hide')
}

function refreshMemberSchedule() {
    currentMemberID = document.getElementById('memberID').innerHTML 
    if (currentMemberID.length == 6) {      
        populateMemberSchedule(currentMemberID,'')
    }   
}
function printMemberScheduleRtn() {
    alert ('print not implemented ...')
}

// On page load add eventlistener to each btn in schedulePeriod:
// Add active class to the current button (highlight it)
var header = document.getElementById("schedulePeriod");
var btns = header.getElementsByClassName("btn");
for (var i = 0; i < btns.length; i++) {
	btns[i].addEventListener("click", function() {
	var current = document.getElementsByClassName("active");
	current[0].className = current[0].className.replace(" active", "");
	this.className += " active";
});
}

function changeScheduleYear(yearSpecified) {
    populateMemberSchedule(currentMemberID,yearSpecified)
}

function clearMemberRtn() {
    hideMemberButtons()
    document.getElementById('lastMonitorTrainingID').value = ''
    window.location.reload()
}

function showMemberButtons() {
    document.getElementById('clearMemberBtn').style.display='block'
    document.getElementById('memberDataBtn').removeAttribute('disabled')
    document.getElementById('printMemberScheduleBtn').removeAttribute('disabled')
    document.getElementById('emailMemberScheduleBtn').removeAttribute('disabled')
    document.getElementById('needsToolCribDuty').style.display='block'
    document.getElementById('needsToolCribDuty').style.backgroundColor = colors.bg_Navy
    document.getElementById('needsToolCribDuty').style.color=colors.font_Yellow
}

function hideMemberButtons() {
    document.getElementById('clearMemberBtn').style.display='none'
    document.getElementById('memberDataBtn').disabled = true
    document.getElementById('printMemberScheduleBtn').disabled = true
    document.getElementById('emailMemberScheduleBtn').disabled = true
    document.getElementById('needsToolCribDuty').style.display='none'
}