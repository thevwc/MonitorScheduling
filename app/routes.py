# routes.py

from flask import session, render_template, flash, redirect, url_for, request, jsonify, json, make_response
from flask_bootstrap import Bootstrap
from werkzeug.urls import url_parse
from app.models import ShopName, Member , MemberActivity
from app import app
from app import db
from sqlalchemy import func, case, desc, extract, select, update
from sqlalchemy.exc import SQLAlchemyError
import datetime
from datetime import date, timedelta

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

            # if parameters and 'duty' in parameters:
            #     dutyFilter = parameters['duty']
            # else:
            #     dutyFilter = 'BOTH'

            #print(yearFilter, shopFilter, dutyFilter)
            
            # build response object
            # BUILD WHERE CLAUSE
            
            whereClause = "WHERE DatePart(year,[Date_Scheduled]) = '" + yearFilter + "'" 
            if shopFilter == 'RA':
                whereClause += " and Shop_number = 1"

            if shopFilter == 'BW':
                whereClause += " and Shop_Number = 2"

            # if dutyFilter == 'SM':
            #     whereClause += " and Duty = 'Shop Monitor'"

            # if dutyFilter == 'TC':
            #     whereClause += " and Duty = 'Tool Crib'"
    
            # BUILD SQL SELECT STATEMENT
            SQLselect = "SELECT [Date_Scheduled], "
            SQLselect += " SUM(iif([Duty]='Shop Monitor',1,0)) AS SM_ASGND, "
            SQLselect += " SUM(iif([Duty]='Tool Crib',1,0)) AS TC_ASGND, "
            SQLselect += " DATEPART(Y,[Date_Scheduled]) AS dayNumber "
            SQLselect += " FROM tblMonitor_Schedule "
            #SQLselect += " WHERE DATEPART(year,[Date_Scheduled]) = '" + yearFilter + "'"
            
            #print('1. ' + SQLselect)

            # ADD WHERE CLAUSE
            SQLselect += whereClause
            #print('2. ' + SQLselect)

            # ADD GROUP BY CLAUSE
            SQLselect += " GROUP BY [Date_Scheduled] ORDER BY [Date_Scheduled]"
            
            #print('3. ' + SQLselect)

            # EXECUTE QUERY
            dataSet = db.engine.execute(SQLselect)

            # DECLARE ARRAY FOR DATASET AND INITIALIZE TO ZEROES
            rows = 367
            cols = 9 # Date_Scheduled, dayNumber, SM_ASGND, SM_REQD, TC_ASGND, TC_REQD
            requirements = [[0 for x in range(cols)] for y in range(rows)]
            
            # ADD tblMonitor_Schedule DATA TO 'requirements' ARRAY
            for d in dataSet:
                requirements[d.dayNumber][0] = d.Date_Scheduled.strftime("%Y%m%d")
                requirements[d.dayNumber] [1] = 'OPEN'
                requirements[d.dayNumber] [2] = d.dayNumber
                requirements[d.dayNumber][3] = d.SM_ASGND
                requirements[d.dayNumber][4] = d.TC_ASGND
            
            # ADD tblShop_Dates DAILY REQUIREMENTS TO 'requirements' ARRAY
            SQLselect2 = "SELECT [MM_DD_YYYY], [Status],"
            SQLselect2 += " SM_AM_REQD, SM_PM_REQD, TC_AM_REQD, TC_PM_REQD, "
            SQLselect2 += " DATEPART(Y,[MM_DD_YYYY]) AS dayNumber "
            SQLselect2 += " FROM tblShop_Dates  "
            SQLselect2 += " WHERE DatePart(year,[MM_DD_YYYY]) = '" + yearFilter + "'"
            print(SQLselect2)

            shopDates = db.engine.execute(SQLselect2)
            for s in shopDates:
                position = s.dayNumber
                requirements[position][0] = s.MM_DD_YYYY.strftime("%Y%m%d")
                requirements[position][1] = s.Status
                requirements[position][5] = s.SM_AM_REQD
                requirements[position][6] = s.SM_PM_REQD
                requirements[position][7] = s.TC_AM_REQD
                requirements[position][8] = s.TC_PM_REQD
                # print(requirements[position][0],
                #      requirements[position][1],
                #      requirements[position][4],
                #      requirements[position][5],
                #      requirements[position][6],
                #      requirements[position][7],
                #      requirements[position][8])

            # print(requirements[3][0],
            # requirements[3][1],
            # requirements[3][2],
            # requirements[3][3],
            # requirements[3][4],
            # requirements[3][5],
            # requirements[3][6],
            # requirements[3][7])        
            return jsonify(requirements)          
    
        else:
            return 'No data available' 
        #return json.dumps(requirements)       
        #return jsonify({"list":requirements})
        
    # GET REQUEST
    return render_template("index.html")
    # sqlMonitorSchedule = """SELECT TOP 10 Member_ID, Date_Scheduled, AM_PM, Duty FROM tblMonitor_Schedule"""
    # schedule = db.engine.execute(sqlMonitorSchedule)
    # for s in schedule:
    #     print (s.Member_ID, s.Date_Scheduled, s.AM_PM, s.Duty)

    #return render_template("index.html")
    

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

    
    # RETRIEVE DATA FROM tblMonitor_Schedule
    shopNumber = parameters['shopNumber']
    dayID = parameters['dayID']
    if (dayID == None):
        return "ERROR - Missing parameter."

    # PARSE dayID TO GET DATE scheduleDate
    monthOfDate = dayID[5:7]
    dayOfDate = dayID[-2:]
    yearOfDate = dayID[1:5]
    scheduleDate = monthOfDate + '-' + dayOfDate + '-' + yearOfDate 
    print ('scheduleDate - ' + scheduleDate)

    # DECLARE ARRAY AND SET TO ZERO
    rows = 12
    cols = 5 # Date_Scheduled, AM_PM, Member name, Village ID
    schedArray = [[0 for x in range(cols)] for y in range(rows)]
            
    sqlSelect = "SELECT tblMonitor_Schedule.Member_ID, Date_Scheduled, AM_PM, Duty, Last_Name, First_Name FROM tblMonitor_Schedule "
    sqlSelect += " JOIN tblMember_Data ON tblMonitor_Schedule.Member_ID = tblMember_Data.Member_ID "
    sqlSelect += "WHERE Shop_Number = " + shopNumber + " and Date_Scheduled = '" + scheduleDate + "'"
    print(sqlSelect)
    schedule = db.engine.execute(sqlSelect)
    position = 0
    for s in schedule:
        print(s.Date_Scheduled, s.AM_PM, s.Duty, s.Last_Name, s.First_Name, s.Member_ID)
        position += 1
        schedArray[position][0] = s.Date_Scheduled.strftime("%B %-d, %Y")
        schedArray[position][1] = s.AM_PM
        schedArray[position][2] = s.Duty
        schedArray[position][3] = s.Last_Name + ", " + s.First_Name
        schedArray[position][4] = s.Member_ID
    
    return jsonify(schedArray)
