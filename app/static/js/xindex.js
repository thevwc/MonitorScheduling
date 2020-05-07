//$(document).ready(function() {
    new Calendar(document.querySelector('.calendar'));
  
  
    //   $('#calendar').calendar({ 
  //     dataSource: [
  //         {
  //             startDate: new Date(2020, 4, 11),
  //             endDate: new Date(2020, 4, 12),
  //             color: 'yellow'
  //         },
  //         {
  //             startDate: new Date(2020, 4, 15),
  //             endDate: new Date(2020, 4, 16),
  //             color: 'pink'
  //         },
  //         {
  //             startDate: new Date(2020, 4, 25),
  //             endDate: new Date(2020, 4, 25),
  //             color: '#48A38C'
  //         }
  //     ]
  // });


//const calendar = new Calendar('.calendar');
//calendar.backgroundColor
//cal = document.getElementById(calendar)

//calendar.setDisplayHeader("HEADER":false)
//calendar.setStyle('background')
// calendar.setMaxDate(new Date());



document.querySelector('.calendar').addEventListener('clickDay', function(e) {
    console.log("Click on day: " + e.date + " (" + e.events.length + " events)");
    alert(e.date);
    console.log(this.id)
    document.getElementById(this.id).style.color = "red"
    day = document.getElementById(this.id)
    
  })

    // const calendar = new Calendar('.calendar', {
    //     clickDay: function(e) {
    //         alert('Click on day ' + e.date.toString());
    //     }
    // });
    
//})