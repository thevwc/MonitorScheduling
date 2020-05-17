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
        //alert('currentMemberID -' + currentMemberID)
    }
    else {
        currentMemberID=''
        document.getElementById('memberNameHdg').innerHTML = ' '  
        // let elements = document.getElementsByClassName('optName');
        // for (let elem of elements) {
        //     listText = elem.innerHTML
        //     if (listText.includes(currentMemberID)) {
        //         document.getElementById('memberNameHdg').innerHTML = elem.innerHTML
    }
    

    //setDutyFilter("BOTH")
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
            break;
        case 'BW':
            localStorage.setItem('shopFilter','BW')
            document.getElementById("shopToDisplay").selectedIndex = 0; //Option Rolling Acres
            break;
        default:
            localStorage.setItem('shopFilter','BOTH')
            document.getElementById("shopToDisplay").selectedIndex = 2; //Option Both
    }   
}

// function setDutyFilter(dutyFilter) {
//     switch(dutyFilter){
//         case 'SM':
//             localStorage.setItem('dutyFilter','SM')
//             document.getElementById("dutyToDisplay").selectedIndex = 0; //Option Shop Monitor only
//             break;
//         case 'TC':
//             localStorage.setItem('dutyFilter','TC')
//             document.getElementById("dutyToDisplay").selectedIndex = 1; //Option Tool Crib only
//             break;
//         default:
//             localStorage.setItem('shopFilter','BOTH')
//             document.getElementById("dutyToDisplay").selectedIndex = 2; //Option Both Shop Monitor & Tool Crib
//     }   
// }

function enableRefreshBtn() {
    document.getElementById("refreshCalendarBtn").disabled = false; 
}


function dayClicked(clicked_id) {
    // send POST request with year, shop, and duty
    //alert('dayClicked entered ...')
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/getDayAssignments"); 
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.onreadystatechange = function() {
        //console.log('onreadystatechange')
        if (this.readyState == 4 && this.status == 200) {
            // PROCESS RESPONSE FROM REQUEST
            sched = JSON.parse(this.response)
            buildDayTable(sched)
            // cnt = sched[0].length + 1
            // msg = ''
            // for ( var y=1; y<cnt; y++ ) {
            //     DateScheduled = sched[y][0]
            //     AMPM = sched[y][1]
            //     Duty = sched[y][2]
            //     Name = sched[y][3]
            //     VillageID = sched[y][4]
            //     msg += (Name + ' ' + VillageID + '  ' + AMPM + ' ' + Duty) + '\r\n'
            // }
            // alert(msg)
        }
    }  // END OF xhttp
    // SEND REQUEST
    //alert('shopFilter- ' + shopFilter)
    if (shopFilter == 'BOTH') {
        alert("Please change to a specific shop location.")
        return
    }

    if (shopFilter == 'RA') {    
        shopNumber = '1'
    }
    else {
        shopNumber = '2'
    }
    //alert('... sending request ...')
    var data = {shopNumber:'1',dayID:clicked_id}; //send date selected to server;
    //console.log('... before send ...')
    xhttp.send(JSON.stringify(data));
    //alert('... after send ...')
         
}

function refreshCalendarRtn() {
    yearSelected = document.getElementById("yearToDisplay")
    shopSelected = document.getElementById("shopToDisplay")
    // dutySelected = document.getElementById("dutyToDisplay")
    yearFilter = yearSelected.value
    shopFilter = shopSelected.value
    // dutyFilter = dutySelected.value
    buildYear(yearFilter);
    populateCalendar(yearFilter,shopFilter)  //,dutyFilter)
    document.getElementById("refreshCalendarBtn").disabled = true;
    //populateNameList();
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
    //alert('Populate calendar')
    // send POST request with year, shop, and duty
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/index"); 
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.onreadystatechange = function() {
        //console.log('onreadystatechange')
        if (this.readyState == 4 && this.status == 200) {
            sched = JSON.parse(this.response)
            //alert('Received response ...')
            //console.log('... step through array ...')
            for ( var y=0; y<367; y++ ) {
                DateScheduled = sched[y][0]
                status = sched[y][1]
                dayNumber = sched[y][2]
                SM_ASGND = sched[y][3]
                TC_ASGND = sched[y][4]
                SM_AM_REQD = sched[y][5]
                SM_PM_REQD = sched[y][6]
                TC_AM_REQD = sched[y][7]
                TC_PM_REQD = sched[y][8]
                
                // BUILD DAY ID
                var dayID = "x" + DateScheduled
                SM_TO_FILL = (SM_AM_REQD + SM_PM_REQD) - SM_ASGND
                TC_TO_FILL = (TC_AM_REQD + TC_PM_REQD) - TC_ASGND 
                currentDate = new Date
                //alert('DateScheduled-' + DateScheduled.toString)
                //alert(typeof(DateScheduled))
                if (DateScheduled != 0) {
                    mo=DateScheduled.slice(4,6)
                    da=DateScheduled.slice(6,8)
                    yr=DateScheduled.slice(0,4)
                    mmddyy=mo + '-' + da + '-' + yr
                    yymmdd=(yr + '/' + mo + '/' + da)
                    //alert(yymmdd)
                    dateSched = new Date(yymmdd)
                    //alert('dateSched-' + dateSched.toString())
                }
                else {
                    dateSched = currentDate
                }

                //alert('current date -' + currentDate.toString())
                

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

function populateNameList() {
    console.log('{{nameList}}')
    var nameLst = '{{nameList | tojson}}';

    //var nameLst = {{ nameList | safe }};
    console.log(nameLst)
    nameArray = JSON.parse('{{nameList}}')
    console.log(nameArray)
    // alert({{nameList}})
    for ( var i=0; i < nameArray.length -1; i++ ) {
        alert(nameArray(i))
    }
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

function buildDayTable(sched) {
    // if swap-in-progress ... check for day2
    cnt = sched[0].length + 1
    //console.log('Length- ' + cnt.toString())
    //alert('Received response ...')
    // INSERT DATE INTO DAY 1 HEADING
    document.getElementById('day1Date').innerHTML = sched[1][0]
    msg = ''
    for ( var y=1; y<cnt; y++ ) {
        DateScheduled = sched[y][0]
        AMPM = sched[y][1]
        Duty = sched[y][2]
        Name = sched[y][3]
        VillageID = sched[y][4]
        msg += (Name + ' ' + VillageID + '  ' + AMPM + ' ' + Duty) + '\r\n'
    }
    alert(msg)
}

// $("#findMember").click(function() {
//     // toggle
//     $('.selectpicker').selectpicker('toggle');

//     // select by value
//     $('.selectpicker').selectpicker('val', 'Test');
//     $('.remove-example').selectpicker('refresh');
  
//     // change highlight
//     $('.dropdown-menu li').removeClass('active')
//   }); 

// function showFindMemberBtn() {
//      document.getElementById('selectPicker').style=display;
//  }
// $('#selectpicker').on('changed.bs.select', function (e) {
//     alert(this.value)
//   });

function memberSelectedRtn() {
    selectedMember = this.value
    document.getElementById('memberNameHdg').innerHTML = selectedMember
    lastEight = selectedMember.slice(-8)
    currentMemberID= lastEight.slice(1,7)
    populateMemberSchedule(currentMemberID)
}
  
function populateMemberSchedule(memberID) {
    //alert("Prepare monitor schedule for member with ID '" + memberID + "'; also retrieve last training date")
    // ajax request for last training date and monitor schedule for current year forward
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/getMemberSchedule"); 
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.onreadystatechange = function() {
        //console.log('onreadystatechange')
        if (this.readyState == 4 && this.status == 200) {
            // PROCESS RESPONSE
            sched = JSON.parse(this.response)
            numberOfElements = sched.length 
            //alert('Number - '+numberOfElements.toString)

            // IDENTIFY MEMBER SCHEDULE AS PARENT NODE
            var mbrSchedule = document.getElementById("memberSchedule-container")
            
            //  REMOVE CURRENT MEMBER SCHEDULE, IF ANY
            //var schedDtl1 = document.getElementByID('schedDtl1')
            if (schedDtl1) {
                schedDtl1.remove()
            }

            
            
            for ( var y=0; y<numberOfElements; y++ ) {
                console.log('y=' + y.toString)
                if (sched[y][0] == 0) {
                    break 
                }
                // IF FIRST RECORD INSERT DISPLAY NAME AND TRAINING DATE
                if (y == 1) {
                    document.getElementById('memberNameHdg').innerHTML = displayName
                    document.getElementById('lastMonitorTraining').value = trainingDate
                }
                // BUILD MEMBERS SCHEDULE
                memberIDfromArray = sched[y][0]
                console.log('ID= ' + memberIDfromArray)
                shopNumber = sched[y][1]
                displayName = sched[y][2]
                trainingDate = sched[y][3]
                dateScheduled = sched[y][4]
                dateScheduledFormatted = sched[y][5]
                shift = sched[y][6]
                duty = sched[y][7]
                noShow = sched[y][8]

                console.log(displayName, trainingDate, dateScheduled,shift,duty,noShow)
                //console.log('Location - ' + shopNumber.toString())
                locationName = shopNames[shopNumber - 1]
                //alert('Location - ' + locationName)

                // CREATE NEW schedDtl1 AS CHILD OF memberSchedule (new row)
                var schedDtl1 = document.createElement("schedDtl1")
                schedDtl1.id='schedDtl1'
                schedDtl1.classList.add('memberDetail')  
                
                //  date testing
                if (dateScheduled != 0) {
                    mo=dateScheduled.slice(4,6)
                    da=dateScheduled.slice(6,8)
                    yr=dateScheduled.slice(0,4)
                    mmddyy=mo + '-' + da + '-' + yr
                    yymmdd=(yr + '/' + mo + '/' + da)
                    //alert(yymmdd)
                    dateSched = new Date(yymmdd)
                }
                todaysDate = new Date()
                //dtSched = Date(dateScheduled)
                if (dateSched > todaysDate) {
                    schedDtl1.style.color="Red"   
                }
                else {
                schedDtl1.style.color="Green"
                }
                //  date testing

                mbrSchedule.appendChild(schedDtl1)

                var spanLocation = document.createElement("span")
                spanLocation.classList.add("memberSchedule")
                spanLocation.innerHTML = locationName
                schedDtl1.appendChild(spanLocation)
            
                var spanDateScheduled = document.createElement("span")
                spanDateScheduled.classList.add("memberSchedule")
                spanDateScheduled.innerHTML = dateScheduledFormatted
                schedDtl1.appendChild(spanDateScheduled)
            
                
                var spanShift = document.createElement("span")
                spanShift.classList.add("memberSchedule")
                spanShift.innerHTML = shift
                schedDtl1.appendChild(spanShift)

                var spanDuty = document.createElement("span")
                spanDuty.classList.add("memberSchedule")
                spanDuty.innerHTML = duty
                schedDtl1.appendChild(spanDuty)

                var spanNoShow = document.createElement("span")
                spanNoShow.classList.add("memberSchedule")
                spanNoShow.innerHTML = noShow
                schedDtl1.appendChild(spanNoShow)

                
                

                //  CREATE MEMBER SCHEDULE BEGINNING AT ELEMENT ....
                ////////////////////////
                // <div class=sLocDArea>Rolling Acres</div>
                // <div class=sDateDArea>Sat 9/5/20</div>
                // <div class=sDutyDArea>Shop Monitor</div>
                // <div class=sAMPMDArea>PM</div>
                // <div class=sNoShowDArea> </div>
                ////////////////////
                //document.getElementById('day1Date').innerHTML = sched[1][0]
                // APPEND ELEMENT ...
                // var td = document.createElement('td');
                // td.innerHTML = "SMTWTFS"[c];
                // tr.appendChild(td);
                //msg += (memberID,displayName,trainingDate,"\r\n", dateScheduled,AMPM,duty,noShow, '\r\n')
            }
            // END OF FOR LOOP  
            //alert(msg)

            }  // END OF READY STATE TEST
    }   // END IF READYSTATE ...
    var data = {memberID:memberID}; //send memberID selected to server;
    xhttp.send(JSON.stringify(data)); 
}   // END xhttp FUNCTION
