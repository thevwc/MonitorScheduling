
# routes.py

from flask import session, render_template, flash, redirect, url_for, request, jsonify, json, make_response
from flask_bootstrap import Bootstrap
from werkzeug.urls import url_parse
from app.models import ShopName, Member, MemberActivity, MonitorSchedule, MonitorScheduleTransaction,\
MonitorWeekNote, CoordinatorsSchedule, ControlVariables, MemberTransactions
from app import app
from app import db
from sqlalchemy import func, case, desc, extract, select, update, text
from sqlalchemy.exc import SQLAlchemyError, IntegrityError, DBAPIError

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

import datetime as dt
from datetime import date, datetime, timedelta
from pytz import timezone

from flask_mail import Mail, Message 
mail = Mail(app)

@app.route('/', methods=['GET','POST'])
@app.route('/index/',methods=['GET','POST'])
def index():
    # GET LOGIN DATA
    staffID = getStaffID()
    staffName = getStaffName()
    shopID = getShopID()
    
    if shopID == 'RA':
        shopNumber = 1
    else:
        if shopID == 'BW':
            shopNumber = 2
        else:
            msg = "The shopID of " + shopID + " is not valid; cannot continue."
            flash (msg,'danger')
   
    # GET STAFF PRIVILEDGES 
    staffMember = db.session.query(Member).filter(Member.Member_ID == staffID).first()
    if staffMember == None:
        msg = "No match for staffID " + staffID + "; cannot continue."
        flash(msg,"danger")
        return msg


    # GET POSITION OF USER - Staff, DBA, Manager
    # isDBA, isManager, isStaff are not boolean because we cannot pass boolean values to client???
    if (staffMember.DBA):
        isDBA = 'True'
    else:
        isDBA = 'False'

    if (staffMember.Manager):
        isManager = 'True'
    else:
        isManager = 'False'

    if (staffMember.Office_Staff):
        isStaff = 'True'
    else:
        isStaff = 'False'
    
    if (staffMember.Monitor_Coordinator):
        isCoordinator = 'True'
    else:
        isCoordinator = 'False'

    if (isDBA == 'False' and isManager == 'False' and isStaff == 'False') :
        msg = "This user is not authorized for this application."
        flash (msg,'danger')
        return msg               
    
    if (isDBA == 'True' or isManager == 'True' or isCoordinator == 'True'):
        canViewNotes = 'True'
    else:
        canViewNotes = 'False'

    # POST REQUEST
    if request.method == 'POST':
        if not request.get_json() == None:
            parameters = request.get_json()
            if parameters and 'villageID' in parameters:
                 villageID=parameters['villageID']
            else:
                villageID = None

            if parameters and 'year' in parameters:
                 yearFilter=parameters['year']
            else:
                #currentYear = datetime.date.year
                #yearFilter=currentYear
                yearFilter = db.session.query(ControlVariables.Year_To_Print).filter(ControlVariables.Shop_Number == 1).scalar()

            if parameters and 'shop' in parameters:
                shopFilter = parameters['shop']
            else:
                shopFilter = 'BOTH'
                shopNumber = 0
            
            # BUILD WHERE CLAUSE FOR RESPONSE OBJECT
            whereClause = "WHERE DatePart(year,[Date_Scheduled]) = '" + str(yearFilter) + "'" 
            if shopFilter == 'RA':
                whereClause += " and Shop_Number = 1"

            if shopFilter == 'BW':
                whereClause += " and Shop_Number = 2"
    
            # BUILD SQL SELECT STATEMENT SUMMARIZING ALL ASSIGNMENTS BY DATE
            SQLselect = "SELECT [Date_Scheduled], "
            SQLselect += " SUM(iif([Duty]='Shop Monitor',1,0)) AS SM_ASGND, "
            SQLselect += " SUM(iif([Duty]='Tool Crib',1,0)) AS TC_ASGND, "
            SQLselect += " DATEPART(Y,[Date_Scheduled]) AS dayNumber "
            SQLselect += " FROM tblMonitor_Schedule "
            
            # ADD WHERE CLAUSE
            SQLselect += whereClause
           
            # ADD GROUP BY CLAUSE
            SQLselect += " GROUP BY [Date_Scheduled] ORDER BY [Date_Scheduled]"

            # EXECUTE QUERY
            dataSet = db.engine.execute(SQLselect)

            # DECLARE ARRAY FOR DATASET AND INITIALIZE TO ZEROES
            rows = 367
            cols = 13 # Date_Scheduled, dayNumber, SM_ASGND, SM_REQD, TC_ASGND, TC_REQD
            requirements = [[0 for x in range(cols)] for y in range(rows)]
            
            # ADD tblMonitor_Schedule DATA TO 'requirements' ARRAY
            for d in dataSet:
                requirements[d.dayNumber][0] = d.Date_Scheduled.strftime("%Y%m%d")
                requirements[d.dayNumber] [1] = 'OPEN'
                requirements[d.dayNumber] [2] = d.dayNumber
                requirements[d.dayNumber][3] = d.SM_ASGND
                requirements[d.dayNumber][4] = d.TC_ASGND
            
            # BUILD WHERE CLAUSE FOR RESPONSE OBJECT
            whereClause = "WHERE DatePart(year,[MM_DD_YYYY]) = '" + str(yearFilter) + "'" 
            if shopFilter == 'RA':
                whereClause += " and Shop_Number = 1"
            else:
                if shopFilter == 'BW':
                    whereClause += " and Shop_Number = 2"
        
            # ADD tblShop_Dates DAILY REQUIREMENTS TO 'requirements' ARRAY
            # if shopFilter == 'BOTH' or shopFilter == 'RA':
            #     shopNumber = 1
            # else:
            #     shopNumber = 2

            # BOTH SHOPS ARE IN THE shopDates ARRAY
            SQLselect2 = "SELECT [Shop_Number],[MM_DD_YYYY], [Status],"
            SQLselect2 += " SM_AM_REQD, SM_PM_REQD, TC_AM_REQD, TC_PM_REQD, "
            SQLselect2 += " DATEPART(Y,[MM_DD_YYYY]) AS dayNumber "
            SQLselect2 += " FROM tblShop_Dates  "
            
            # ADD WHERE CLAUSE
            SQLselect2 += whereClause

            shopDates = db.engine.execute(SQLselect2)
            for s in shopDates:
                position = s.dayNumber
                requirements[position][0] = s.MM_DD_YYYY.strftime("%Y%m%d")
                requirements[position][1] = s.Status
                
                if s.Shop_Number == 1:
                    requirements[position][5] = s.SM_AM_REQD
                    requirements[position][6] = s.SM_PM_REQD
                    requirements[position][7] = s.TC_AM_REQD
                    requirements[position][8] = s.TC_PM_REQD
                if s.Shop_Number == 2:
                    requirements[position][9] = s.SM_AM_REQD
                    requirements[position][10] = s.SM_PM_REQD
                    requirements[position][11] = s.TC_AM_REQD
                    requirements[position][12] = s.TC_PM_REQD
            
            return jsonify(requirements)

        else:
            return 'No data available' 
        
    # GET REQUEST
    # BUILD ARRAY OF NAMES FOR DROPDOWN LIST OF MEMBERS
    nameArray=[]
    sqlSelect = "SELECT Last_Name, First_Name, Member_ID FROM tblMember_Data "
    sqlSelect += "ORDER BY Last_Name, First_Name "
    nameList = db.engine.execute(sqlSelect)
    position = 0
    for n in nameList:
        position += 1
        lastFirst = n.Last_Name + ', ' + n.First_Name + ' (' + n.Member_ID + ')'
        nameArray.append(lastFirst)
    
    # POPULATE MEMBER SECTION IF MEMBER IF SENT

    # GET MEMBER ID
    villageID = request.args.get('villageID')
    
    # GET MEMBER NAME
    displayName = ''
    if (villageID != None and villageID != ''):
        member = db.session.query(Member).filter(Member.Member_ID == villageID).first()
        if member:
            displayName = member.First_Name
            if member.NickName != '' and member.NickName != None:
                displayName += ' (' + member.NickName + ')'
            displayName += ' ' + member.Last_Name

    # GET CURRENT MONITOR YEAR
    thisYear = db.session.query(ControlVariables.monitorYear).filter(ControlVariables.Shop_Number == 1).scalar()
    lastYear = str(int(thisYear)-1)
    return render_template("index.html",nameList=nameArray,memberID=villageID,displayName=displayName,\
    staffName=staffName,shopID=shopID,thisYear=thisYear,lastYear=lastYear,canViewNotes=canViewNotes)
   

@app.route('/refreshCalendar', methods=['POST'])
def refreshCalendar():
    return ('refreshed by refreshCalendar endpoint')


@app.route('/getDayAssignments', methods=['GET','POST'])
def getDayAssignments():
    # POST REQUEST
    if request.method != 'POST':
        return "ERROR - Not a POST request."
    if request.get_json() == None:
        return "ERROR - Missing schedule date."
    
    parameters = request.get_json()
    if parameters == None:
        return "ERROR - Missing parameter."

    
    # RETRIEVE PARAMETERS FROM REQUEST
    shopNumber = parameters['shopNumber']
    if (shopNumber == None):
        return "ERROR - Missing shopNumber parameter."

    dayID = parameters['dayID']
    if (dayID == None):
        return "ERROR - Missing dayID parameter."

    # PARSE dayID TO GET DATE scheduleDate
    monthOfDate = dayID[5:7]
    dayOfDate = dayID[-2:]
    yearOfDate = dayID[1:5]
    scheduleDate = monthOfDate + '-' + dayOfDate + '-' + yearOfDate 
   
    schedDateToDisplay = datetime.strptime(scheduleDate,'%m-%d-%Y')
    dayNumber = (schedDateToDisplay - datetime(schedDateToDisplay.year,1,1)).days + 1
    
    # DECLARE ARRAY AND SET TO ZERO
    rows = 100
    cols = 8 # Date_Scheduled, AM_PM, Member name, Village ID
    schedArray = [[0 for x in range(cols)] for y in range(rows)]

    # BUILD WHERE CLAUSE
    if (shopNumber == '3'):
        sqlWhereClause = "WHERE Date_Scheduled = '" + scheduleDate + "' and No_Show = 0"
    else:
        sqlWhereClause = "WHERE Shop_Number = " + shopNumber + " and Date_Scheduled = '" + scheduleDate + "' and No_Show = 0"

    # BUILD ORDER BY CLAUSE
    sqlOrderBy = " ORDER BY AM_PM, Duty, Last_Name"   

    # BUILD SELECT CLAUSE         
    sqlSelect = "SELECT tblMonitor_Schedule.ID as RecordID, Shop_Number, tblMonitor_Schedule.Member_ID,"
    sqlSelect += " DatePart(Y,[Date_Scheduled]) as dayNumber, Date_Scheduled, AM_PM, Duty, Last_Name, First_Name FROM tblMonitor_Schedule "
    sqlSelect += " JOIN tblMember_Data ON tblMonitor_Schedule.Member_ID = tblMember_Data.Member_ID "
    
    # APPEND WHERE CLAUSE AND ORDER BY CLAUSES TO SELECT CLAUSE
    sqlSelect += sqlWhereClause
    sqlSelect += sqlOrderBy 

    schedule = db.engine.execute(sqlSelect)
    position = 0
    if (schedule == None):
        return 'NO DATA'

    # STORE SHOP NUMBER, DATE SCHEDULED, AND DAY NUMBER IN POSITION 0
    schedArray[0][0] = shopNumber
    schedArray[0][1] = schedDateToDisplay.strftime("%b %-d, %Y")
    schedArray[0][7] = dayNumber

    # BUILD ARRAY WITH ONE ASSIGNMENT PER ROW (POSITION)
    for s in schedule:
        position += 1
        schedArray[position][0] = s.Shop_Number
        schedArray[position][1] = s.Date_Scheduled.strftime("%b %-d, %Y")
        schedArray[position][2] = s.AM_PM
        schedArray[position][3] = s.Duty
        schedArray[position][4] = s.First_Name + " " + s.Last_Name
        schedArray[position][5] = s.Member_ID
        schedArray[position][6] = s.RecordID
        schedArray[position][7] = s.dayNumber
   
    return jsonify(schedArray)

@app.route('/getMemberSchedule', methods=['GET','POST'])
def getMemberSchedule():
    # POST REQUEST
    if request.method != 'POST':
        return "ERROR - Not a POST request."
    if request.get_json() == None:
        return "ERROR - Missing member number."
    parameters = request.get_json()

    if parameters == None:
        return "ERROR - Missing parameter."

    memberID = parameters['memberID']
    if (memberID == None):
        return "ERROR - Missing member ID parameter."

    scheduleYear = parameters['scheduleYear'] 
    if (scheduleYear == None or scheduleYear == ''):
        scheduleYear = db.session.query(ControlVariables.monitorYear).filter(ControlVariables.Shop_Number == 1).scalar()

    # RETRIEVE MEMBER NAME AND LAST TRAINING DATE
    # RETRIEVE MEMBER SCHEDULE FOR CURRENT YEAR AND FORWARD
    #est = timezone('EST')
    Today = date.today()
    
    # DECLARE ARRAY AND SET TO ZERO 
    rows = 100  # ARRAY LARGE ENOUGH FOR MULTIPLE YEARS
    cols = 12 # Date_Scheduled, AM_PM, Member name, Village ID
    schedArray = [[0 for x in range(cols)] for y in range(rows)]
   
   
    # GET NAME AND TRAINING DATE FROM MEMBER TABLE
    member = db.session.query(Member).filter(Member.Member_ID == memberID).first()
    if member != None:
        displayName = member.Last_Name + ', ' + member.First_Name + " (" + member.Member_ID + ")"
        
        schedArray[0][0] = memberID
        
        schedArray[0][2] = displayName
        if (member.Last_Monitor_Training != None):
            schedArray[0][3] = member.Last_Monitor_Training.strftime("%-m/%-d/%Y")
        else:
            schedArray[0][3] = ''

        if member.Requires_Tool_Crib_Duty:
            schedArray[0][11]='NEEDS TOOL CRIB DUTY'
        else:
            schedArray[0][11]='No restrictions'
        
    # ADD SCHEDULE TO ARRAY IF IT EXISTS
    sqlSelect = "SELECT tblMember_Data.Member_ID as memberID, "
    sqlSelect += "Last_Name + ', ' + First_Name + '  (' + tblMember_Data.Member_ID + ')' as displayName, "
    sqlSelect += "Last_Monitor_Training as trainingDate, tblMonitor_Schedule.Member_ID, Date_Scheduled, "
    sqlSelect += "AM_PM, Duty, No_Show, Shop_Number, tblMonitor_Schedule.ID as recordID, "
    sqlSelect += "Requires_Tool_Crib_Duty "
    sqlSelect += "FROM tblMember_Data "
    sqlSelect += "LEFT JOIN tblMonitor_Schedule ON tblMonitor_Schedule.Member_ID = tblMember_Data.Member_ID "
    sqlSelect += "WHERE tblMember_Data.Member_ID = '" + memberID + "' "
    sqlSelect += "and DatePart(year,[Date_Scheduled]) = '" + str(scheduleYear) + "' "
    sqlSelect += "ORDER BY Date_Scheduled"
    memberSchedule = db.engine.execute(sqlSelect)

    position = 0
    for ms in memberSchedule:
        if ms.Date_Scheduled != None:
            schedArray[position][0] = memberID
            schedArray[position][1] = ms.Shop_Number
            schedArray[position][4] = ms.Date_Scheduled.strftime("%Y%m%d")
            schedArray[position][5] = ms.Date_Scheduled.strftime("%a %-m/%-d/%y")
            schedArray[position][6] = ms.AM_PM
            schedArray[position][7] = ms.Duty
            schedArray[position][8] = ms.No_Show
        schedArray[position][9]=scheduleYear
        schedArray[position][10]=ms.recordID
        position += 1

    return jsonify(schedArray)
    

@app.route('/deleteMonitorAssignment', methods=['GET','POST'])
def deleteMonitorAssignment():
    # POST REQUEST
    if request.method != 'POST':
        return "ERROR - Not a POST request."
    if request.get_json() == None:
        return "ERROR - Missing record ID."
    parameters = request.get_json()
    if parameters == None:
        return "ERROR - Missing parameter."
    
    recordID = parameters['recordID']
    if recordID == None:
        return "ERROR - Missing recordID."
  

    # RETRIEVE RECORD TO BE DELETED
    assignment = db.session.query(MonitorSchedule).filter(MonitorSchedule.ID==recordID).first()
    if assignment == None:
        return "ERROR - Record does not exist."

    memberID=assignment.Member_ID
    dateScheduled=assignment.Date_Scheduled
    ampm=assignment.AM_PM
    duty=assignment.Duty
    shopNumber=assignment.Shop_Number
    if shopNumber == 1:
        shopInitials = 'RA'
    else:
        if shopNumber == 2:
            shopInitials = 'BW'
        else:
            shopInitials = ''

    # DELETE THE ASSIGNMENT VIA RAW SQL
    sqlDelete = "DELETE FROM tblMonitor_Schedule WHERE ID = " + recordID
    result = db.engine.execute(text(sqlDelete).execution_options(autocommit=True))
    if result == 0:
        return "ERROR - Delete of assignment failed."

    # ADD ENTRY TO MONITOR SCHEDULE TRANSACTION LOG
    response=LogMonitorScheduleTransaction('DELETE',memberID,dateScheduled,ampm,duty,shopNumber)
    if response == 0:
        return "ERROR - Could NOT log DELETE transaction."

    # ADD ENTRY TO MONITOR SCHEDULE NOTES
    mbr = db.session.query(Member).filter(Member.Member_ID == memberID).first()
    memberName = mbr.First_Name + ' ' + mbr.Last_Name + ' (' + memberID + ')'
    dateScheduledSTR = dateScheduled.strftime('%m-%d-%Y')
    actionDesc = "DELETE " + memberName + ' ' + dateScheduledSTR + ' ' + ampm + ' (' + shopInitials + ') ' + duty
    return (actionDesc) 
       
    
@app.route('/addMonitorAssignment', methods=['GET','POST'])
def addMonitorAssignment():
    
    # POST REQUEST
    if request.method != 'POST':
        return "ERROR - Not a POST request."
    if request.get_json() == None:
        return "ERROR - Missing record ID."
    parameters = request.get_json()
    if parameters == None:
        return "ERROR - Missing all parameters."
    memberID = parameters['memberID']
    if (memberID == None):
        return "ERROR - Missing member ID parameter."
    schedDate = parameters['schedDate']
    if (schedDate == None):
        return "ERROR - Missing schedDate parameter."
    Shift = parameters['Shift']
    if (Shift == None):
        return "ERROR - Missing shift parameter."
    shopNumber = parameters['shopNumber']
    if (shopNumber == None):
        return "ERROR - Missing shopNumber parameter."
    Duty = parameters['Duty']
    if (Duty == None):
        return "ERROR - Missing Duty parameter."
    

    #  DOES MEMBER HAVE ANOTHER ASSIGNMENT AT ANOTHER LOCATION FOR THIS TIME
    assignmentExists = db.session.query(MonitorSchedule)\
        .filter(MonitorSchedule.Member_ID == memberID)\
        .filter(MonitorSchedule.Date_Scheduled == schedDate)\
        .filter(MonitorSchedule.AM_PM == Shift)\
        .first()
    if assignmentExists:
        return 'ERROR - This member has another assignment \nat this time.'

    #  ADD VIA RAW SQL
    sqlInsert = "INSERT INTO tblMonitor_Schedule (Member_ID, Date_Scheduled, AM_PM, Shop_Number,Duty)"
    sqlInsert += " VALUES ('" + memberID + "', '" + schedDate + "', '" + Shift + "'"
    sqlInsert += ", " + str(shopNumber) + ", '" + Duty + "')"
    
    # ADD ASSIGNMENT TO tblMonitor_Schedule
    result = db.engine.execute(text(sqlInsert).execution_options(autocommit=True))
    if (result.rowcount == 0):
        return "ERROR - Assignment could NOT be added."

    # ADD ENTRY TO MONITOR SCHEDULE TRANSACTION LOG
    response=LogMonitorScheduleTransaction('ADD',memberID,schedDate,Shift,Duty,shopNumber)
    if response == 0:
        return "ERROR - Could NOT log transaction."

    return "SUCCESS - Assignment added."

@app.route('/swapMonitorAssignments', methods=['GET','POST'])
def swapMonitorAssignments():
    # POST REQUEST
    if request.method != 'POST':
        return "ERROR - Not a POST request."
    if request.get_json() == None:
        return "ERROR - Missing record ID."
    parameters = request.get_json()
    if parameters == None:
        return "ERROR - Missing all parameters."

    # GET DATA FOR FIRST ASSIGNMENT
    recordID1 = parameters['recordID1']
    if (recordID1 == None):
        return "ERROR - Missing record ID for first assignment."
    asgmnt1 = db.session.query(MonitorSchedule).filter(MonitorSchedule.ID == recordID1).first()
    if (asgmnt1 == None):
        return "ERROR - Invalid record ID for first assignment."
    memberID1 = asgmnt1.Member_ID
    schedDate1 = asgmnt1.Date_Scheduled
    schedDateSTR1 = schedDate1.strftime('%m-%d-%Y')
    dayOfWeek1 = schedDate1.weekday()
    weekOf1 = schedDate1 - timedelta(dayOfWeek1 + 1)
    shift1 = asgmnt1.AM_PM
    duty1 = asgmnt1.Duty
    
    if (asgmnt1.Shop_Number == 1):
        asgmnt1ShopNumber = 1
        asgmnt1ShopInitials = 'RA'
    else:
        asgmnt1ShopNumber = 2
        asgmnt1ShopInitials = 'BW'
    
    mbr1 = db.session.query(Member).filter(Member.Member_ID == memberID1).first()
    if (mbr1):
        memberName1 = mbr1.First_Name + ' ' + mbr1.Last_Name + ' (' + memberID1 + ')'   
    else:
        memberName1 = ''
   
    # GET DATA FOR SECOND ASSIGNMENT
    recordID2 = parameters['recordID2']
    if (recordID1 == None):
        return "ERROR - Missing record ID for first assignment."
    asgmnt2 = db.session.query(MonitorSchedule).filter(MonitorSchedule.ID == recordID2).first()
    if (asgmnt2 == None):
        return "ERROR - Invalid record ID for first assignment."
    memberID2 = asgmnt2.Member_ID
    schedDate2 = asgmnt2.Date_Scheduled
    schedDateSTR2 = schedDate2.strftime('%m-%d-%Y')
    dayOfWeek2 = schedDate2.weekday()
    weekOf2 = schedDate2 - timedelta(dayOfWeek2 + 1)
    shift2 = asgmnt2.AM_PM
    duty2 = asgmnt2.Duty
    
    if (asgmnt2.Shop_Number == 1):
        asgmnt2ShopNumber = 1
        asgmnt2ShopInitials = 'RA'
    else:
        asgmnt2ShopNumber = 2
        asgmnt2ShopInitials = 'BW'
    
    mbr2 = db.session.query(Member).filter(Member.Member_ID == memberID2).first()
    if (mbr2):
        memberName2 = mbr2.First_Name + ' ' + mbr2.Last_Name + ' (' + memberID2 + ')'   
    else:
        memberName2 = ''
   
    # CHECK FOR POTENTIAL CONFLICTS WITH EACH ASSIGNMENT
    if conflicts(memberID2,recordID2,schedDate1,shift1,duty1,duty2) > 0:
        msg = "ERROR - " + memberName2 + " has a conflict at "
        msg += schedDate1.strftime('%m-%d-%Y') + " " + shift1
        return msg
        
    if conflicts(memberID1,recordID1,schedDate2,shift2,duty1,duty2) > 0:
        msg = "ERROR  - " + memberName1 + " has a conflict at "
        msg += schedDate2.strftime('%m-%d-%Y') + " " + shift2
        return msg
    
    # MAKE SWAP VIA RAW SQL
    # SET MEMBER ID TO 999999 TEMPORARILY FOR recordID1 TO AVOID DUPLICATE KEY ERROR
    sqlUpdate1 = "UPDATE tblMonitor_Schedule SET Member_ID = " 
    sqlUpdate1 += "'" + '999999' + "' WHERE ID = " + recordID1
    result1 = db.engine.execute(text(sqlUpdate1).execution_options(autocommit=True))

    sqlUpdate2 = "UPDATE tblMonitor_Schedule SET Member_ID = " 
    sqlUpdate2 += "'" + memberID1 + "' WHERE ID = " + recordID2
    result2 = db.engine.execute(text(sqlUpdate2).execution_options(autocommit=True))

    # CHANGE 999999 to memberID2
    sqlUpdate1 = "UPDATE tblMonitor_Schedule SET Member_ID = " 
    sqlUpdate1 += "'" + memberID2 + "' WHERE ID = " + recordID1
    result1 = db.engine.execute(text(sqlUpdate1).execution_options(autocommit=True))

    # WAS SWAP SUCCESSFUL?
    if (result1.rowcount == '0') or (result2.rowcount == '0'):
        return "ERROR - Swap could NOT be completed."

    # WRITE TO MONITOR_SCHEDULE_TRANSACTIONS
    response=LogMonitorScheduleTransaction('RMV-SWP',memberID1,schedDate1,shift1,duty1,asgmnt1ShopNumber)
    if response == '0':
        return "ERROR - Could NOT log transaction."
    response=LogMonitorScheduleTransaction('RMV-SWP',memberID2,schedDate2,shift2,duty2,asgmnt2ShopNumber)
    if response == '0':
        return "ERROR - Could NOT log transaction."
    response=LogMonitorScheduleTransaction('ADD-SWP',memberID1,schedDate1,shift1,duty1,asgmnt1ShopNumber)
    if response == '0':
        return "ERROR - Could NOT log transaction."
    response=LogMonitorScheduleTransaction('ADD-SWP',memberID2,schedDate2,shift2,duty2,asgmnt2ShopNumber)
    if response == '0':
            return "ERROR - Could NOT log transaction."
                
    #WRITE TO MONITOR_WEEK_NOTES
    actionDesc = "SWAP " + memberName1 + ' ' + schedDateSTR1 + ' ' + shift1 + ' (' + asgmnt1ShopInitials + ') ' + duty1\
        + ' WITH ' + memberName2 + ' ' + schedDateSTR2 + ' ' + shift2 + ' (' + asgmnt2ShopInitials + ') ' + duty2
    return actionDesc


@app.route('/moveMonitorAssignment', methods=['GET','POST'])
def moveMonitorAssignment():
    # POST REQUEST
    if request.method != 'POST':
        return "ERROR - Not a POST request."
    if request.get_json() == None:
        return "ERROR - Missing record ID."
    parameters = request.get_json()
    if parameters == None:
        return "ERROR - Missing all parameters."
    curRecordID = parameters['recordID']
    if (curRecordID == None):
        return "ERROR - Missing recordID parameter."

    newSchedDate = parameters['schedDate']
    if (newSchedDate == None):
        return "ERROR - Missing newSchedDate1 parameter."
    newSchedDateDAT = datetime.strptime(newSchedDate,'%Y%m%d')
    newSchedDateSTR = newSchedDateDAT.strftime('%m-%d-%Y')
    
    newShift = parameters['shift']
    if (newShift == None):
        return "ERROR - Missing shift parameter."
   
    newDuty = parameters['duty']
    if (newDuty == None):
        return "ERROR - Missing duty parameter."

    newShopNumber = parameters['shopNumber']
    if (newShopNumber == None):
        return "ERROR - Missing shop number parameter"

    if (newShopNumber == 1):
        newShopInitials = 'RA'
    else:
        newShopInitials = 'BW'

    memberID = parameters['memberID']
    if (memberID == None):
        return "ERROR - Missing memberID parameter."
    
    # RETRIEVE CURRENT ASSIGNMENT RECORD
    curScheduleRecord = db.session.query(MonitorSchedule).filter(MonitorSchedule.ID == curRecordID).first()
    if (curScheduleRecord) :
        curSchedDate = curScheduleRecord.Date_Scheduled
       # curSchedDateDAT = datetime.strptime(curSchedDate,'%Y%m%d')
        curSchedDateSTR = curSchedDate.strftime('%m-%d-%Y')
        curShift = curScheduleRecord.AM_PM
        curDuty = curScheduleRecord.Duty
        curShopNumber = curScheduleRecord.Shop_Number
        if (curShopNumber == 1):
            curShopInitials = 'RA'
        else:
            curShopInitials = 'BW'

    else:
        return "ERROR - Missing assignment record memberID." 
    
    # GET MEMBER'S NAME
    member = db.session.query(Member).filter(Member.Member_ID == memberID).first()
    if (member):
        memberName = member.First_Name + ' ' + member.Last_Name + ' (' + memberID + ')'     
    else:
        memberName = ''

    # CHECK FOR POTENTIAL CONFLICTS WITH EACH ASSIGNMENT
    if conflicts(memberID,curRecordID,newSchedDateDAT,newShift,curDuty,newDuty) > 0:
        msg = "ERROR - " + memberName + " has a conflict at "
        msg += newSchedDate.strftime('%m-%d-%Y') + " " + newShift
        return msg
            

     # DELETE SECOND ASSIGNMENT
    sqlDelete = "DELETE FROM tblMonitor_Schedule WHERE ID = " + curRecordID
    result = db.engine.execute(text(sqlDelete).execution_options(autocommit=True))
    if result == 0:
        return "ERROR - Delete of assignment failed."

    #  ADD ASSIGNMENT TO tblMonitor_Schedule VIA RAW SQL
    sqlInsert = "INSERT INTO tblMonitor_Schedule (Member_ID, Date_Scheduled, AM_PM, Shop_Number,Duty)"
    sqlInsert += " VALUES ('" + memberID + "', '" + newSchedDateSTR + "', '" + newShift + "'"
    sqlInsert += ", " + str(newShopNumber) + ", '" + newDuty + "')"
    result = db.engine.execute(text(sqlInsert).execution_options(autocommit=True))
    if (result.rowcount > 0):
        insertCompleted = True
    else:
        insertCompleted = False 
        return "ERROR - Assignment could NOT be added."

   

    #  WRITE TO MONITOR_SCHEDULE_TRANSACTIONS
    response=LogMonitorScheduleTransaction('RMV-MV',memberID,curSchedDate,curShift,curDuty,curShopNumber)
    if response == '0':
        return "ERROR - Could NOT log transaction."
    response=LogMonitorScheduleTransaction('ADD-MV',memberID,newSchedDate,newShift,newDuty,newShopNumber)
    if response == '0':
        return "ERROR - Could NOT log transaction."
    
    # WRITE TO MONITOR_WEEK_NOTES
    actionDesc = "MOVE " + memberName + ' ' + curSchedDateSTR + ' ' + curShift + ' ' + curDuty + ' ' + curShopInitials\
    + ' TO ' + newSchedDateSTR + ' ' + newShift + ' ' + newDuty + ' ' + newShopInitials
    return actionDesc

    
def conflicts(memberID,recordID,dateScheduled,shift,duty1,duty2):
    # memberID of member to check for conflict
    # recordID of members current assignment (to be excluded from comparison)
    # dateScheduled - date to be assigned
    # shift - shift to be assigned
    # duty1 - duty to be assigned
    # duty2 - current duty assigned
  
    # CONVERT DATETIME FIELD TO STRING
    dtSched = dateScheduled.strftime('%Y-%m-%d')

    # SEARCH FOR OTHER ASSIGNMENTS AT THIS TIME
    assignmentCount = db.session.query(func.count(MonitorSchedule.Member_ID))\
        .filter(MonitorSchedule.Member_ID==memberID)\
        .filter(MonitorSchedule.Date_Scheduled==dtSched)\
        .filter(MonitorSchedule.ID != recordID)\
        .filter(MonitorSchedule.AM_PM==shift).scalar()

    # temp - show assignments
    assignments = db.session.query(MonitorSchedule)\
        .filter(MonitorSchedule.Member_ID==memberID)\
        .filter(MonitorSchedule.Date_Scheduled==dtSched)\
        .filter(MonitorSchedule.ID != recordID)\
        .filter(MonitorSchedule.AM_PM==shift).all()
    for a in assignments:
        print (a.Member_ID,a.Date_Scheduled,a.ID,a.AM_PM,a.Duty)
  
    return assignmentCount 
    
def LogMonitorScheduleTransaction(transactionType,memberID,dateScheduled,shift,duty,shopNumber):
    # VALID TRANSACTION TYPES ARE ADD, ADD-MV, ADD-SWP, DELETE, DELETE NS, RMV-MV, RMV-SWP
    est = timezone('EST')
    transactionDate = datetime.now(est)
    strTransactionDate = transactionDate.strftime('%Y-%m-%d %I:%M %p')
    
    # CREATE A DATE VAR AND A STR VAR OF THE dateScheduled PASSED IN
    if (isinstance(dateScheduled, str)):
        strDateScheduled = dateScheduled
        datDateScheduled = datetime.strptime(dateScheduled,'%Y%m%d')
    else:
        strDateScheduled = dateScheduled.strftime('%m-%d-%Y')
        datDateScheduled = dateScheduled 

    # CALCULATE DATE FOR START OF WEEK CONTAINING dateScheduled
    dayOfWeek = datDateScheduled.weekday()
    weekOf = datDateScheduled - timedelta(dayOfWeek + 1)
    strWeekOf = weekOf.strftime('%m-%d-%Y')
    staffID = getStaffID()

    # BUILD THE SQL INSERT STATEMENT FOR POSTING TO THE MONITOR SCHEDULE TRANSACTION TABLE
    sqlInsert = "INSERT INTO tblMonitor_Schedule_Transactions (Transaction_Date,WeekOf,Staff_ID,"
    sqlInsert += "Member_ID,Transaction_Type,Date_Scheduled, AM_PM,Duty,ShopNumber) VALUES("
    sqlInsert += "'" + strTransactionDate +"','"  + strWeekOf + "','" + staffID + "','" + memberID 
    sqlInsert += "','" + transactionType + "','" + strDateScheduled + "','" + shift 
    sqlInsert += "','" + duty + "'," + str(shopNumber) + ")"

    try:
        result = db.engine.execute(text(sqlInsert).execution_options(autocommit=True))
    except (SQLAlchemyError, DBAPIError) as e:
        print("ERROR -",e)
        return 0

    return result.rowcount

@app.route('/logMonitorScheduleNote', methods=['GET','POST'])
def logMonitorScheduleNote():
    # GET STAFF ID
    staffID = getStaffID()

    # POST REQUEST
    if request.method != 'POST':
        return "ERROR - Not a POST request."
    if request.get_json() == None:
        return "ERROR - Missing parameters."
    parameters = request.get_json()
    if parameters == None:
        return "ERROR - Missing all parameters."
   
    actionDesc = parameters['actionDesc']
    
    if actionDesc == None:
        return "ERROR - Missing actionDesc."
    
    reasonDesc = parameters['reasonDesc']
    if reasonDesc == None:
        return "ERROR - Missing reasonDesc."
    
    asgmnt1Date = parameters['asgmnt1Date']
    asgmnt2Date = parameters['asgmnt2Date']
   
    asgmnt1ShopNumber = parameters['asgmnt1ShopNumber']
    asgmnt2ShopNumber = parameters['asgmnt2ShopNumber']
   
    if (asgmnt1ShopNumber != asgmnt2ShopNumber):
        BOTH = True
    else:
        BOTH = False

    note = actionDesc + '\n' + reasonDesc
    
    if actionDesc[0:4] == 'SWAP' or actionDesc[0:4] == 'MOVE':
        swapDate1DAT = datetime.strptime(asgmnt1Date,'%Y%m%d')
        dayOfWeek1 = swapDate1DAT.weekday()
        weekOf1 = swapDate1DAT - timedelta(dayOfWeek1 + 1)
        weekOf1STR = weekOf1.strftime('%m-%d-%Y')
        
        swapDate2DAT = datetime.strptime(asgmnt2Date,'%Y%m%d')
        dayOfWeek2 = swapDate2DAT.weekday()
        weekOf2 = swapDate2DAT - timedelta(dayOfWeek2 + 1)
        weekOf2STR = weekOf2.strftime('%m-%d-%Y')

    if actionDesc[0:4] == 'DELE':
        deleteAsgmntDtDAT = datetime.strptime(asgmnt1Date,'%Y%m%d')
        dayOfWeek1 = deleteAsgmntDtDAT.weekday()
        weekOf1 = deleteAsgmntDtDAT - timedelta(dayOfWeek1 + 1)
        weekOf1STR = weekOf1.strftime('%m-%d-%Y')
      
    #est = timezone('EST')
    today=date.today()
    todaySTR = today.strftime('%m-%d-%Y')
    
    #  ALL TRANSACTIONS GET ONE NOTE (DELETE, SWAP, MOVE)
    try:
        sqlInsert1 = "INSERT INTO monitorWeekNotes (Author_ID, Date_Of_Change,Schedule_Note,WeekOf,Shop_Number) "
        sqlInsert1 += " VALUES ('" + staffID + "','" + todaySTR + "','" + note + "','" + weekOf1STR + "'," + str(asgmnt1ShopNumber) + ")"
        result1 = db.engine.execute(sqlInsert1)
        if (result1.rowcount == 0):
            return "ERROR - Assignment could NOT be added to monitorWeekNotes."
    except (SQLAlchemyError, DBAPIError) as e:
        print("ERROR - ",e)
        return 0

    # IF BOTH LOCATIONS ARE INVOLVED THEN CREATE A SECOND RECORD FOR THE SECOND LOCATION
    if (BOTH):
        shopNumber = 2
        try:
            sqlInsert1 = "INSERT INTO monitorWeekNotes (Author_ID, Date_Of_Change,Schedule_Note,WeekOf,Shop_Number) "
            sqlInsert1 += " VALUES ('" + staffID + "','" + todaySTR + "','" + note + "','" + weekOf1STR + "'," + str(asgmnt2ShopNumber) + ")"
           
            result1 = db.engine.execute(sqlInsert1)
            if (result1.rowcount == 0):
                return "ERROR - Assignment could NOT be added to monitorWeekNotes."
        except (SQLAlchemyError, DBAPIError) as e:
            print("ERROR - ",e)
            return 0


    if actionDesc[0:4] == "DELE":
        return "SUCCESS - DELETE COMPLETED"

    # IF A SWAP OR MOVE IS BETWEEN TWO WEEKS, INSERT A COPY OF THE NOTE FOR THE SECOND WEEK DATE
    if actionDesc[0:4] != 'DELE' and weekOf1 != weekOf2:
        try:
            sqlInsert2 = "INSERT INTO monitorWeekNotes (Author_ID, Date_Of_Change,Schedule_Note,WeekOf,Shop_Number) "
            sqlInsert2 += " VALUES ('" + staffID + "','" + todaySTR + "','" + note + "','" + weekOf2STR + "'," + asgmnt1ShopNumber + ")"
           
            result2 = db.engine.execute(text(sqlInsert2).execution_options(autocommit=True))
            if (result2.rowcount == 0):
                return "ERROR - Assignment could NOT be added to monitorWeekNotes."
        except (SQLAlchemyError, DBAPIError) as e:
            print("ERROR - ",e)
            return 0

        if (BOTH):
            try:
                sqlInsert2 = "INSERT INTO monitorWeekNotes (Author_ID, Date_Of_Change,Schedule_Note,WeekOf,Shop_Number) "
                sqlInsert2 += " VALUES ('" + staffID + "','" + todaySTR + "','" + note + "','" + weekOf2STR + "'," + asgmnt2ShopNumber + ")"
                result2 = db.engine.execute(text(sqlInsert2).execution_options(autocommit=True))
                if (result2.rowcount == 0):
                    return "ERROR - Assignment could NOT be added to monitorWeekNotes."
            except (SQLAlchemyError, DBAPIError) as e:
                print("ERROR - ",e)
                return 0
                    
    return "SUCCESS - SWAP transaction completed."

@app.route('/getMonitorWeekNotes', methods=['GET','POST'])
def getMonitorWeekNotes():
    # POST REQUEST
    if request.method != 'POST':
        return "ERROR - Not a POST request."
    if request.get_json() == None:
        return "ERROR - Missing member number."
    parameters = request.get_json()

    if parameters == None:
        return "ERROR - Missing parameter."

    dateScheduled = parameters['dateScheduled']
    if (dateScheduled == None or dateScheduled == ''):
        return "ERROR - Missing dateScheduled parameter."

    shopNumber= parameters['shopNumber']
    if (shopNumber == None):
        return "ERROR - Missing shopNumber parameter."

    #  DETERMINE START OF WEEK DATE
    #  CONVERT TO DATE TYPE
    dateScheduledDat = datetime.strptime(dateScheduled,'%Y%m%d')
    dayOfWeek = dateScheduledDat.weekday()
    weekOf = dateScheduledDat - timedelta(dayOfWeek + 1)
    strWeekOf = weekOf.strftime('%Y-%m-%d')

    # GET COORDINATOR ID FROM COORDINATOR TABLE
    coordinatorRecord = db.session.query(CoordinatorsSchedule)\
        .filter(CoordinatorsSchedule.Start_Date==strWeekOf)\
        .filter(CoordinatorsSchedule.Shop_Number==shopNumber).first()
    if coordinatorRecord == None:
        coordinatorsName = 'Not Assigned'
    else:
        # LOOK UP COORDINATORS NAME
        coordinatorID = coordinatorRecord.Coordinator_ID
        memberRecord = db.session.query(Member).filter(Member.Member_ID==coordinatorID).first()
        if memberRecord == None:
            coordinatorsName = '(' + str(coordinatorID) + ')'
        else:
            coordinatorsName = memberRecord.First_Name + ' ' + memberRecord.Last_Name + ' (' + str(coordinatorID) + ')'

    shopRecord = db.session.query(ShopName).filter(ShopName.Shop_Number==shopNumber).first()
    shopName = shopRecord.Shop_Name
    shopInitials = shopRecord.Shop_Abbr

    # RETRIEVE MONITOR SHOP NOTES FOR SPECIFIC WEEK AND SHOP NUMBER
    notes = db.session.query(MonitorWeekNote)\
        .filter(MonitorWeekNote.WeekOf==weekOf)\
        .filter(MonitorWeekNote.Shop_Number==shopNumber).all()

    # BUILD LIST OF NOTES WITH COORDINATORS NAME AND SHOP NAME
    # DECLARE ARRAY AND SET TO ZERO 
    rows = 100  # ARRAY LARGE ENOUGH FOR MULTIPLE YEARS
    cols = 6    # coordinators name and id, shop name, start date of week, and note
    noteArray = [[0 for x in range(cols)] for y in range(rows)]
    position = 0
    for n in notes:
        noteArray[position][0] = weekOf.strftime('%m-%d-%Y')
        noteArray[position][1] = shopName
        noteArray[position][2] = coordinatorsName
        noteArray[position][3] = n.Date_Of_Change.strftime('%m/%d/%y')
        noteArray[position][4] = n.Schedule_Note
        initials = db.session.query(Member.Initials).filter(Member.Member_ID==n.Author_ID).first()
        noteArray[position][5] = initials
       
        position += 1
    
    return jsonify(noteArray)

# ROUTINE TO PASS MONTHS IN VILLAGES, MEMBER NOTES, CERTIFICATION TO MEMBER DATA MODAL FORM
@app.route('/getMemberModalData', methods=['GET','POST'])
def getMemberModalData():
    # POST REQUEST
    if request.method != 'POST':
        return "ERROR - Not a POST request."
    if request.get_json() == None:
        return "ERROR - Missing member number."
    parameters = request.get_json()
    
    memberID = parameters['memberID']
    if memberID == None:
        return "ERROR - Missing memberID."
    
    member = db.session.query(Member).filter(Member.Member_ID==memberID).first()
    if member == None:
        print('No record found')
        return
    cols = 19
    dataArray = [0 for x in range(cols)]

    dataArray[0] = memberID

    dataArray[1] = member.Jan_resident
    dataArray[2] = member.Feb_resident
    dataArray[3] = member.Mar_resident
    dataArray[4] = member.Apr_resident
    dataArray[5] = member.May_resident
    dataArray[6] = member.Jun_resident
    dataArray[7] = member.Jul_resident
    dataArray[8] = member.Aug_resident
    dataArray[9] = member.Sep_resident
    dataArray[10] = member.Oct_resident
    dataArray[11] = member.Nov_resident
    dataArray[12] = member.Dec_resident
    dataArray[13] = member.Certified
    dataArray[14] = member.Certified_2

    if (member.Last_Monitor_Training != None and member.Last_Monitor_Training != ''):
        dataArray[15] = member.Last_Monitor_Training.strftime("%Y-%m-%d")
    else:
        dataArray[15] = ''

    dataArray[16] = member.Requires_Tool_Crib_Duty 
    # if (member.Requires_Tool_Crib_Duty):
    #     dataArray[16] = 'True'
    # else:
    #     dataArray[16] = 'False'

    dataArray[17] = member.Monitor_Duty_Notes
    dataArray[18] = member.Member_Notes
    
    return jsonify(dataArray)


# ROUTINE TO UPDATE MEMBER DATA FROM MODAL FORM
@app.route('/updateMemberModalData', methods=['GET','POST'])
def updateMemberModalData():
    staffID = getStaffID()
    staffRecord = db.session.query(Member).filter(Member.Member_ID == staffID).first()
    isDBA = False
    isManager = False
    if staffRecord:
        isDBA = staffRecord.DBA
        isManager = staffRecord.Manager
    if isDBA or isManager:
        isAuthorized = True
    else:
        isAuthorized = False

    # POST REQUEST
    if request.method != 'POST':
        return "ERROR - Not a POST request."
    if request.get_json() == None:
        return "ERROR - Missing member number."
    parameters = request.get_json()
   
    lastTraining = parameters['lastTraining']
    if lastTraining == None:
        return "ERROR - Missing lastTraining."

    memberID = parameters['memberID']
    
    if memberID == None:
        return "ERROR - Missing memberID."
    
    needsToolCrib = parameters["needsToolCrib"]

    monitorNotes = parameters['monitorNotes']
    if monitorNotes == None:
        return "ERROR - Missing monitorNotes."

    memberNotes = parameters['memberNotes']
    if memberNotes == None:
        return "ERROR - Missing memberNotes."

    jan = parameters['jan']
    
    if jan == None:
        return "ERROR - Missing jan."
    feb = parameters['feb']
    if feb == None:
        return "ERROR - Missing feb."
    mar = parameters['mar']
    if mar == None:
        return "ERROR - Missing mar."
    apr = parameters['apr']
    if apr == None:
        return "ERROR - Missing apr."
    may = parameters['may']
    if may == None:
        return "ERROR - Missing may."
    jun = parameters['jun']
    if jun == None:
        return "ERROR - Missing jun."
    jul = parameters['jul']
    if jul == None:
        return "ERROR - Missing jul."
    aug = parameters['aug']
    if aug == None:
        return "ERROR - Missing aug."
    sep = parameters['sep']
    if sep == None:
        return "ERROR - Missing sep."
    oct = parameters['oct']
    if oct == None:
        return "ERROR - Missing oct."
    nov = parameters['nov']
    if nov == None:
        return "ERROR - Missing nov."
    dec = parameters['dec']
    if dec == None:
        return "ERROR - Missing dec."

    
    member = db.session.query(Member).filter(Member.Member_ID==memberID).first()
    if member == None:
        return "ERROR - Member ID " + memberID + " could not be found in the database."
    # SET fieldsChanged TO ZERO 
    fieldsChanged = 0

    # UPDATE MEMBER RECORD
    if lastTraining != member.Last_Monitor_Training:
        logChange('Last Monitor Training',memberID,lastTraining,member.Last_Monitor_Training)
        member.Last_Monitor_Training = lastTraining
        fieldsChanged += 1
   
    if member.Requires_Tool_Crib_Duty != needsToolCrib:
        logChange('Requires TC Duty',memberID,needsToolCrib,member.Requires_Tool_Crib_Duty)
        member.Requires_Tool_Crib_Duty = needsToolCrib
        fieldsChanged += 1
  
    if isAuthorized:
        if member.Monitor_Duty_Notes != monitorNotes:
            logChange('Monitor Duty Notes',memberID,monitorNotes,member.Monitor_Duty_Notes)
            member.Monitor_Duty_Notes = monitorNotes
            fieldsChanged += 1
   
    if member.Member_Notes != memberNotes:
        logChange('Member Notes',memberID,memberNotes,member.Member_Notes)
        member.Member_Notes = memberNotes
        fieldsChanged += 1
    

    if member.Jan_resident != jan:
        logChange('Jan',memberID,jan,member.Jan_resident)
        member.Jan_resident = jan
        fieldsChanged += 1

    if member.Feb_resident != feb:
        logChange('Feb',memberID,feb,member.Feb_resident)
        member.Feb_resident = feb
        fieldsChanged += 1

    if member.Mar_resident != mar:
        logChange('Mar',memberID,mar,member.Mar_resident)
        member.Mar_resident = mar
        fieldsChanged += 1

    if member.Apr_resident != apr:
        logChange('Apr',memberID,apr,member.Apr_resident)
        member.Apr_resident = apr
        fieldsChanged += 1

    if member.May_resident != may:
        logChange('May',memberID,may,member.May_resident)
        member.May_resident = may
        fieldsChanged += 1

    if member.Jun_resident != jun:
        logChange('Jun',memberID,jun,member.Jun_resident)
        member.Jun_resident = jun
        fieldsChanged += 1

    if member.Jul_resident != jul:
        logChange('Jul',memberID,jul,member.Jul_resident)
        member.Jul_resident = jul
        fieldsChanged += 1

    if member.Aug_resident != aug:
        logChange('Aug',memberID,aug,member.Aug_resident)
        member.Aug_resident = aug
        fieldsChanged += 1

    if member.Sep_resident != sep:
        logChange('Sep',memberID,sep,member.Sep_resident)
        member.Sep_resident = sep
        fieldsChanged += 1

    if member.Oct_resident != oct:
        logChange('Oct',memberID,oct,member.Oct_resident)
        member.Oct_resident = oct
        fieldsChanged += 1

    if member.Nov_resident != nov:
        logChange('Nov',memberID,nov,member.Nov_resident)
        member.Nov_resident = nov
        fieldsChanged += 1

    if member.Dec_resident != dec:
        logChange('Dec',memberID,dec,member.Dec_resident)
        member.Dec_resident = dec
        fieldsChanged += 1

    try:
        db.session.commit()
        msg = 'SUCCESS - Data has been saved.'
        return (msg)
    except (SQLAlchemyError, DBAPIError) as e:      
            db.session.rollback()
            print("ERROR - ",e)   
            return "ERROR - Save has failed."



# PRINT MEMBER MONITOR DUTY SCHEDULE
@app.route("/printMemberSchedule/<string:memberID>/", methods=['GET','POST'])
def printMemberSchedule(memberID):
    # GET MEMBER NAME
    member = db.session.query(Member).filter(Member.Member_ID== memberID).first()
    displayName = member.First_Name + ' ' + member.Last_Name
    lastTraining = member.Last_Monitor_Training

    # RETRIEVE LAST_ACCEPTABLE_TRAINING_DATE FROM tblControl_Variables
    lastAcceptableTrainingDate = db.session.query(ControlVariables.Last_Acceptable_Monitor_Training_Date).filter(ControlVariables.Shop_Number == '1').scalar()
    if lastTraining == None:
        needsTraining = 'TRAINING IS NEEDED'
    else:
        if (lastTraining < lastAcceptableTrainingDate):
            needsTraining = 'TRAINING IS NEEDED'
        else:
            needsTraining = ''

    # RETRIEVE MEMBER SCHEDULE FOR CURRENT YEAR AND FORWARD
    #est = timezone('EST')
    todays_date = date.today()
    currentYear = todays_date.year
    beginDateDAT = datetime(todays_date.year,1,1)
    todays_dateSTR = todays_date.strftime('%m-%d-%Y')
    beginDateSTR = beginDateDAT.strftime('%m-%d-%Y')
    
    # BUILD SELECT STATEMENT TO RETRIEVE MEMBERS SCHEDULE FOR CURRENT YEAR FORWARD
    sqlSelect = "SELECT tblMember_Data.Member_ID as memberID, "
    sqlSelect += "First_Name + ' ' + Last_Name as displayName, tblShop_Names.Shop_Name, "
    sqlSelect += "Last_Monitor_Training as trainingDate, tblMonitor_Schedule.Member_ID, "
    sqlSelect += " format(Date_Scheduled,'MMM d, yyyy') as DateScheduled, AM_PM, Duty, No_Show, tblMonitor_Schedule.Shop_Number "
    sqlSelect += "FROM tblMember_Data "
    sqlSelect += "LEFT JOIN tblMonitor_Schedule ON tblMonitor_Schedule.Member_ID = tblMember_Data.Member_ID "
    sqlSelect += "LEFT JOIN tblShop_Names ON tblMonitor_Schedule.Shop_Number = tblShop_Names.Shop_Number "
    sqlSelect += "WHERE tblMember_Data.Member_ID = '" + memberID + "' and Date_Scheduled >= '"
    sqlSelect += beginDateSTR + "' ORDER BY Date_Scheduled, AM_PM, Duty"

    try:
        schedule = db.engine.execute(sqlSelect)
    # check for OperationalError ??
    except (SQLAlchemyError, DBAPIError) as e:
        print("ERROR -",e)
        flash("ERROR - Can't access database.")

    return render_template("rptMemberSchedule.html",displayName=displayName,needsTraining=needsTraining,\
    schedule=schedule,todays_date=todays_dateSTR)


# PRINT MEMBER MONITOR DUTY SCHEDULE
@app.route("/emailMemberSchedule", methods=['GET','POST'])
def emailMemberSchedule():
  
    # GET CURRENT MONITOR YEAR
    monitorYear = db.session.query(ControlVariables.monitorYear).filter(ControlVariables.Shop_Number == 1).scalar()

    # GET MEMBER NAME
    memberID = request.args.get('memberID')
    member = db.session.query(Member).filter(Member.Member_ID== memberID).first()
    displayName = member.First_Name + ' ' + member.Last_Name
    lastTraining = member.Last_Monitor_Training

    # RETRIEVE LAST_ACCEPTABLE_TRAINING_DATE FROM tblControl_Variables
    lastAcceptableTrainingDate = db.session.query(ControlVariables.Last_Acceptable_Monitor_Training_Date).filter(ControlVariables.Shop_Number == '1').scalar()
    if lastTraining == None:
        needsTraining = 'TRAINING IS NEEDED'
    else:
        if (lastTraining < lastAcceptableTrainingDate):
            needsTraining = 'TRAINING IS NEEDED'
        else:
            needsTraining = ''

    # RETRIEVE MEMBER SCHEDULE FOR CURRENT YEAR AND FORWARD
    #est = timezone('EST')
    todays_date = date.today()
    currentYear = todays_date.year
    #beginDateDAT = datetime(todays_date.year,1,1)
    beginDateDAT = datetime(int(monitorYear),1,1)
    todays_dateSTR = todays_date.strftime('%m-%d-%Y')
    beginDateSTR = beginDateDAT.strftime('%m-%d-%Y')
    
    # BUILD SELECT STATEMENT TO RETRIEVE MEMBERS SCHEDULE FOR CURRENT YEAR FORWARD
    sqlSelect = "SELECT tblMember_Data.Member_ID as memberID, "
    sqlSelect += "First_Name + ' ' + Last_Name as displayName, tblShop_Names.Shop_Name, "
    sqlSelect += "tblMember_Data.[E-Mail] as emailAddress, "
    sqlSelect += "Last_Monitor_Training as trainingDate, tblMonitor_Schedule.Member_ID, "
    sqlSelect += " format(Date_Scheduled,'MMM d, yyyy') as DateScheduled, AM_PM, Duty, No_Show, tblMonitor_Schedule.Shop_Number "
    sqlSelect += "FROM tblMember_Data "
    sqlSelect += "LEFT JOIN tblMonitor_Schedule ON tblMonitor_Schedule.Member_ID = tblMember_Data.Member_ID "
    sqlSelect += "LEFT JOIN tblShop_Names ON tblMonitor_Schedule.Shop_Number = tblShop_Names.Shop_Number "
    sqlSelect += "WHERE tblMember_Data.Member_ID = '" + memberID + "' and Date_Scheduled >= '"
    sqlSelect += beginDateSTR + "' ORDER BY Date_Scheduled, AM_PM, Duty"
   
    try:
        schedule = db.engine.execute(sqlSelect)
    # check for OperationalError ??
    except (SQLAlchemyError, DBAPIError) as e:
        print("ERROR -",e)
        flash("ERROR - Can't access database.",'danger')
    msg = ''
    if (schedule):
        for s in schedule:
            emailAddress = s.emailAddress
            displayName = s.displayName 
            msg += s.DateScheduled + '  ' + s.AM_PM + '  ' + s.Duty + '  ' + s.Shop_Name + '\n'
    else:
        msg = 'ERROR - Nothing has been scheduled.'
        return make_response (f"{msg}")    
    
    # ..... add code to email schedule in body of email
    #To - insert member's email address, if available
    #Subject - Monitor schedule for ...
    #Body -
    #  Date   Shift   Duty   Location
    # 3/1/21    AM      Shop Monitor    Brownwood
    # 3/15/21   AM      Tool Crib       Rolling Acres

    # PREPARE AN EMAIL
    sender = ("frontdesk@thevwc.net")
    password = 'Dove1234'
    recipient = emailAddress
    #recipient = ("Richard Hartley", "hartl1r@gmail.com")
    
    #bcc=("Woodshop","villagesWoodShop@embarqmail.com")
    #recipientList = []
    #recipientList.append(recipient)
   
    message = msg
    subject = "Monitor schedule for " + displayName
    msg = MIMEMultipart()
    msg['From'] = sender
    msg['To'] = recipient
    msg['Subject'] = subject

    # Attach the message to the MIMEMultipart object
    msg.attach(MIMEText(message,'plain'))
    server = smtplib.SMTP('outlook.office365.com',587)
    server.starttls()
    server.login(sender, password)
    text = msg.as_string()
    server.sendmail(sender, recipient, text)
    server.quit()

    # flash('Schedule has been sent to member.','success')
    # return redirect(url_for('index',villageID=memberID))
    msg = "Schedule has been sent."
    return msg

# PRINT WEEKLY MONITOR DUTY SCHEDULE FOR COORDINATOR
@app.route("/printWeeklyMonitorSchedule", methods=['GET'])
def printMonitorScheduleWeek():
    dateScheduled=request.args.get('dateScheduled')
    shopNumber=request.args.get('shopNumber')

    #  DETERMINE START OF WEEK DATE
    #  CONVERT TO DATE TYPE
    dateScheduledDat = datetime.strptime(dateScheduled,'%Y%m%d')
    dayOfWeek = dateScheduledDat.weekday()

    beginDateDAT = dateScheduledDat - timedelta(dayOfWeek + 1)
    beginDateSTR = beginDateDAT.strftime('%m-%d-%Y')

    endDateDAT = beginDateDAT + timedelta(days=6)
    endDateSTR = endDateDAT.strftime('%m-%d-%Y')

    # DEFINE COLUMN HEADING DATES
    monDateDAT = dateScheduledDat + timedelta(days=1)
    monDate = monDateDAT.strftime('%m-%d-%Y')
    tueDateDAT = dateScheduledDat + timedelta(days=2)
    tueDate = tueDateDAT.strftime('%m-%d-%Y')
    wedDateDAT = dateScheduledDat + timedelta(days=3)
    wedDate = wedDateDAT.strftime('%m-%d-%Y')
    thuDateDAT = dateScheduledDat + timedelta(days=4)
    thuDate = thuDateDAT.strftime('%m-%d-%Y')
    friDateDAT = dateScheduledDat + timedelta(days=5)
    friDate = friDateDAT.strftime('%m-%d-%Y')
    satDateDAT = dateScheduledDat + timedelta(days=6)
    satDate = satDateDAT.strftime('%m-%d-%Y')

    weekOfHdg = beginDateDAT.strftime('%b %-d, %Y')
    
    # RETRIEVE SCHEDULE FOR SPECIFIC WEEK
    #est = timezone('EST')
    todays_date = date.today()
    todays_dateSTR = todays_date.strftime('%-m-%-d-%Y')

    # GET COORDINATOR ID FROM COORDINATOR TABLE
    coordinatorRecord = db.session.query(CoordinatorsSchedule)\
        .filter(CoordinatorsSchedule.Start_Date==beginDateDAT)\
        .filter(CoordinatorsSchedule.Shop_Number==shopNumber).first()
    if coordinatorRecord == None:
        coordinatorsName = 'Not Assigned'
    else:
        # LOOK UP COORDINATORS NAME
        coordinatorID = coordinatorRecord.Coordinator_ID
        memberRecord = db.session.query(Member).filter(Member.Member_ID==coordinatorID).first()
        if memberRecord == None:
            coordinatorsName = '(' + str(coordinatorID) + ')'
            coordinatorsEmail = ''
        else:
            if memberRecord.NickName != '' and memberRecord.NickName != None:
                coordinatorsName = memberRecord.First_Name + ' ' + memberRecord.Last_Name + ' (' + memberRecord.NickName + ')'
            else:
                coordinatorsName = memberRecord.First_Name + ' ' + memberRecord.Last_Name + ')'
            coordinatorsEmail = memberRecord.eMail

    shopRecord = db.session.query(ShopName).filter(ShopName.Shop_Number==shopNumber).first()
    shopName = shopRecord.Shop_Name

    # DETERMINE NUMBER OF ROWS NEEDED FOR EACH GROUPING - 
    # SMAM - Shop Monitor, AM shift
    # SMPM - Shop Monitor, PM shift
    # TCAM - Tool Crib, AM shift
    # TCPM - Tool Crib, PM shift
    
    sqlSMAM = "SELECT Count(tblMonitor_Schedule.Member_ID) AS SMAMrows "
    sqlSMAM += "FROM tblMonitor_Schedule "
    sqlSMAM += "WHERE tblMonitor_Schedule.Duty = 'Shop Monitor' "
    sqlSMAM += "AND tblMonitor_Schedule.AM_PM = 'AM' "
    sqlSMAM += "AND tblMonitor_Schedule.Shop_Number='" + shopNumber + "' "
    sqlSMAM += "AND tblMonitor_Schedule.Date_Scheduled >= '" + beginDateSTR + "' "
    sqlSMAM += "AND tblMonitor_Schedule.Date_Scheduled <= '" + endDateSTR + "' "
    sqlSMAM += "GROUP BY tblMonitor_Schedule.Date_Scheduled ORDER BY Count(tblMonitor_Schedule.Member_ID) DESC"
    SMAMrows = db.engine.execute(sqlSMAM).scalar()
    if (SMAMrows == None):
        SMAMrows = 0

    sqlSMPM = "SELECT Count(tblMonitor_Schedule.Member_ID) AS SMPMrows "
    sqlSMPM += "FROM tblMonitor_Schedule "
    sqlSMPM += "WHERE tblMonitor_Schedule.Duty = 'Shop Monitor' "
    sqlSMPM += "AND tblMonitor_Schedule.AM_PM = 'PM' "
    sqlSMPM += "AND tblMonitor_Schedule.Shop_Number='" + shopNumber + "' "
    sqlSMPM += "AND tblMonitor_Schedule.Date_Scheduled >= '" + beginDateSTR + "' "
    sqlSMPM += "AND tblMonitor_Schedule.Date_Scheduled <= '" + endDateSTR + "' "
    sqlSMPM += "GROUP BY tblMonitor_Schedule.Date_Scheduled ORDER BY Count(tblMonitor_Schedule.Member_ID) DESC"
    SMPMrows = db.engine.execute(sqlSMPM).scalar()
    if (SMPMrows == None):
        SMPMrows = 0
        
    sqlTCAM = "SELECT Count(tblMonitor_Schedule.Member_ID) AS TCAMrows "
    sqlTCAM += "FROM tblMonitor_Schedule "
    sqlTCAM += "WHERE tblMonitor_Schedule.Duty = 'Tool Crib' "
    sqlTCAM += "AND tblMonitor_Schedule.AM_PM = 'AM' "
    sqlTCAM += "AND tblMonitor_Schedule.Shop_Number='" + shopNumber + "' "
    sqlTCAM += "AND tblMonitor_Schedule.Date_Scheduled >= '" + beginDateSTR + "' "
    sqlTCAM += "AND tblMonitor_Schedule.Date_Scheduled <= '" + endDateSTR + "' "
    sqlTCAM += "GROUP BY tblMonitor_Schedule.Date_Scheduled ORDER BY Count(tblMonitor_Schedule.Member_ID) DESC"
    TCAMrows = db.engine.execute(sqlTCAM).scalar()
    if (TCAMrows == None):
        TCAMrows = 0
        
    sqlTCPM = "SELECT Count(tblMonitor_Schedule.Member_ID) AS TCPMrows "
    sqlTCPM += "FROM tblMonitor_Schedule "
    sqlTCPM += "WHERE tblMonitor_Schedule.Duty = 'Tool Crib' "
    sqlTCPM += "AND tblMonitor_Schedule.AM_PM = 'AM' "
    sqlTCPM += "AND tblMonitor_Schedule.Shop_Number='" + shopNumber + "' "
    sqlTCPM += "AND tblMonitor_Schedule.Date_Scheduled >= '" + beginDateSTR + "' "
    sqlTCPM += "AND tblMonitor_Schedule.Date_Scheduled <= '" + endDateSTR + "' "
    sqlTCPM += "GROUP BY tblMonitor_Schedule.Date_Scheduled ORDER BY Count(tblMonitor_Schedule.Member_ID) DESC"
    TCPMrows = db.engine.execute(sqlTCPM).scalar()
    if (TCPMrows == None):
        TCPMrows = 0
        

    # DEFINE ARRAYS FOR EACH GROUPING
    # if (SMAMrows != None):
    #     rows = SMAMrows
    # else:
    #     rows = 0  
    rows = SMAMrows
    cols = 6    # member name and training needed Y or N
    SMAMnames = [[0 for x in range(cols)] for y in range(rows)]
    SMAMtraining = [[0 for x in range(cols)] for y in range(rows)]

    rows = SMPMrows
    cols = 6    # member name and training needed Y or N
    SMPMnames = [[0 for x in range(cols)] for y in range(rows)]
    SMPMtraining = [[0 for x in range(cols)] for y in range(rows)]

    rows = TCAMrows 
    cols = 6    # member name and training needed Y or N
    TCAMnames = [[0 for x in range(cols)] for y in range(rows)]
    TCAMtraining = [[0 for x in range(cols)] for y in range(rows)]

    rows = TCPMrows 
    cols = 6    # member name and training needed Y or N
    TCPMnames = [[0 for x in range(cols)] for y in range(rows)]
    TCPMtraining = [[0 for x in range(cols)] for y in range(rows)]


    # BUILD SELECT STATEMENT TO RETRIEVE SM MEMBERS SCHEDULE FOR CURRENT YEAR FORWARD
    sqlSelectSM = "SELECT tblMember_Data.Member_ID as memberID, "
    sqlSelectSM += "First_Name + ' ' + Last_Name as displayName, tblShop_Names.Shop_Name, "
    sqlSelectSM += "Last_Monitor_Training as trainingDate, DATEPART(year,Last_Monitor_Training) as trainingYear, "
    sqlSelectSM += "tblMonitor_Schedule.Member_ID, DATEPART(dw,Date_Scheduled)-2 as dayOfWeek, "
    sqlSelectSM += " format(Date_Scheduled,'M/d/yyyy') as DateScheduled, DATEPART(year,Date_Scheduled) as scheduleYear, "
    sqlSelectSM += "AM_PM, Duty, No_Show, tblMonitor_Schedule.Shop_Number, tblMember_Data.Monitor_Duty_Waiver_Expiration_Date as waiver "
    sqlSelectSM += "FROM tblMember_Data "
    sqlSelectSM += "LEFT JOIN tblMonitor_Schedule ON tblMonitor_Schedule.Member_ID = tblMember_Data.Member_ID "
    sqlSelectSM += "LEFT JOIN tblShop_Names ON tblMonitor_Schedule.Shop_Number = tblShop_Names.Shop_Number "
    sqlSelectSM += "WHERE Date_Scheduled between '" + beginDateSTR + "' and '" + endDateSTR + "' "
    #sqlSelectSM += " and tblMonitor_Schedule.Duty = 'Shop Monitor' "
    sqlSelectSM += "ORDER BY dayOfWeek, AM_PM,Last_Name"
    SMschedule = db.engine.execute(sqlSelectSM)
    
    # BUILD SELECT STATEMENT TO RETRIEVE SM MEMBERS SCHEDULE FOR CURRENT YEAR FORWARD
    sqlSelectTC = "SELECT tblMember_Data.Member_ID as memberID, "
    sqlSelectTC += "First_Name + ' ' + Last_Name as displayName, tblShop_Names.Shop_Name, "
    sqlSelectTC += "Last_Monitor_Training as trainingDate, DATEPART(year,Last_Monitor_Training) as trainingYear, "
    sqlSelectTC += "tblMonitor_Schedule.Member_ID, DATEPART(dw,Date_Scheduled)-0 as dayOfWeek, "
    sqlSelectTC += " format(Date_Scheduled,'M/d/yyyy') as DateScheduled, DATEPART(year,Date_Scheduled) as scheduleYear, "
    sqlSelectTC += "AM_PM, Duty, No_Show, tblMonitor_Schedule.Shop_Number, tblMember_Data.Monitor_Duty_Waiver_Expiration_Date as waiver "
    sqlSelectTC += "FROM tblMember_Data "
    sqlSelectTC += "LEFT JOIN tblMonitor_Schedule ON tblMonitor_Schedule.Member_ID = tblMember_Data.Member_ID "
    sqlSelectTC += "LEFT JOIN tblShop_Names ON tblMonitor_Schedule.Shop_Number = tblShop_Names.Shop_Number "
    sqlSelectTC += "WHERE Date_Scheduled between '" + beginDateSTR + "' and '" + endDateSTR + "' "
    sqlSelectTC += " and tblMonitor_Schedule.Duty = 'Tool Crib' "
    sqlSelectTC += "ORDER BY dayOfWeek, AM_PM, Last_Name"
    TCschedule = db.engine.execute(sqlSelectTC)

    #   BUILD SHOP MONITOR ARRAYS
    for s in SMschedule:
        
        # IS TRAINING NEEDED?
        if (s.waiver == None):
            if (s.trainingYear == None):
                trainingNeeded = 'Y'
            else:
                intTrainingYear = int(s.trainingYear) +2
                intScheduleYear = int(s.scheduleYear)
                if (intTrainingYear <= intScheduleYear):
                    trainingNeeded = 'Y'
                else:
                    trainingNeeded = 'N'
        else:
            trainingNeeded = 'N'

        # Group - Shop Monitor;  shift - AM
        if (s.Duty == 'Shop Monitor' and s.AM_PM == 'AM'):
            for r in range(SMAMrows):
                if (SMAMnames[r][s.dayOfWeek] == 0):
                    SMAMnames[r][s.dayOfWeek] = s.displayName
                    SMAMtraining[r][s.dayOfWeek] = trainingNeeded
                    break
        
        # Group - Shop Monitor;  shift - PM
        if (s.Duty == 'Shop Monitor' and s.AM_PM == 'PM'): 
            for r in range(SMPMrows):
                if (SMPMnames[r][s.dayOfWeek] == 0):
                    SMPMnames[r][s.dayOfWeek] = s.displayName
                    SMPMtraining[r][s.dayOfWeek] = trainingNeeded
                    break

        # Group - Tool Crib;  shift - AM
        if (s.Duty == 'Tool Crib' and s.AM_PM == 'AM'):
            for r in range(TCAMrows):
                if (TCAMnames[r][s.dayOfWeek] == 0):
                    TCAMnames[r][s.dayOfWeek] = s.displayName
                    TCAMtraining[r][s.dayOfWeek] = trainingNeeded
                    break

        # Group - Tool Crib;  shift - PM
        if (s.Duty == 'Tool Crib' and s.AM_PM == 'PM'):
            for r in range(TCPMrows):
                if (TCPMnames[r][s.dayOfWeek] == 0):
                    TCPMnames[r][s.dayOfWeek] = s.displayName
                    TCPMtraining[r][s.dayOfWeek] = trainingNeeded
                    break


    # REPLACE 0 WITH BLANK IN NAMES ARRAY
    for r in range(SMAMrows):
        c=0
        while c <= 5:
            if (SMAMnames[r][c] == 0):
                SMAMnames[r][c] = ''
            c += 1
    for r in range(SMPMrows):
            c=0
            while c <= 5:
                if (SMPMnames[r][c] == 0):
                    SMPMnames[r][c] = ''
                c += 1
    for r in range(TCAMrows):
        c=0
        while c <= 5:
            if (TCAMnames[r][c] == 0):
                TCAMnames[r][c] = ''
            c += 1
    for r in range(TCPMrows):
            c=0
            while c <= 5:
                if (TCPMnames[r][c] == 0):
                    TCPMnames[r][c] = ''
                c += 1

    
    return render_template("rptWeeklyMonitorSchedule.html",\
    SMAMnames=SMAMnames,SMPMnames=SMPMnames,TCAMnames=TCAMnames,TCPMnames=TCPMnames,\
    SMAMtraining=SMAMtraining,SMPMtraining=SMPMtraining,TCAMtraining=TCAMtraining,TCPMtraining=TCPMtraining,\
    SMAMrows=SMAMrows,SMPMrows=SMPMrows,TCAMrows=TCAMrows,TCPMrows=TCPMrows,\
    shopName=shopName,weekOf=beginDateSTR,coordinatorsName=coordinatorsName, coordinatorsEmail=coordinatorsEmail,\
    todays_date=todays_dateSTR,\
    weekOfHdg=weekOfHdg,\
    monDate=monDate,tueDate=tueDate,wedDate=wedDate,thuDate=thuDate,friDate=friDate,satDate=satDate)
    

@app.route("/setNoShow/")
def setNoShow():
    recordID = request.args.get('recordID')
    scheduleRecord = db.session.query(MonitorSchedule).filter(MonitorSchedule.ID == recordID).first()
    if scheduleRecord != None:
        memberID = scheduleRecord.Member_ID
        if scheduleRecord.No_Show == False:
            scheduleRecord.No_Show = True
        else:
            scheduleRecord.No_Show = False
        try:
            db.session.commit()
        except:
            db.session.rollback()
    
    return redirect(url_for('index',villageID=memberID))

def logChange(colName,memberID,newData,origData):
    if (type(newData) == datetime):
        newData = newData.strftime('%Y-%m-%d')
    if (type(origData) == datetime):
        origData = origData.strftime('%Y-%m-%-d')
    if (type(newData) == str and len(newData) > 50):
        newData = newData[:50]
    if (type(origData) == str and len(origData) > 50):
        origData = origData[:50]
    
    staffID = getStaffID()
    if staffID == None or staffID == '':
        flash('Missing staffID in logChange routine.','danger')
        staffID = '111111'

    #  GET UTC TIME
    est = timezone('EST')
    # Write data changes to tblMember_Data_Transactions
    try:
        newTransaction = MemberTransactions(
            Transaction_Date = datetime.now(est),
            Member_ID = memberID,
            Staff_ID = staffID,
            Original_Data = origData,
            Current_Data = newData,
            Data_Item = colName,
            Action = 'UPDATE'
        )
        db.session.add(newTransaction)
        return
        db.session.commit()
    except (SQLAlchemyError, DBAPIError) as e:
        error = str(e.__dict__['orig'])
        flash('Transaction could not be logged.\n'+error,'danger')
        db.session.rollback()

def getStaffID():
    if 'staffID' in session:
        staffID = session['staffID']
    else:
        #staffID = ''
        staffID = '604875'
    return staffID

def getStaffName():
    if 'staffname' in session:
        staffName = session['staffname']
    else:
        #staffName = ''
        staffName = 'rlh'
    return staffName

def getShopID():
    if 'shopID' in session:
        shopID = session['shopID']
    else:
        #shopID = ''
        shopID = 'BW'
    return shopID
