# routes.py

from flask import session, render_template, flash, redirect, url_for, request, jsonify, json, make_response
from flask_bootstrap import Bootstrap
from werkzeug.urls import url_parse
from app.models import ShopName, Member , MemberActivity, MonitorSchedule, MonitorScheduleTransaction, MonitorWeekNote
from app import app
from app import db
from sqlalchemy import func, case, desc, extract, select, update, text
from sqlalchemy.exc import SQLAlchemyError, IntegrityError, DBAPIError

import datetime as dt
from datetime import date, datetime, timedelta
#from datetime import datetime

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
                #print (s.Shop_Number,s.MM_DD_YYYY,s.SM_AM_REQD,s.SM_PM_REQD,s.TC_AM_REQD,s.TC_PM_REQD)
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
    #print(sqlSelect)
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
    print('refresh calendar routine')
    return ('refreshed by refreshCalendar endpoint')


@app.route('/getDayAssignments', methods=['GET','POST'])
def getDayAssignments():
    # POST REQUEST
    if request.method != 'POST':
        return "ERROR - Not a POST request."
    if request.get_json() == None:
        return "ERROR - Missing schedule date."
    
    #print(request.get_json())
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
    #print (sqlSelect)
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
        #print(s.Member_ID, s.Last_Name)
    
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
    print('1. ',sqlSelect)
    # print('memberID type -')
    sqlSelect += "WHERE tblMember_Data.Member_ID = '" + memberID + "' ORDER BY Date_Scheduled desc"
    print('2. ',sqlSelect)
    memberSchedule = db.engine.execute(sqlSelect)
    position = 0
    for ms in memberSchedule:
        print('ID:' + ms.memberID,ms.displayName, ms.Date_Scheduled)
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

    return "SUCCESS - The assignment has been removed from the database." 
       
    # the following does not work with autoincrement primary key 
    #..............................
    # try:
    #     db.session.delete(assignment)
    #     db.session.commit
    # except SQLAlchemyError as e:
    #     error = str(e.__dict__['orig'])
    #     return error

    # except (SQLAlchemyError, DBAPIError) as e:
    #     print (e)

    # cannot use the following because of an autoincrement primary key
    # CREATE RECORD FOR tblMonitor_Schedule_Transactions
    # newTransaction = MonitorScheduleTransactions (
    #     Transaction_Date = date.today(),
    #     Staff_ID = staffID,
    #     Member_ID = memberID,
    #     Transaction_Type = "DELETE",
    #     Date_Scheduled = dateScheduled,
    #     AM_PM = ampm,
    #     Duty = duty
    # )
    # try:
    #     print("Add transaction record -",Transaction_Type, staffID,memberID,ampm,duty)
    #     db.session.add(newTransaction)
    #     db.session.commit
    # except SQLAlchemyError as e:
    #     print (e)
    #     db.session.rollback()
    #     return 'DELETE Transaction record could not be added.'
    # except DBAPIError as e:
    #     print(e)
    #     db.session.rollback()
    #     return 'DELETE Transaction record could not be added.'

    
    
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
    recordID1 = parameters['recordID1']
    if (recordID1 == None):
        return "ERROR - Missing recordID 1 parameter."
    recordID2 = parameters['recordID2']
    if (recordID2 == None):
        return "ERROR - Missing recordID 2 parameter."
    villageID1 = parameters['villageID1']
    if (villageID1 == None):
        return "ERROR - Missing villageID 1 parameter."
    villageID2 = parameters['villageID2']
    if (villageID2 == None):
        return "ERROR - Missing villageID 2 parameter."
    staffID = parameters['staffID']
    if (staffID == None):
        return "ERROR - Missing staffID parameter."

    if (recordID1 == '') and (recordID2 == ''):
        return "ERROR - You cannot swap two OPEN assignments."

    # RETRIEVE CURRENT ASSIGNMENTS
    assignment1 = db.session.query(MonitorSchedule).filter(MonitorSchedule.ID==recordID1).first()
    if (assignment1 == None):
        return "ERROR - Assignment with record ID " + recordID1 + " could not be found."
    memberID1 = assignment1.Member_ID
    schedDate1 = assignment1.Date_Scheduled
    shift1 = assignment1.AM_PM
    duty1 = assignment1.Duty
    shopNumber1 = assignment1.Shop_Number
    assignment2 = db.session.query(MonitorSchedule).filter(MonitorSchedule.ID==recordID2).first()
    if (assignment2 == None):
        return "ERROR - Assignment with record ID " + recordID2 + " could not be found."
    memberID2 = assignment2.Member_ID
    schedDate2 = assignment2.Date_Scheduled
    shift2 = assignment2.AM_PM
    duty2 = assignment2.Duty
    shopNumber2 = assignment2.Shop_Number

    # CHECK FOR POTENTIAL CONFLICTS WITH EACH ASSIGNMENT
    if conflicts(villageID2,schedDate1,shift1) > 0:
        msg = "ERROR - The member with village ID " + villageID2 + " has a conflict at "
        msg += schedDate1.strftime('%m-%d-%Y') + " " + shift1
        return msg
        #return ("ERROR - The member with village ID " + villageID2 + " has a conflict.")
    if conflicts(villageID1,schedDate2,shift2) > 0:
        msg = "ERROR - The member with village ID " + villageID1 + " has a conflict at "
        msg += schedDate2.strftime('%m-%d-%Y') + " " + shift2
        return msg
        #return ("ERROR - The member with village ID " + villageID1 + " has a conflict.")
         

    # THERE ARE NO OPEN ASSIGNMENTS
    if (recordID1 != '' and recordID2 != ''):
        # MAKE SWAP VIA ORM
        # try:
        #     assignment1 = db.session.query(MonitorSchedule).filter(MonitorSchedule.ID==recordID1).first()
        #     if assignment1 == None:
        #         return "ERROR - Assignment with record ID " + recordID1 + " could not be found."
        #     assignment2 = db.session.query(MonitorSchedule).filter(MonitorSchedule.ID==recordID2).first()
        #     if assignment2 == None:
        #         return "ERROR - Assignment with record ID " + recordID2 + " could not be found."
           
        #    # UPDATE EACH ASSIGNMENT RECORD WITH THE VILLAGE ID FROM THE OTHER ASSIGNMENT
        #     assignment1.memberID = villageID2
        #     db.session.commit()
        #     assignment2.memberID = villageID1
        #     db.session.commit()
        #     return "SUCCESS - SWAP COMPLETED SUCCESSFULLY."    
        # except (SQLAlchemyError, DBAPIError) as e:
        #     print (e)
        #     db.session.rollback
        #     return 'An error occurred during swap -' + e
        
        # MAKE SWAP VIA RAW SQL
        sqlUpdate1 = "UPDATE tblMonitor_Schedule SET Member_ID = " 
        sqlUpdate1 += "'" + villageID2 + "' WHERE ID = " + recordID1
        result1 = db.engine.execute(text(sqlUpdate1).execution_options(autocommit=True))

        sqlUpdate2 = "UPDATE tblMonitor_Schedule SET Member_ID = " 
        sqlUpdate2 += "'" + villageID1 + "' WHERE ID = " + recordID2
        result2 = db.engine.execute(text(sqlUpdate2).execution_options(autocommit=True))
           
        if (result1.rowcount > 0) and (result2.rowcount > 0):
            return "SUCCESS - Swap was completed."
        else:
            return "ERROR - Swap could NOT be completed."
 

    # IF SECOND ASSIGNMENT IS OPEN
    if (recordID1 != '' and recordID2 == ''):
        assignment1 = db.session.query(MonitorSchedule).filter(MonitorSchedule.ID==recordID1).first()
        if assignment1 == None:
            return "ERROR - Assignment with record ID " + recordID1 + " could not be found."
        memberID = assignment1.memberID
        schedDate = assignment1.MM_DD_YYYY
        shift = assignment1.AM_PM
        duty = assignment1.Duty
        shopNumber = assignment1.shopNumber
        
        #  ADD ASSIGNMENT TO tblMonitor_Schedule VIA RAW SQL
        sqlInsert = "INSERT INTO tblMonitor_Schedule (Member_ID, Date_Scheduled, AM_PM, Shop_Number,Duty)"
        sqlInsert += " VALUES ('" + memberID + "', '" + schedDate + "', '" + shift + "'"
        sqlInsert += ", " + shopNumber + ", '" + duty + "')"
        #print (sqlInsert)

        result = db.engine.execute(text(sqlInsert).execution_options(autocommit=True))
        if (result.rowcount > 0):
            return "SUCCESS - Assignment added to tblMonitor_Schedule"
        else:
            return "ERROR - Assignment could NOT be completed."

    if (recordID1 == '' and recordID2 != ''):
        # IF FIRST ASSIGNMENT IS OPEN
        return "ERROR - ROUTINE NOT YET IMPLEMENTED"
    
    print ('recordID1=',recordID1,' recordID2=',recordID2, ' staffID=',staffID)
    return 'SWAP COMPLETED'

def conflicts(villageID,dateScheduled,shift):
    # CONVERT DATETIME FIELD TO STRING
    dtSched = dateScheduled.strftime('%Y-%m-%d')

    # SEARCH FOR OTHER ASSIGNMENTS AT THIS TIME
    assignmentCount = db.session.query(func.count(MonitorSchedule.Member_ID))\
        .filter(MonitorSchedule.Member_ID==villageID)\
        .filter(MonitorSchedule.Date_Scheduled==dtSched)\
        .filter(MonitorSchedule.AM_PM==shift).scalar()
    return assignmentCount 
    # sqlCount = "SELECT COUNT(*) FROM tblMonitor_Schedule WHERE Member_ID = " 
    # sqlCount += "'" + villageID + "' and Date_Scheduled = '" + dtSched + "' and "
    # sqlCount += "AM_PM = '" + shift + "'"
    # print ('sqlCount=' + sqlCount)
    # recordCount = db.engine.execute(sqlCount)
    # print ('recordCount=' + str(recordCount))
    # return recordCount


# dateScheduled (date or str?)  date
def LogMonitorScheduleTransaction(transactionType,villageID,dateScheduled,shift,duty,staffID,shopNumber):
    # VALID TRANSACTION TYPES ARE ADD, ADD-MV, ADD-SWP, DELETE, DELETE NS, RMV-MV, RMV-SWP
    # CALCULATE DATE FOR START OF WEEK CONTAINING dateScheduled
    transactionDate = date.today()
    strTransactionDate = transactionDate.strftime('%m-%d-%Y')
    dtSched = datetime.strftime(dateScheduled,'%Y%m%d')
    #strDtSched = datetime.strftime(dtSched,'%m-%d-%Y')
    #strDtSched = dtSched.strftime('%m-%d-%Y')
    dayOfWeek = dateScheduled.weekday()
    #dayOfWeek = dtSched.weekday()
    #weekOf = dtSched - timedelta(dayOfWeek + 1)
    weekOf = dateScheduled - timedelta(dayOfWeek + 1)
    strWeekOf = weekOf.strftime('%m-%d-%Y')

    sqlInsert = "INSERT INTO tblMonitor_Schedule_Transactions (Transaction_Date,WeekOf,Staff_ID,"
    sqlInsert += "Member_ID,Transaction_Type,Date_Scheduled, AM_PM,Duty,ShopNumber) VALUES("
    sqlInsert += "'" + strTransactionDate +"','"  + strWeekOf + "','" + staffID + "','" + villageID 
    sqlInsert += "','" + transactionType + "','" + dtSched + "','" + shift 
    sqlInsert += "','" + duty + "'," + str(shopNumber) + ")"
    #print (sqlInsert)
    try:
        result = db.engine.execute(text(sqlInsert).execution_options(autocommit=True))
        #result = db.engine.execute(sqlInsert)
    except (SQLAlchemyError, DBAPIError) as e:
        print("ERROR -",e)
        return 0

    return result.rowcount

def LogCoordinatorWeekNote(schedDate,note,shopNumber,staffID):
    dayOfWeek = datetime.schedDate.weekday()
    weekOf = schedDate - timedelta(dayOfWeek + 1)
    sqlInsert = "INSERT INTO monitorWeekNotes (Author_ID, Date_Of_Change,Schedule_Note,WeekOf,Shop_Number) "
    sqlInsert += " VALUES ('" + staffID + "','" + today() + "','" + weekOf + "','" + str(shopNumber) + "')"
    result = db.engine.execute(text(sqlInsert).execution_options(autocommit=True))
    if (result.rowcount > 0):
        return "Entry added to monitorWeekNotes"
    else:
        return "Assignment could NOT be added to monitorWeekNotes."
#result = db.engine.execute(sqlInsert)