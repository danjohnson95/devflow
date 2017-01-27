module.exports = {

    short_month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sept","Oct","Nov","Dec"],
    long_month: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    long_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    suffix_st: [1, 21, 31],
    suffix_nd: [2, 22],
    suffix_rd: [3, 23],

    getDifference: function(date){
        date = new Date(date);
        
        var seconds = Math.floor((new Date() - date) / 1000);
        var interval = Math.floor(seconds / 3600);

        if (interval > 23) {
            return date.getDate()+" "+this.short_month[date.getMonth()]+" "+date.getFullYear();
        }
        if (interval >= 1) {
            return interval + " hrs ago";
        }
        interval = seconds / 60;
        if (interval > 1) {
            if(Math.floor(interval) == 1) return "a minute ago";
            return Math.floor(interval) + " minutes ago";
        }

        return "a few seconds ago";
    },

    zeroPad: function(size, digit){
        console.log(digit.length);
        if((digit.toString()).length < size) return "0"+digit;
        return digit;
    },

    getAMPM: function(date){
        return date.getHours() > 11 ? "pm" : "am";
    },

    getDateWithSuffix: function(date){
        var dateNo = date.getDate();
        if(this.suffix_st.indexOf(dateNo) > -1) return dateNo+"st";
        if(this.suffix_nd.indexOf(dateNo) > -1) return dateNo+"nd";
        if(this.suffix_rd.indexOf(dateNo) > -1) return dateNo+"rd";
        return dateNo+"th";
    },

    get12Hour: function(date){
        if(date.getHours() == 0) return 12;
        if(date.getHours() > 12) return date.getHours() - 12;
        return date.getHours();
    },

    getTime: function(date){
        return this.get12Hour(date)+
        ":"+
        this.zeroPad(2, date.getMinutes())+
        ":"+
        this.zeroPad(2, date.getSeconds())+
        this.getAMPM(date);
    },

    getDate: function(date){
        return this.long_days[date.getDay()]+
                ", "+
                this.getDateWithSuffix(date)+
                " "+
                this.long_month[date.getMonth()]+
                " "+
                date.getFullYear();
    },

    getStamp: function(date){
        date = new Date(date);
        return this.getDate(date)+", "+this.getTime(date);
        //return date.getHours()+":"+date.getMinutes()+" "+date.getDate()+" "+this.short_month[date.getMonth()]+" "+date.getFullYear(); 
    },

    html: function(date){
        return "<time title='"+this.getStamp(date)+"'>"+this.getDifference(date)+"</time>";
    }
    
}
