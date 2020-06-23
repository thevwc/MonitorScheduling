# routes.py

from flask import session, render_template, flash, redirect, url_for, request, jsonify, json, make_response
from flask_bootstrap import Bootstrap
from werkzeug.urls import url_parse
from app.models import ShopName, Member , MemberActivity, MonitorSchedule, MonitorScheduleTransaction, MonitorWeekNote, CoordinatorsSchedule
from app import app
from app import db
from sqlalchemy import func, case, desc, extract, select, update, text
from sqlalchemy.exc import SQLAlchemyError, IntegrityError, DBAPIError

import datetime as dt
from datetime import date, datetime, timedelta

# @app.context_processor
# def context_processor():
#     return dict(actionDesc=g.actionDesc)

@app.route('/')
@app.route('/index', methods=['GET','POST'])
def index():
    # POST REQUEST
    if request.method == 'POST':
        if not request.get_json() == None:
            parameters = request.get_json()
            if parameters and 'year' in parameters:
                 yearFilter=parameters['year']
            else:
                currentYear = datetime.date.year
                yearFilter=currentYear

            if parameters and 'shop' in parameters:
                shopFilter = parameters['shop']
            else:
                shopFilter = 'BOTH'
                shopNumber = 0

            # BUILD WHERE CLAUSE FOR RESPONSE OBJECT
            whereClause = "WHERE DatePart(year,[Date_Scheduled]) = '" + yearFilter + "'" 
            if shopFilter == 'RA':
                whereClause += " and Shop_number = 1"

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
            
            # ADD tblShop_Dates DAILY REQUIREMENTS TO 'requirements' ARRAY
            if shopFilter == 'BOTH' or shopFilter == 'RA':
                shopNumber = 1
            else:
                shopNumber = 2
            # BOTH SHOPS ARE IN THE shopDates ARRAY
            SQLselect2 = "SELECT [Shop_Number],[MM_DD_YYYY], [Status],"
            SQLselect2 += " SM_AM_REQD, SM_PM_REQD, TC_AM_REQD, TC_PM_REQD, "
            SQLselect2 += " DATEPART(Y,[MM_DD_YYYY]) AS dayNumber "
            SQLselect2 += " FROM tblShop_Dates  "
            SQLselect2 += " WHERE DatePart(year,[MM_DD_YYYY]) = '" + yearFilter + "'" 
            
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
                else:
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


    ########################################
    # THE FOLLOWING WILL BE HANDLED IN A JAVASCRIPT ROUTINE
    # WAS MEMBER ID PASSED IN?
    # memberID = request.args.get('id','000000')
    # #memberID='672883'
    # if (memberID != '000000'):
    #     #  Retrieve name
    #     memberData = db.session.query(Member).filter(Member.Member_ID==memberID)
    #     m = memberData.first()
    #     displayName = m.Last_Name + ', ' + m.First_Name + '  (' + m.Member_ID + ')'
    #     trainingDate = m.Last_Monitor_Training  #.strftime("%B %-d, %Y")

    #     #  Summarize all member's schedules by date for the current year
    #     today = datetime.date.today()
    #     currentYear = today.year
    #     sqlSchedule = "SELECT tblMonitor_Schedule.Date_Scheduled, tblMonitor_Schedule.AM_PM, tblMonitor_Schedule.Shop_Number, "
    #     sqlSchedule += " tblMonitor_Schedule.Duty, tblMonitor_Schedule.No_Show "
    #     sqlSchedule += " FROM tblMonitor_Schedule "
    #     sqlSchedule += " LEFT JOIN tblShop_Names ON (tblMonitor_Schedule.Shop_Number = tblShop_Names.Shop_Number) "
    #     sqlSchedule += " WHERE tblMonitor_Schedule.Member_ID = '" + memberID + "';"    
    #     #print (sqlSchedule)
    #     schedule = db.engine.execute(sqlSchedule)
    #     return render_template("index.html",nameList=nameArray,memberID=memberID,displayName=displayName,memberSchedule=schedule,trainingDate=trainingDate)
    # ####################################################
    return render_template("index.html",nameList=nameArray,memberID='000000',displayName='... member name ...')
   

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
        sqlWhereClause = "WHERE Date_Scheduled = '" + scheduleDate + "'"
    else:
        sqlWhereClause = "WHERE Shop_Number = " + shopNumber + " and Date_Scheduled = '" + scheduleDate + "'"

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
    schedArray[0][1] = schedDateToDisplay.strftime("%B %-d, %Y")
    schedArray[0][7] = dayNumber

    # BUILD ARRAY WITH ONE ASSIGNMENT PER ROW (POSITION)
    for s in schedule:
        position += 1
        schedArray[position][0] = s.Shop_Number
        schedArray[position][1] = s.Date_Scheduled.strftime("%B %-d, %Y")
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

    # RETRIEVE MEMBER NAME AND LAST TRAINING DATE
    # RETRIEVE MEMBER SCHEDULE FOR CURRENT YEAR AND FORWARD
    Today = date.today()
    currentYear = Today.year
    
    # DECLARE ARRAY AND SET TO ZERO 
    rows = 100  # ARRAY LARGE ENOUGH FOR MULTIPLE YEARS
    cols = 9 # Date_Scheduled, AM_PM, Member name, Village ID
    schedArray = [[0 for x in range(cols)] for y in range(rows)]

    sqlSelect = "SELECT tblMember_Data.Member_ID as memberID, "
    sqlSelect += "Last_Name + ', ' + First_Name + '  (' + tblMember_Data.Member_ID + ')' as displayName, "
    sqlSelect += "Last_Monitor_Training as trainingDate, tblMonitor_Schedule.Member_ID, Date_Scheduled, AM_PM, Duty, No_Show, Shop_Number "
    sqlSelect += "FROM tblMember_Data "
    sqlSelect += "LEFT JOIN tblMonitor_Schedule ON tblMonitor_Schedule.Member_ID = tblMember_Data.Member_ID "
    sqlSelect += "WHERE tblMember_Data.Member_ID = '" + memberID + "' ORDER BY Date_Scheduled desc"
    memberSchedule = db.engine.execute(sqlSelect)
    position = 0
    for ms in memberSchedule:
        schedArray[position][0] = ms.memberID
        schedArray[position][1] = ms.Shop_Number
        schedArray[position][2] = ms.displayName
        if (ms.trainingDate != None):
            schedArray[position][3] = ms.trainingDate.strftime("%-m/%-d/%Y")
        else:
            schedArray[position][3] = ''
        
        if ms.Date_Scheduled != None:
            schedArray[position][4] = ms.Date_Scheduled.strftime("%Y%m%d")
            schedArray[position][5] = ms.Date_Scheduled.strftime("%a %-m/%-d/%y")
            schedArray[position][6] = ms.AM_PM
            schedArray[position][7] = ms.Duty
            schedArray[position][8] = ms.No_Show
        
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
    
    staffID = parameters['staffID']
    if staffID == None: 
        return "ERROR - Missing staffID."
  
    # input () is for CLI only
    # promptMsg = "Why are you deleting this record?"
    # reason = input(promptMsg)
    # print ('Reason-' , reason)

    # RETRIEVE RECORD TO BE DELETED
    assignment = db.session.query(MonitorSchedule).filter(MonitorSchedule.ID==recordID).first()
    if assignment == None:
        return "ERROR - Record no longer exists."

    memberID=assignment.Member_ID
    dateScheduled=assignment.Date_Scheduled
    ampm=assignment.AM_PM
    duty=assignment.Duty
    shopNumber=assignment.Shop_Number

    # DELETE THE ASSIGNMENT VIA RAW SQL
    sqlDelete = "DELETE FROM tblMonitor_Schedule WHERE ID = " + recordID
    result = db.engine.execute(text(sqlDelete).execution_options(autocommit=True))
    if result == 0:
        return "ERROR - Delete of assignment failed."

    # ADD ENTRY TO MONITOR SCHEDULE TRANSACTION LOG
    response=LogMonitorScheduleTransaction('DELETE',memberID,dateScheduled,ampm,duty,staffID,shopNumber)
    if response == 0:
        return "ERROR - Could NOT log DELETE transaction."

    # ADD ENTRY TO MONITOR SCHEDULE NOTES
    mbr = db.session.query(Member).filter(Member.Member_ID == memberID).first()
    memberName = mbr.First_Name + ' ' + mbr.Last_Name + ' (' + memberID + ')'
    dateScheduledSTR = dateScheduled.strftime('%m-%d-%Y')
    actionDesc = "DELETE " + memberName + ' ' + dateScheduledSTR + ' ' + ampm + ' ' + duty
    #print ('type of dateScheduled - ' ,type(dateScheduled))

    #session.dateScheduled=dateScheduled
    #session.actionDesc = actionDesc
    # session.shopNumber=shopNumber
    #session.staffID=staffID

    # LogCoordinatorWeekNote(dateScheduled,swapDescription,shopNumber,staffID)
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
    staffID = parameters['staffID']
    if staffID == None: 
        return "ERROR - Missing staffID."

    #  DOES MEMBER HAVE ANOTHER ASSIGNMENT AT ANOTHER LOCATION FOR THIS TIME
    assignmentExists = MonitorSchedule.query.filter_by(Member_ID=memberID,
        Date_Scheduled = schedDate,
        AM_PM = Shift).first()
    if assignmentExists:
        return 'This member has another assignment at this time.'

    #  the following code would not work with an autoincrement field in the table
    #   ADD VIA SQLALCHEMY
    # a = MonitorSchedule(Member_ID=memberID,
    #     Date_Scheduled = schedDate,
    #     AM_PM = Shift,
    #     Shop_Number = shopNumber,
    #     Duty = Duty
    #     )
    # try:
    #     db.session.add(a)
    #     db.session.commit()
    # except (SQLAlchemyError, DBAPIError) as e:
    #     print (e)
    #     return 'An error occurred ...'
    # return 'Assignment added.'

    #  ADD VIA RAW SQL
    sqlInsert = "INSERT INTO tblMonitor_Schedule (Member_ID, Date_Scheduled, AM_PM, Shop_Number,Duty)"
    sqlInsert += " VALUES ('" + memberID + "', '" + schedDate + "', '" + Shift + "'"
    sqlInsert += ", " + shopNumber + ", '" + Duty + "')"
    
    
    # ADD ASSIGNMENT TO tblMonitor_Schedule
    result = db.engine.execute(text(sqlInsert).execution_options(autocommit=True))
    if (result.rowcount == 0):
        return "ERROR - Assignment could NOT be added."

    # ADD ENTRY TO MONITOR SCHEDULE TRANSACTION LOG
    response=LogMonitorScheduleTransaction('ADD',memberID,schedDate,Shift,Duty,staffID,shopNumber)
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

    schedDate = parameters['schedDate1']
    if (schedDate == None):
        return "ERROR - Missing schedDate1 parameter."
    schedDate1 = datetime.strptime(schedDate,'%Y%m%d')
    schedDateSTR1 = schedDate1.strftime('%m-%d-%Y')
    dayOfWeek1 = schedDate1.weekday()
    weekOf1 = schedDate1 - timedelta(dayOfWeek1 + 1)
    # print ('schedDate1 type-',type(schedDate1))
    # session.dateScheduled1 = schedDate1
    # x = session['dateScheduled1']
    # print ('x type-',type(x))

    schedDate = parameters['schedDate2']
    if (schedDate == None):
        return "ERROR - Missing schedDate2 parameter."
    schedDate2 = datetime.strptime(schedDate,'%Y%m%d')
    schedDateSTR2 = schedDate2.strftime('%m-%d-%Y')
    dayOfWeek2 = schedDate2.weekday()
    weekOf2 = schedDate2 - timedelta(dayOfWeek2 + 1)
    # session.dateScheduled2 = schedDate2

    shift1 = parameters['shift1']
    if (shift1 == None):
        return "ERROR - Missing shift1 parameter."
    shift2 = parameters['shift2']
    if (shift2 == None):
        return "ERROR - Missing shift2 parameter."

    duty1 = parameters['duty1']
    if (duty1 == None):
        return "ERROR - Missing duty1 parameter."
    duty2 = parameters['duty2']
    if (duty2 == None):
        return "ERROR - Missing duty2 parameter."

    recordID1 = parameters['recordID1']
    if (recordID1 == None):
        return "ERROR - Missing recordID 1 parameter."
    recordID2 = parameters['recordID2']
    if (recordID2 == None):
        return "ERROR - Missing recordID 2 parameter."

    memberID1 = parameters['memberID1']
    if (memberID1 == None):
        return "ERROR - Missing memberID 1 parameter."
    memberID2 = parameters['memberID2']
    if (memberID2 == None):
        return "ERROR - Missing memberID 2 parameter."

    shopNumber = parameters['shopNumber']
    if (shopNumber == None):
        return "ERROR - Missing shopNumber parameter."



    staffID = parameters['staffID']
    if (staffID == None):
        return "ERROR - Missing staffID parameter."
    # session.staffID=staffID

    if (recordID1 == '0') and (recordID2 == '0'):
        return "ERROR - You cannot swap two OPEN assignments."

    # RETRIEVE ASSIGNMENT 1 DATA UNLESS IT IS PART OF A MOVE
    if (recordID1 != '0'):
        assignment1 = db.session.query(MonitorSchedule).filter(MonitorSchedule.ID==recordID1).first()
        if (assignment1 == None):
            return "ERROR - Assignment with record ID " + recordID1 + " could not be found."
        mbr1 = db.session.query(Member).filter(Member.Member_ID == memberID1).first()
        memberName1 = mbr1.First_Name + ' ' + mbr1.Last_Name + ' (' + memberID1 + ')'     
    else:
        memberName1 = ''

    # RETRIEVE ASSIGNMENT 2 DATA UNLESS IT IS PART OF A MOVE
    if (recordID2 != '0'):
        assignment2 = db.session.query(MonitorSchedule).filter(MonitorSchedule.ID==recordID2).first()
        if (assignment2 == None):
            return "ERROR - Assignment with record ID " + recordID2 + " could not be found."
        mbr2 = db.session.query(Member).filter(Member.Member_ID == memberID2).first()
        memberName2 = mbr2.First_Name + ' ' + mbr2.Last_Name + ' (' + memberID2 + ')'
    else:
        memberName2 = ''


    # CHECK FOR POTENTIAL CONFLICTS WITH EACH ASSIGNMENT
    if schedDate1 != schedDate2 or shift1 != shift2:
        if conflicts(memberID2,schedDate1,shift1) > 0:
            msg = "ERROR - The member with village ID " + memberID2 + " has a conflict at "
            msg += schedDate1.strftime('%m-%d-%Y') + " " + shift1
            return msg
            
        if conflicts(memberID1,schedDate2,shift2) > 0:
            msg = "ERROR - The member with village ID " + memberID1 + " has a conflict at "
            msg += schedDate2.strftime('%m-%d-%Y') + " " + shift2
            return msg
        

    # IS THIS A SWAP AND NOT A MOVE TO AN EMPTY SLOT?
    if (recordID1 != '0' and recordID2 != '0'):
        
        # MAKE SWAP VIA RAW SQL
        sqlUpdate1 = "UPDATE tblMonitor_Schedule SET Member_ID = " 
        sqlUpdate1 += "'" + memberID2 + "' WHERE ID = " + recordID1
        result1 = db.engine.execute(text(sqlUpdate1).execution_options(autocommit=True))

        sqlUpdate2 = "UPDATE tblMonitor_Schedule SET Member_ID = " 
        sqlUpdate2 += "'" + memberID1 + "' WHERE ID = " + recordID2
        result2 = db.engine.execute(text(sqlUpdate2).execution_options(autocommit=True))

        # WAS SWAP SUCCESSFUL?
        if (result1.rowcount == '0') or (result2.rowcount == '0'):
            return "ERROR - Swap could NOT be completed."

        # WRITE TO MONITOR_SCHEDULE_TRANSACTIONS
        response=LogMonitorScheduleTransaction('RMV-SWP',memberID1,schedDate1,shift1,duty1,staffID,shopNumber)
        if response == '0':
            return "ERROR - Could NOT log transaction."
        response=LogMonitorScheduleTransaction('RMV-SWP',memberID2,schedDate2,shift2,duty2,staffID,shopNumber)
        if response == '0':
            return "ERROR - Could NOT log transaction."
        response=LogMonitorScheduleTransaction('ADD-SWP',memberID1,schedDate1,shift1,duty1,staffID,shopNumber)
        if response == '0':
            return "ERROR - Could NOT log transaction."
        response=LogMonitorScheduleTransaction('ADD-SWP',memberID2,schedDate2,shift2,duty2,staffID,shopNumber)
        if response == '0':
            return "ERROR - Could NOT log transaction."
        
        
        # WRITE TO MONITOR_WEEK_NOTES
        actionDesc = "SWAP " + memberName1 + ' ' + schedDateSTR1 + ' ' + shift1 + ' ' + duty1\
            + ' WITH ' + memberName2 + ' ' + schedDateSTR2 + ' ' + shift2 + ' ' + duty2
        #print (actionDesc)
        return actionDesc

    # IF THE MOVE IS FROM THE FIRST ASSIGNMENT TO THE SECOND (OPEN) ...
    if (recordID1 != '0' and recordID2 == '0'):
        #assignment1 = db.session.query(MonitorSchedule).filter(MonitorSchedule.ID==recordID1).first()
        # if assignment1 == None:
        #     return "ERROR - Assignment with record ID " + recordID1 + " could not be found."
        # memberID = assignment1.Member_ID
        # schedDate = assignment1.Date_Scheduled
        # schedDateSTR = schedDate.strftime('%m-%d-%Y')
        # shift = assignment1.AM_PM
        # duty = assignment1.Duty
        # shopNumber = assignment1.Shop_Number
        
        #  ADD ASSIGNMENT TO tblMonitor_Schedule VIA RAW SQL
        sqlInsert = "INSERT INTO tblMonitor_Schedule (Member_ID, Date_Scheduled, AM_PM, Shop_Number,Duty)"
        sqlInsert += " VALUES ('" + memberID1 + "', '" + schedDateSTR2 + "', '" + shift2 + "'"
        sqlInsert += ", " + str(shopNumber) + ", '" + duty2 + "')"
        result = db.engine.execute(text(sqlInsert).execution_options(autocommit=True))
        if (result.rowcount > 0):
            insertCompleted = True
        else:
            insertCompleted = False 
            return "ERROR - Assignment could NOT be added."

        # DELETE SECOND ASSIGNMENT
        sqlDelete = "DELETE FROM tblMonitor_Schedule WHERE ID = " + recordID1
        result = db.engine.execute(text(sqlDelete).execution_options(autocommit=True))
        if result == 0:
            return "ERROR - Delete of assignment failed."


        #  WRITE TO MONITOR_SCHEDULE_TRANSACTIONS
        response=LogMonitorScheduleTransaction('RMV-MV',memberID1,schedDate1,shift1,duty1,staffID,shopNumber)
        if response == '0':
            return "ERROR - Could NOT log transaction."
        response=LogMonitorScheduleTransaction('ADD-MV',memberID1,schedDate2,shift2,duty2,staffID,shopNumber)
        if response == '0':
            return "ERROR - Could NOT log transaction."
        
        # WRITE TO MONITOR_WEEK_NOTES
        #schedDateSTR1 = schedDate1.strftime('%m-%d-%Y')
        actionDesc = "MOVE " + memberName1 + ' ' + schedDateSTR1 + ' ' + shift1 + ' ' + duty1\
        + ' TO ' + schedDateSTR2 + ' ' + shift2 + ' ' + duty2
        #print (actionDesc)
        return actionDesc

    # IF MOVE IS FROM SECOND ASSIGNMENT TO THE FIRST ASSIGNMENT (OPEN) ...
    if (recordID1 == '0' and recordID2 != '0'):
        # assignment2 = db.session.query(MonitorSchedule).filter(MonitorSchedule.ID==recordID2).first()
        # if assignment2 == None:
        #     return "ERROR - Assignment with record ID " + recordID2 + " could not be found."
        # memberID = assignment2.Member_ID
        # schedDate = assignment2.Date_Scheduled
        # schedDateSTR = schedDate.strftime('%m-%d-%Y')
        # shift = assignment2.AM_PM
        # duty = assignment2.Duty
        # shopNumber = assignment2.Shop_Number
        
        #  ADD ASSIGNMENT TO tblMonitor_Schedule VIA RAW SQL
        sqlInsert = "INSERT INTO tblMonitor_Schedule (Member_ID, Date_Scheduled, AM_PM, Shop_Number,Duty)"
        sqlInsert += " VALUES ('" + memberID2 + "', '" + schedDateSTR1 + "', '" + shift1 + "'"
        sqlInsert += ", " + str(shopNumber) + ", '" + duty1 + "')"
        result = db.engine.execute(text(sqlInsert).execution_options(autocommit=True))
        if (result.rowcount > 0):
            insertCompleted = True
        else:
            insertCompleted = False
            return "ERROR - Could not add assignment."

        # DELETE SECOND (ORIGINAL) ASSIGNMENT
        sqlDelete = "DELETE FROM tblMonitor_Schedule WHERE ID = " + recordID2
        result = db.engine.execute(text(sqlDelete).execution_options(autocommit=True))
        if result == 0:
            return "ERROR - Delete of assignment failed."

        #  WRITE TO MONITOR_SCHEDULE_TRANSACTIONS
        response=LogMonitorScheduleTransaction('RMV-MV',memberID2,schedDate2,shift2,duty2,staffID,shopNumber)
        if response == '0':
            return "ERROR - Could NOT log transaction."
        response=LogMonitorScheduleTransaction('ADD-MV',memberID2,schedDate1,shift1,duty1,staffID,shopNumber)
        if response == '0':
            return "ERROR - Could NOT log transaction."

        # WRITE TO MONITOR_WEEK_NOTES
        #schedDateSTR2 = schedDate1.strftime('%m-%d-%Y')
        actionDesc = "MOVE " + memberName2 + ' ' + schedDateSTR2 + ' ' + shift2 + ' ' + duty2\
            + ' TO ' + schedDateSTR1 + ' ' + shift1 + ' ' + duty1
        return actionDesc    
    

def conflicts(memberID,dateScheduled,shift):
    # CONVERT DATETIME FIELD TO STRING
    dtSched = dateScheduled.strftime('%Y-%m-%d')

    # SEARCH FOR OTHER ASSIGNMENTS AT THIS TIME
    assignmentCount = db.session.query(func.count(MonitorSchedule.Member_ID))\
        .filter(MonitorSchedule.Member_ID==memberID)\
        .filter(MonitorSchedule.Date_Scheduled==dtSched)\
        .filter(MonitorSchedule.AM_PM==shift).scalar()
    return assignmentCount 
    # sqlCount = "SELECT COUNT(*) FROM tblMonitor_Schedule WHERE Member_ID = " 
    # sqlCount += "'" + memberID + "' and Date_Scheduled = '" + dtSched + "' and "
    # sqlCount += "AM_PM = '" + shift + "'"
    # print ('sqlCount=' + sqlCount)
    # recordCount = db.engine.execute(sqlCount)
    # print ('recordCount=' + str(recordCount))
    # return recordCount


# dateScheduled (date or str?)  date
def LogMonitorScheduleTransaction(transactionType,memberID,dateScheduled,shift,duty,staffID,shopNumber):
    # VALID TRANSACTION TYPES ARE ADD, ADD-MV, ADD-SWP, DELETE, DELETE NS, RMV-MV, RMV-SWP
    transactionDate = datetime.now()
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
    # POST REQUEST
    print ('BEGINNING OF logMonitorScheduleNote ROUTINE')
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
    
    deleteAsgmntDt = parameters['deleteAsgmntDt']
    if deleteAsgmntDt == None:
        return "ERROR - Missing deleteAsgmntDt."

    swapDate1 = parameters['swapDate1']
    if swapDate1 == None:
        return "ERROR - Missing swapDate1."
    
    swapDate2 = parameters['swapDate2']
    if swapDate2 == None:
        return "ERROR - Missing swapDate2."
    
    staffID = parameters['staffID']
    if staffID == None:
        return "ERROR - Missing staffID."

    shopNumber = parameters['shopNumber']
    if shopNumber == None:
        return "ERROR - Missing shopNumber."

    note = actionDesc + '\n' + reasonDesc

    if actionDesc[0:4] == 'SWAP' or actionDesc[0:4] == 'MOVE':
        swapDate1DAT = datetime.strptime(swapDate1,'%Y%m%d')
        dayOfWeek1 = swapDate1DAT.weekday()
        weekOf1 = swapDate1DAT - timedelta(dayOfWeek1 + 1)
        weekOf1STR = weekOf1.strftime('%m-%d-%Y')
        
        swapDate2DAT = datetime.strptime(swapDate2,'%Y%m%d')
        dayOfWeek2 = swapDate2DAT.weekday()
        weekOf2 = swapDate2DAT - timedelta(dayOfWeek2 + 1)
        weekOf2STR = weekOf2.strftime('%m-%d-%Y')

    if actionDesc[0:4] == 'DELE':
        deleteAsgmntDtDAT = datetime.strptime(deleteAsgmntDt,'%Y%m%d')
        dayOfWeek1 = deleteAsgmntDtDAT.weekday()
        weekOf1 = deleteAsgmntDtDAT - timedelta(dayOfWeek1 + 1)
        weekOf1STR = weekOf1.strftime('%m-%d-%Y')
    
    today=date.today()
    todaySTR = today.strftime('%m-%d-%Y')
    
    #  ALL TRANSACTIONS GET ONE NOTE (DELETE, SWAP, MOVE)
    try:
        sqlInsert1 = "INSERT INTO monitorWeekNotes (Author_ID, Date_Of_Change,Schedule_Note,WeekOf,Shop_Number) "
        sqlInsert1 += " VALUES ('" + staffID + "','" + todaySTR + "','" + note + "','" + weekOf1STR + "','" + shopNumber + "')"
        #result1 = db.engine.execute(text(sqlInsert1).execution_options(autocommit=True))
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
            sqlInsert2 += " VALUES ('" + staffID + "','" + todaySTR + "','" + note + "','" + weekOf2STR + "','" + shopNumber + "')"
            result2 = db.engine.execute(text(sqlInsert2).execution_options(autocommit=True))
            if (result2.rowcount == 0):
                return "ERROR - Assignment could NOT be added to monitorWeekNotes."
        except (SQLAlchemyError, DBAPIError) as e:
            print("ERROR - ",e)
            return 0
                   
    return "SUCCESS - SWAP or MOVE Transaction completed."

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
    #assignment2 = db.session.query(MonitorSchedule).filter(MonitorSchedule.ID==recordID2).first()
    coordinatorRecord = db.session.query(CoordinatorsSchedule)\
        .filter(CoordinatorsSchedule.Start_Date==strWeekOf)\
        .filter(CoordinatorsSchedule.Shop_Number==shopNumber).first()
    if coordinatorRecord == None:
        coordinatorsName = 'Not Assigned'
    else:
        # LOOK UP COORDINATORS NAME
        
        coordinatorID = coordinatorRecord.Coordinator_ID
        print('type for coordinatorID= ',type(coordinatorID))
        print('coordinatorID= ',str(coordinatorID))
        memberRecord = db.session.query(Member).filter(Member.Member_ID==coordinatorID).first()
        if memberRecord == None:
            coordinatorsName = '(' + str(coordinatorID) + ')'
        else:
            coordinatorsName = memberRecord.First_Name + ' ' + memberRecord.Last_Name + ' (' + str(coordinatorID) + ')'

    shopRecord = db.session.query(ShopName).filter(ShopName.Shop_Number==shopNumber).first()
    shopName = shopRecord.Shop_Name

    # RETRIEVE MONITOR SHOP NOTES FOR SPECIFIC WEEK AND SHOP NUMBER
    notes = db.session.query(MonitorWeekNote)\
        .filter(MonitorWeekNote.WeekOf==weekOf)\
        .filter(MonitorWeekNote.Shop_Number==shopNumber).all()

    # BUILD LIST OF NOTES WITH COORDINATORS NAME AND SHOP NAME
    # DECLARE ARRAY AND SET TO ZERO 
    rows = 100  # ARRAY LARGE ENOUGH FOR MULTIPLE YEARS
    cols = 6 # coordinators name and id, shop name, start date of week, and note
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



