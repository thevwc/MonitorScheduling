# routes.py

from flask import session, render_template, flash, redirect, url_for, request, jsonify, json, make_response
from flask_bootstrap import Bootstrap
from werkzeug.urls import url_parse
from app.models import ShopName, Member , MemberActivity, MonitorSchedule, MonitorScheduleTransactions, MonitorWeekNotes
from app import app
from app import db
from sqlalchemy import func, case, desc, extract, select, update, text
from sqlalchemy.exc import SQLAlchemyError, IntegrityError, DBAPIError

import datetime
from datetime import date, timedelta
from datetime import datetime

@app.route('/')
@app.route('/index', methods=['GET','POST'])
def index():
    # POST REQUEST
    if request.method == 'POST':
        if not request.get_json() == None:
            #print(request.get_json())
            parameters = request.get_json()
            if parameters and 'year' in parameters:
                 yearFilter=parameters['year']
            else:
                currentYear = datetime.date.year
                #.now().year
                print('The current year is ' + currentYear)
                yearFilter=currentYear

            if parameters and 'shop' in parameters:
                shopFilter = parameters['shop']
            else:
                shopFilter = 'BOTH'
                shopNumber = 0

            # build response object
            # BUILD WHERE CLAUSE
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
   
    

# @app.route('/')
# @app.route('/month')
# def month():
#     return render_template("month,html")
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
    print(scheduleDate)
    schedDateToDisplay = datetime.strptime(scheduleDate,'%m-%d-%Y')

    #schedDateToDisplay = (yearOfDate + '-' + monthOfDate + '-' + dayOfDate)
    print (schedDateToDisplay)

    #print ('scheduleDate - ' + scheduleDate)

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
    sqlSelect = "SELECT tblMonitor_Schedule.ID as RecordID, Shop_Number, tblMonitor_Schedule.Member_ID,"
    sqlSelect += " DatePart(Y,[Date_Scheduled]) as dayNumber, Date_Scheduled, AM_PM, Duty, Last_Name, First_Name FROM tblMonitor_Schedule "
    sqlSelect += " JOIN tblMember_Data ON tblMonitor_Schedule.Member_ID = tblMember_Data.Member_ID "
    sqlSelect += sqlWhereClause
    sqlSelect += sqlOrderBy 
    
    schedule = db.engine.execute(sqlSelect)
    position = 0
    if (schedule == None):
        return 'NO DATA'

    # STORE SHOP NUMBER AND DATE SCHEDULED IN POSITION 0
    schedArray[0][0] = shopNumber
    schedArray[0][1] = schedDateToDisplay.strftime("%B %-d, %Y")

    # BUILD ARRAY WITH ONE ASSIGNMENT PER ROW (POSITION)
    for s in schedule:
        position += 1
        schedArray[position][0] = s.Shop_Number
        schedArray[position][1] = s.Date_Scheduled.strftime("%B %-d, %Y")
        schedArray[position][2] = s.AM_PM
        schedArray[position][3] = s.Duty
        schedArray[position][4] = s.Last_Name + ", " + s.First_Name
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
        return "ERROR - Missing parameter."

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
        print('ID:' + ms.memberID,ms.displayName, ms.Date_Scheduled)
        schedArray[position][0] = ms.memberID
        schedArray[position][1] = ms.Shop_Number
        schedArray[position][2] = ms.displayName
        schedArray[position][3] = ms.trainingDate.strftime("%-m/%-d/%Y")
        
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
        return "Record no longer exists."

    memberID=assignment.Member_ID
    dateScheduled=assignment.Date_Scheduled
    ampm=assignment.AM_PM
    duty=assignment.Duty
    print('To be deleted -',memberID,ampm, duty)

    # DELETE THE ASSIGNMENT VIA RAW SQL
    sqlDelete = "DELETE FROM tblMonitor_Schedule WHERE ID = " + recordID
    db.engine.execute(sqlDelete)

    # the following does not work with autoincrement primary key 
    #..............................
    # try:
    #     db.session.delete(assignment)
    #     db.session.commit
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

    return "The assignment has been removed from the database."
    
    
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
    assignmentExists = MonitorSchedule.query.filter_by(Member_ID=memberID,
        Date_Scheduled = schedDate,
        AM_PM = Shift,
        Duty = Duty).first()
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
    #print (sqlInsert)

    result = db.engine.execute(text(sqlInsert).execution_options(autocommit=True))
    if (result.rowcount > 0):
        return "Assignment added to tblMonitor_Schedule"
    else:
        return "Assignment could NOT be completed."

    